package com.ogon.timetracker.controllers;

import com.ogon.timetracker.dto.TaskDTO;
import com.ogon.timetracker.entities.TaskEntity;
import com.ogon.timetracker.repositories.TaskRepository;
import com.ogon.timetracker.services.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
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
    public ResponseEntity<Map<String, Object>> saveTasksNew(@RequestBody List<Map<String, Object>> tasks) {

        if (tasks == null || tasks.isEmpty()) {
            return ResponseEntity.badRequest().body(
                    Map.of("error", "Task list cannot be empty")
            );
        }

        List<TaskEntity> toInsert = new ArrayList<>();
        List<TaskEntity> toUpdate = new ArrayList<>();
        List<String> updateLogs = new ArrayList<>();

        for (Map<String, Object> dto : tasks) {

            Long rowId = dto.get("rowId") != null
                    ? Long.valueOf(dto.get("rowId").toString())
                    : null;

            String email = (String) dto.get("email");
            String firstName = (String) dto.get("firstName");
            String lastName = (String) dto.get("lastName");
            String client = (String) dto.get("client");
            String ticket = (String) dto.get("ticket");
            String ticketDescription = (String) dto.get("ticketDescription");
            String category = (String) dto.get("category");
            String description = (String) dto.get("description");
            String billable = (String) dto.get("billable");

            Map<String, Object> hoursByDate = (Map<String, Object>) dto.get("hoursByDate");
            if (hoursByDate == null || hoursByDate.isEmpty()) continue;

            /* ===========================================================
             * 1️⃣ EXISTING WEEKLY GROUP → UPDATE LOGIC
             * =========================================================== */
            if (rowId != null) {

                List<TaskEntity> existingRows = taskRepository.findByRowId(rowId);

                if (!existingRows.isEmpty()) {

                    // 1. Detect static field changes
                    TaskEntity ref = existingRows.get(0);
                    boolean staticChanged =
                            !Objects.equals(ref.getClient(), client) ||
                                    !Objects.equals(ref.getTicket(), ticket) ||
                                    !Objects.equals(ref.getTicketDescription(), ticketDescription) ||
                                    !Objects.equals(ref.getCategory(), category) ||
                                    !Objects.equals(ref.getDescription(), description) ||
                                    !Objects.equals(ref.getBillable(), billable);

                    // 2. Update existing dates
                    for (TaskEntity existing : existingRows) {
                        String date = existing.getDate();

                        Object newHoursObj = hoursByDate.get(date);

                        if (newHoursObj != null) {
                            double newHours = Double.parseDouble(newHoursObj.toString());

                            if (Double.compare(existing.getHours(), newHours) != 0) {
                                existing.setHours(newHours);
                                updateLogs.add("Updated hours | rowId=" + rowId + " date=" + date);
                            }
                        }

                        // Update static fields IF changed
                        if (staticChanged) {
                            existing.setClient(client);
                            existing.setTicket(ticket);
                            existing.setTicketDescription(ticketDescription);
                            existing.setCategory(category);
                            existing.setDescription(description);
                            existing.setBillable(billable);
                            existing.setEmail(email);
                            existing.setFirstName(firstName);
                            existing.setLastName(lastName);
                        }

                        toUpdate.add(existing);
                    }

                    // 3. Insert NEW DATES not present in DB
                    Set<String> existingDates =
                            existingRows.stream().map(TaskEntity::getDate).collect(Collectors.toSet());

                    for (Map.Entry<String, Object> e : hoursByDate.entrySet()) {
                        String date = e.getKey();
                        Object hoursObj = e.getValue();

                        if (!existingDates.contains(date)) {
                            double hours = Double.parseDouble(hoursObj.toString());

                            TaskEntity newRow = TaskEntity.builder()
                                    .rowId(rowId)
                                    .email(email)
                                    .firstName(firstName)
                                    .lastName(lastName)
                                    .client(client)
                                    .ticket(ticket)
                                    .ticketDescription(ticketDescription)
                                    .category(category)
                                    .description(description)
                                    .billable(billable)
                                    .hours(hours)
                                    .date(date)
                                    .build();

                            toInsert.add(newRow);
                            updateLogs.add("Inserted NEW date | rowId=" + rowId + " date=" + date);
                        }
                    }

                    continue; // Done with update block
                }
            }

            /* ===========================================================
             * 2️⃣ NEW WEEKLY ENTRY → INSERT LOGIC
             * =========================================================== */

            rowId = taskRepository.getNextRowId();

            for (Map.Entry<String, Object> e : hoursByDate.entrySet()) {
                Object hoursObj = e.getValue();
                if (hoursObj == null || hoursObj.toString().isBlank()) continue;

                double hours = Double.parseDouble(hoursObj.toString());
                String date = e.getKey();

                TaskEntity entity = TaskEntity.builder()
                        .rowId(rowId)
                        .email(email)
                        .firstName(firstName)
                        .lastName(lastName)
                        .client(client)
                        .ticket(ticket)
                        .ticketDescription(ticketDescription)
                        .category(category)
                        .description(description)
                        .billable(billable)
                        .hours(hours)
                        .date(date)
                        .build();

                toInsert.add(entity);
                updateLogs.add("Inserted NEW weekly row | rowId=" + rowId + " date=" + date);
            }
        }

        // SAVE ALL
        if (!toInsert.isEmpty()) taskRepository.saveAll(toInsert);
        if (!toUpdate.isEmpty()) taskRepository.saveAll(toUpdate);

        return ResponseEntity.ok(
                Map.of(
                        "inserted", toInsert.size(),
                        "updated", toUpdate.size(),
                        "updateLogs", updateLogs,
                        "message", "Tasks Saved successfully"
                )
        );
    }



    private final TaskService taskService; // instance of TaskService

    @GetMapping("/effort-entry-horizon")
    public  ResponseEntity<Map<String, Object>> getEffortEntries(
            @RequestParam String email,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        List<TaskDTO> results =  taskService.getMergedEffortsByDate(email, startDate, endDate);

        Map<String, Object> response = new HashMap<>();
        if(results.size() > 0 )
        {
            response.put("message", "Effort Entries Fetched For This Week");
            response.put("data", results);
            return ResponseEntity.ok(response);
        }
        response.put("message","No Effort Entries Found");
//        response.put("data", results);
       return  ResponseEntity.ok(response);
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

