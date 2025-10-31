package com.ogon.timetracker.controllers;

import com.ogon.timetracker.dto.TaskDTO;
import com.ogon.timetracker.entities.TaskEntity;
import com.ogon.timetracker.repositories.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;



@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class TaskController {
    private final TaskRepository taskRepository;
    private final DateTimeFormatter dbFormatter = DateTimeFormatter.ofPattern("dd-MM-yyyy");
    private final DateTimeFormatter inputFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    @PostMapping("/tasks")
    public ResponseEntity<Map<String, String>> saveTasks(@RequestBody List<TaskDTO> tasks) {
        if (tasks == null || tasks.isEmpty()) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of("error", "Task list cannot be empty"));
        }

//        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MM/dd/yyyy");
        List<TaskEntity> validTasks = new ArrayList<>();
        for (TaskDTO dto : tasks) {
            if (dto.getClient() != null && !dto.getClient().isEmpty()
                    && dto.getTicket() != null && !dto.getTicket().isEmpty()
                    && dto.getCategory() != null && !dto.getCategory().isEmpty()
                    && dto.getDescription() != null && !dto.getDescription().isEmpty()
                    && dto.getBillable() != null && !dto.getBillable().isEmpty()
                    && dto.getDate() != null && !dto.getDate().isEmpty()
                    && dto.getTicketDescription() !=null && !dto.getTicketDescription().isEmpty() ) {

                TaskEntity entity = TaskEntity.builder()
                        .email(dto.getEmail())
                        .firstName(dto.getFirstName())
                        .lastName(dto.getLastName())
                        .client(dto.getClient().toUpperCase())
                        .ticket(dto.getTicket())
                        .category(dto.getCategory())
                        .description(dto.getDescription())
                        .billable(dto.getBillable())
                        .hours(dto.getHours())
                        .date(dto.getDate())
                        .ticketDescription(dto.getTicketDescription())
                        .build();

                validTasks.add(entity);
            }
        }

        if (validTasks.isEmpty()) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of("error", "No tasks to save. All fields are required."));
        }

        taskRepository.saveAll(validTasks);

        return ResponseEntity.ok(Map.of(
                "message", validTasks.size() + " task(s) saved successfully!"
        ));
    }
    @PostMapping("/tasks-new")
    public ResponseEntity<Map<String, String>> saveTasksNew(@RequestBody List<Map<String, Object>> tasks) {
        if (tasks == null || tasks.isEmpty()) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of("error", "Task list cannot be empty"));
        }

        List<TaskEntity> validTasks = new ArrayList<>();

        for (Map<String, Object> dto : tasks) {
            String email = (String) dto.get("email");
            String firstName = (String) dto.get("firstName");
            String lastName = (String) dto.get("lastName");
            String client = (String) dto.get("client");
            String ticket = (String) dto.get("ticket");
            String category = (String) dto.get("category");
            String description = (String) dto.get("description");
            String billable = (String) dto.get("billable");
            String ticketDescription = (String) dto.get("ticketDescription");

            // ✅ Extract hoursByDate map safely
            Map<String, Object> hoursByDate = (Map<String, Object>) dto.get("hoursByDate");

            if (hoursByDate != null && !hoursByDate.isEmpty()) {
                for (Map.Entry<String, Object> entry : hoursByDate.entrySet()) {
                    String date = entry.getKey();
                    Object hoursObj = entry.getValue();

                    if (hoursObj == null || hoursObj.toString().isBlank()) continue;

                    double hours;
                    try {
                        hours = Double.parseDouble(hoursObj.toString());
                    } catch (NumberFormatException e) {
                        continue; // Skip invalid hours
                    }

                    // ✅ Create one TaskEntity per date entry
                    TaskEntity entity = TaskEntity.builder()
                            .email(email)
                            .firstName(firstName)
                            .lastName(lastName)
                            .client(client != null ? client.toUpperCase() : null)
                            .ticket(ticket)
                            .ticketDescription(ticketDescription)
                            .category(category)
                            .description(description)
                            .billable(billable)
                            .hours(hours)
                            .date(date) // "dd-MM-yyyy" format from frontend
                            .build();

                    validTasks.add(entity);
                }
            }
        }

        if (validTasks.isEmpty()) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of("error", "No valid tasks found. Please check input data."));
        }

        taskRepository.saveAll(validTasks);

        return ResponseEntity.ok(Map.of(
                "message", validTasks.size() + " task(s) saved successfully!"
        ));
    }



    @GetMapping("/tasks/summary-by-range")
    public ResponseEntity<Map<String, Object>> getSummary(
            @RequestParam String email,
            @RequestParam String startDate,
            @RequestParam String endDate
    ) {
        if (email == null || email.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
        }
        if (startDate == null || startDate.isEmpty() || endDate == null || endDate.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Start date and end date are required"));
        }

//        LocalDate startDt = LocalDate.parse(startDate, inputFormatter);
//        String outStartDt = startDt.format(dbFormatter);
//
//        LocalDate endDt = LocalDate.parse(startDate, inputFormatter);
//        String outEndDt = endDt.format(dbFormatter);

        LocalDate startDt = LocalDate.parse(startDate, dbFormatter);
        LocalDate endDt= LocalDate.parse(endDate, dbFormatter);

        // Fetch tasks from DB between startDb and endDb
        List<TaskEntity> tasks = taskRepository.findByEmailAndDateBetweenString(
                email,
                startDt,
                endDt
        );

        // Convert TaskEntity -> TaskDTO
        List<TaskDTO> result = tasks.stream()
                .map(t -> TaskDTO.builder()
                        .id(t.getId())
                        .client(t.getClient())
                        .ticket(t.getTicket())
                        .ticketDescription(t.getTicketDescription())
                        .category(t.getCategory())
                        .description(t.getDescription())
                        .billable(t.getBillable())
                        .hours(t.getHours())
                        .date(t.getDate())
                        .build())
                .collect(Collectors.toList());
        if(result.toArray().length > 0)
        {
            return ResponseEntity.ok(Map.of("data", result));
        }
        else if(result.toArray().length == 0){
            return ResponseEntity.ok(Map.of("message","No Task Present for entered dates"));
        }

        return ResponseEntity.status(400).body(Map.of("message","Server Error"));
    }


    @PutMapping("/tasks/{id}")
    public ResponseEntity<Map<String, Object>> updateTask(
            @PathVariable Long id,
            @RequestBody TaskDTO taskDTO
    ) {
        Optional<TaskEntity> optionalTask = taskRepository.findById(id);
        if (optionalTask.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Task not found with id: " + id));
        }



        TaskEntity task = optionalTask.get();


        boolean isChanged = false;

        if (!Objects.equals(task.getClient(), taskDTO.getClient())) isChanged = true;
        if (!Objects.equals(task.getTicket(), taskDTO.getTicket())) isChanged = true;
        if (!Objects.equals(task.getTicketDescription(), taskDTO.getTicketDescription())) isChanged = true;
        if (!Objects.equals(task.getCategory(), taskDTO.getCategory())) isChanged = true;
        if (!Objects.equals(task.getDescription(), taskDTO.getDescription())) isChanged = true;
        if (!Objects.equals(task.getBillable(), taskDTO.getBillable())) isChanged = true;
        if (!Objects.equals(task.getHours(), taskDTO.getHours())) isChanged = true;
        if (!Objects.equals(task.getDate(), taskDTO.getDate())) isChanged = true;

        if (!isChanged) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "No changes detected. Task not updated."));
        }
        else {

            // Update fields from DTO
            task.setClient(taskDTO.getClient().toUpperCase());
            task.setTicket(taskDTO.getTicket());
            task.setTicketDescription(taskDTO.getTicketDescription());
            task.setCategory(taskDTO.getCategory());
            task.setDescription(taskDTO.getDescription());
            task.setBillable(taskDTO.getBillable());
            task.setHours(taskDTO.getHours());
            task.setDate(taskDTO.getDate());

            // Save updated task
            TaskEntity updatedTask = taskRepository.save(task);

            // Convert to DTO to return
            TaskDTO updatedDTO = TaskDTO.builder()
                    .id(updatedTask.getId())
                    .client(updatedTask.getClient())
                    .ticket(updatedTask.getTicket())
                    .ticketDescription(updatedTask.getTicketDescription())
                    .category(updatedTask.getCategory())
                    .description(updatedTask.getDescription())
                    .billable(updatedTask.getBillable())
                    .hours(updatedTask.getHours())
                    .date(updatedTask.getDate())
                    .build();

            return ResponseEntity.ok(Map.of("data", updatedDTO));}
    }
}

