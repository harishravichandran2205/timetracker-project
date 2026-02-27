package com.ogon.timetracker.controllers;

import com.ogon.timetracker.dto.AdminSummaryDTO;
import com.ogon.timetracker.dto.TaskDTO;
import com.ogon.timetracker.entities.TaskEntity;
import com.ogon.timetracker.rendererer.TimeTrackerRenderer;
import com.ogon.timetracker.repositories.TaskRepository;
import com.ogon.timetracker.repositories.UserRepository;
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

import static com.ogon.timetracker.rendererer.TimeTrackerRenderer.findByEmailAddr;


@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class TaskController {
    private final TaskRepository taskRepository;
    private final DateTimeFormatter dbFormatter = DateTimeFormatter.ofPattern("dd-MM-yyyy");
    private final DateTimeFormatter inputFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private LocalDate parseWorkDate(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return LocalDate.parse(value, dbFormatter);
        } catch (Exception ignored) {
            return LocalDate.parse(value, inputFormatter);
        }
    }

    @PostMapping("/tasks")
    public ResponseEntity<Map<String, String>> saveTasks(@RequestBody List<TaskDTO> tasks) {
        if (tasks == null || tasks.isEmpty()) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of("error", "Task list cannot be empty"));
        }

//        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MM/dd/yyyy");
        List<TaskEntity> validTasks = new ArrayList<>();
        Long userId =0L;
        for (TaskDTO dto : tasks) {
            if (dto.getClient() != null && !dto.getClient().isEmpty()
                    && dto.getTicket() != null && !dto.getTicket().isEmpty()
                    && dto.getCategory() != null && !dto.getCategory().isEmpty()
                    && dto.getDescription() != null && !dto.getDescription().isEmpty()
                    && dto.getBillable() != null && !dto.getBillable().isEmpty()
                    && dto.getDate() != null && !dto.getDate().isEmpty()
                    && dto.getTicketDescription() !=null && !dto.getTicketDescription().isEmpty() ) {
                ;
                if(userId == 0) userId = userRepository.findByEmail(dto.getEmail()).get().getId();

                TaskEntity entity = TaskEntity.builder()
                        .userId(userId)
                        .firstName(dto.getFirstName())
                        .lastName(dto.getLastName())
                        .client(dto.getClient().toUpperCase())
                        .project(dto.getProject())
                        .ticket(dto.getTicket())
                        .category(dto.getCategory())
                        .description(dto.getDescription())
                        .billable(dto.getBillable())
                        .hours(dto.getHours())
                        .date(dto.getDate())
                        .workDate(parseWorkDate(dto.getDate()))
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
        Long user_Id =0L;
        for (Map<String, Object> dto : tasks) {

            Long rowId = dto.get("rowId") != null
                    ? Long.valueOf(dto.get("rowId").toString())
                    : null;

            String email = (String) dto.get("email");
            if(user_Id == 0) user_Id = userRepository.findByEmail(email).get().getId();
            String firstName = (String) dto.get("firstName");
            String lastName = (String) dto.get("lastName");
            String client = (String) dto.get("client");
            String project = (String) dto.get("project");
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
                                    !Objects.equals(ref.getProject(), project) ||
                                    !Objects.equals(ref.getTicket(), ticket) ||
                                    !Objects.equals(ref.getTicketDescription(), ticketDescription) ||
                                    !Objects.equals(ref.getCategory(), category) ||
                                    !Objects.equals(ref.getDescription(), description) ||
                                    !Objects.equals(ref.getBillable(), billable);

                    // 2. Update existing dates
                    for (TaskEntity existing : existingRows) {
                        boolean rowChanged = false; // ✅ NEW FLAG
                        String date = existing.getDate();

                        Object newHoursObj = hoursByDate.get(date);

                        if (newHoursObj != null) {
                            double newHours = Double.parseDouble(newHoursObj.toString());

                            if (Double.compare(existing.getHours(), newHours) != 0) {
                            existing.setHours(newHours);
                            existing.setWorkDate(parseWorkDate(date));
                            rowChanged = true;
                            updateLogs.add("Updated hours | rowId=" + rowId + " date=" + date);
                            }
                        }
                        // Update static fields IF changed
                        if (staticChanged) {
                            existing.setClient(client);
                            existing.setProject(project);
                            existing.setTicket(ticket);
                            existing.setTicketDescription(ticketDescription);
                            existing.setCategory(category);
                            existing.setDescription(description);
                            existing.setBillable(billable);
                            existing.setUserId(user_Id);
                            existing.setFirstName(firstName);
                            existing.setLastName(lastName);
                            existing.setWorkDate(parseWorkDate(date));
                            rowChanged = true;
                            updateLogs.add("Updated fields | rowId=" + rowId + " date=" + date);
                        }

                        if (rowChanged) {
                            toUpdate.add(existing);
                            taskRepository.save(existing);
                        }
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
                                    .userId(user_Id)
                                    .firstName(firstName)
                                    .lastName(lastName)
                                    .client(client)
                                    .project(project)
                                    .ticket(ticket)
                                    .ticketDescription(ticketDescription)
                                    .category(category)
                                    .description(description)
                                    .billable(billable)
                                    .hours(hours)
                                    .date(date)
                                    .workDate(parseWorkDate(date))
                                    .build();

                            toInsert.add(newRow);
                            taskRepository.save(newRow);
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
                        .userId(user_Id)
                        .firstName(firstName)
                        .lastName(lastName)
                        .client(client)
                        .project(project)
                        .ticket(ticket)
                        .ticketDescription(ticketDescription)
                        .category(category)
                        .description(description)
                        .billable(billable)
                        .hours(hours)
                        .date(date)
                        .workDate(parseWorkDate(date))
                        .build();

                toInsert.add(entity);
                taskRepository.save(entity);
                updateLogs.add("Inserted NEW weekly row | rowId=" + rowId + " date=" + date);
            }
        }

        // SAVE ALL
        /*if (!toInsert.isEmpty()) taskRepository.saveAll(toInsert);
        if (!toUpdate.isEmpty()) taskRepository.saveAll(toUpdate);*/

        String message;

        if (!toInsert.isEmpty() && toUpdate.isEmpty()) {
            message = "Task(s) saved successfully";
        }
        else if (toInsert.isEmpty() && !toUpdate.isEmpty()) {
            message = "Task(s) updated successfully";
        }
        else if (!toInsert.isEmpty() && !toUpdate.isEmpty()) {
            message = "Task(s) saved and updated successfully";
        }
        else {
            message = "Task(s) already saved";
        }

        return ResponseEntity.ok(
                Map.of(
                        "inserted", toInsert.size(),
                        "updated", toUpdate.size(),
                        "updateLogs", updateLogs,
                        "message", message
                )
        );
    }



    private final TaskService taskService; // instance of TaskService
    private final UserRepository userRepository;

    @GetMapping("/effort-entry-horizon")
    public  ResponseEntity<Map<String, Object>> getEffortEntries(
            @RequestParam String email,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        Long user_Id =userRepository.findByEmail(email).get().getId();
        List<TaskDTO> results =  taskService.getMergedEffortsByDate(user_Id, startDate, endDate);

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

    @GetMapping("/tickets/description")
    public ResponseEntity<Map<String, Object>> getTicketDescriptionByTicket(@RequestParam String ticket) {
        if (ticket == null || ticket.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Ticket number is required"));
        }

        String normalizedTicket = ticket.trim();
        boolean exists = taskRepository.countByTicket(normalizedTicket) > 0;
        String ticketDescription = taskRepository
                .findLatestTicketDescriptionByTicket(normalizedTicket)
                .orElse("");

        return ResponseEntity.ok(Map.of(
                "ticket", normalizedTicket,
                "exists", exists,
                "ticketDescription", ticketDescription
        ));
    }

    @PutMapping("/tickets/description")
    public ResponseEntity<Map<String, Object>> updateTicketDescription(@RequestBody Map<String, String> payload) {
        String ticket = payload.get("ticket");
        String ticketDescription = payload.get("ticketDescription");

        if (ticket == null || ticket.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Ticket number is required"));
        }
        if (ticketDescription == null || ticketDescription.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Ticket description is required"));
        }

        String normalizedTicket = ticket.trim();
        String normalizedDescription = ticketDescription.trim();

        List<TaskEntity> ticketRows = taskRepository.findAllByTicket(normalizedTicket);
        if (ticketRows.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Ticket not found"));
        }

        ticketRows.forEach(row -> row.setTicketDescription(normalizedDescription));
        taskRepository.saveAll(ticketRows);

        return ResponseEntity.ok(Map.of(
                "message", "Ticket description updated",
                "ticket", normalizedTicket,
                "updatedRows", ticketRows.size()
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

        Long user_Id = userRepository.findByEmail(email).get().getId();
        // Fetch tasks from DB between startDb and endDb
        List<TaskEntity> tasks = taskRepository.findByUserIdAndDateBetweenString(
                user_Id,
                startDt,
                endDt
        );

        // Convert TaskEntity -> TaskDTO
        List<TaskDTO> result = tasks.stream()
                .map(t -> TaskDTO.builder()
                        .id(t.getId())
                        .client(t.getClient())
                        .project(t.getProject())
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
        if (!Objects.equals(task.getProject(), taskDTO.getProject())) isChanged = true;
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
            task.setProject(taskDTO.getProject());
            task.setTicket(taskDTO.getTicket());
            task.setTicketDescription(taskDTO.getTicketDescription());
            task.setCategory(taskDTO.getCategory());
            task.setDescription(taskDTO.getDescription());
            task.setBillable(taskDTO.getBillable());
            task.setHours(taskDTO.getHours());
            task.setDate(taskDTO.getDate());
            task.setWorkDate(parseWorkDate(taskDTO.getDate()));

            // Save updated task
            TaskEntity updatedTask = taskRepository.save(task);

            // Convert to DTO to return
            TaskDTO updatedDTO = TaskDTO.builder()
                    .id(updatedTask.getId())
                    .client(updatedTask.getClient())
                    .project(updatedTask.getProject())
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

// ...

    @PostMapping("admin-panel/search")
    public ResponseEntity<Map<String, Object>> searchAdminSummary(
            @RequestBody Map<String, Object> payload
    ) {

        String searchBy   = (String) payload.get("searchBy");
        String client     = (String) payload.get("client");
        String startDate  = (String) payload.get("startDate");
        String endDate    = (String) payload.get("endDate");

        Boolean exportAll = (Boolean) payload.getOrDefault("exportAll", false);

        @SuppressWarnings("unchecked")
        List<String> emails = (List<String>) payload.get("emails");

        // ===== Validation =====
        if (searchBy == null || startDate == null || endDate == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid request"));
        }

        LocalDate startDt = LocalDate.parse(startDate, dbFormatter);
        LocalDate endDt   = LocalDate.parse(endDate, dbFormatter);

        List<TaskEntity> tasks = new ArrayList<>();

        // ===== Fetch Data =====
        if ("client".equalsIgnoreCase(searchBy)) {

            tasks = taskRepository.getSummaryByClientAndDateRange(
                    client, startDt, endDt
            );

        } else if ("email".equalsIgnoreCase(searchBy)) {

            List<Long> userIds =
                    taskRepository.findUserIdsByEmailIn(emails);

            if (!userIds.isEmpty()) {
                tasks = taskRepository.findByUserIdsAndDateBetweenString(
                        userIds, startDt, endDt
                );
            }

        } else if ("both".equalsIgnoreCase(searchBy)) {

            List<Long> userIds =
                    taskRepository.findUserIdsByEmailIn(emails);

            if (!userIds.isEmpty()) {
                tasks = taskRepository.getSummaryByClientAndUserIdsAndDateRange(
                        client, userIds, startDt, endDt
                );
            }
        }
        List<AdminSummaryDTO> summary = buildSummaryData(tasks);


        return ResponseEntity.ok(Map.of("data", summary));
    }
    private List<AdminSummaryDTO> buildSummaryData(List<TaskEntity> tasks) {

        Map<String, AdminSummaryDTO> map = new LinkedHashMap<>();

        for (TaskEntity task : tasks) {

            if (task == null || task.getTicket() == null) continue;

            String key = String.join("||",
                    Objects.toString(task.getClient(), ""),
                    Objects.toString(task.getProject(), ""),
                    Objects.toString(task.getTicket(), ""),
                    Objects.toString(task.getTicketDescription(), "")
            );

            AdminSummaryDTO summary = map.get(key);

            if (summary == null) {
                summary = AdminSummaryDTO.builder()
                        .client(task.getClient())
                        .project(task.getProject())
                        .ticket(task.getTicket())
                        .ticketDescription(task.getTicketDescription())
                        .billableHours(0)
                        .nonBillableHours(0)
                        .descriptions(new HashSet<>())
                        .build();

                map.put(key, summary);
            }

            double hours = task.getHours() != null ? task.getHours() : 0;

            if ("Yes".equalsIgnoreCase(task.getBillable())) {
                summary.setBillableHours(summary.getBillableHours() + hours);
            } else {
                summary.setNonBillableHours(summary.getNonBillableHours() + hours);
            }

            if (task.getDescription() != null && !task.getDescription().isBlank()) {
                summary.getDescriptions().add(task.getDescription().trim());
            }
        }

        return new ArrayList<>(map.values());
    }



}

