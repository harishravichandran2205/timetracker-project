package com.ogon.timetracker.controllers;

import com.ogon.timetracker.dto.ClientReqDto;
import com.ogon.timetracker.dto.TaskTypeDto;
import com.ogon.timetracker.dto.UserRoleDto;
import com.ogon.timetracker.entities.ClientEntity;
import com.ogon.timetracker.entities.TaskTypeEntity;
import com.ogon.timetracker.entities.User;
import com.ogon.timetracker.enums.Role;
import com.ogon.timetracker.repositories.ClientRepository;
import com.ogon.timetracker.repositories.TaskTypeRepository;
import com.ogon.timetracker.repositories.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
@RestController
@RequestMapping("/api/admin-panel")
@CrossOrigin(origins = "http://localhost:3000")
public class ClientController {

    private final ClientRepository clientRepository;

    private final UserRepository userRepository;

    private final TaskTypeRepository taskTypeRepository;

    public ClientController(ClientRepository clientRepository,
                            TaskTypeRepository taskTypeRepository, UserRepository userRepository) {
        this.clientRepository = clientRepository;
        this.taskTypeRepository = taskTypeRepository;
        this.userRepository = userRepository;
    }

    // ===== ADD =====
    @PostMapping("/add")
    public ResponseEntity<?> addClient(@RequestBody ClientEntity req) {

        if (req.getClientCd() == null || req.getClientName() == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Client Code and Client Name are required"));
        }

        if (clientRepository.existsByClientCd(req.getClientCd())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Client Code already exists"));
        }

        if (clientRepository.existsByClientName(req.getClientName())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Client Name already exists"));
        }

        clientRepository.save(req);
        return ResponseEntity.ok(Map.of("message", "Client added successfully"));
    }

    // ===== DELETE =====
    @PostMapping("/delete")
    public ResponseEntity<?> deleteClient(@RequestBody ClientEntity req) {

        if (req.getClientCd() == null && req.getClientName() == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Client Code or Client Name is required"));
        }

        Optional<ClientEntity> clientOpt =
                req.getClientCd() != null
                        ? clientRepository.findByClientCd(req.getClientCd())
                        : clientRepository.findByClientName(req.getClientName());

        if (clientOpt.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Client not found"));
        }

        clientRepository.delete(clientOpt.get());
        return ResponseEntity.ok(Map.of("message", "Client deleted successfully"));
    }

    // ===== MODIFY =====
    @PostMapping("/modify")
    public ResponseEntity<?> modifyClient(@RequestBody ClientReqDto req) {

        if (req.getOldClientCd() == null && req.getOldClientName() == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Old Client Code or Old Client Name is required"));
        }

        Optional<ClientEntity> clientOpt =
                req.getOldClientCd() != null
                        ? clientRepository.findByClientCd(req.getOldClientCd())
                        : clientRepository.findByClientName(req.getOldClientName());

        if (clientOpt.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Client not found"));
        }

        ClientEntity client = clientOpt.get();

        if (req.getNewClientCd() != null) {
            client.setClientCd(req.getNewClientCd());
        }
        if (req.getNewClientName() != null) {
            client.setClientName(req.getNewClientName());
        }

        clientRepository.save(client);
        return ResponseEntity.ok(Map.of("message", "Client updated successfully"));
    }

    @GetMapping("/client/{clientCode}")
    public ResponseEntity<?> getClientByCode(@PathVariable String clientCode) {

        ClientEntity client = clientRepository
                .findByClientCd(clientCode.toUpperCase())
                .orElse(null);

        if (client == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Client not found"));
        }

        return ResponseEntity.ok(
                Map.of(
                        "clientCode", client.getClientCd(),
                        "clientName", client.getClientName()
                )
        );
    }


    @GetMapping("/client-codes")
    public ResponseEntity<?> getClientCodes() {
        return ResponseEntity.ok(clientRepository.findAllClientCodes());
    }



    @PostMapping("/task-type/add")
    public ResponseEntity<?> addTaskType(@RequestBody TaskTypeDto req) {

        if (req.getClientCode() == null || req.getClientCode().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Client Code is required"));
        }

        if (req.getTaskType() == null || req.getTaskType().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Task Type is required"));
        }

        ClientEntity client = clientRepository
                .findByClientCd(req.getClientCode().toUpperCase())
                .orElse(null);

        if (client == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Invalid Client Code"));
        }

        // 🔥 DUPLICATE CHECK
        if (taskTypeRepository.existsByTaskNameIgnoreCaseAndClient(
                req.getTaskType().trim(), client)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Task Type already exists for this client"));
        }

        TaskTypeEntity entity = new TaskTypeEntity();
        entity.setTaskName(req.getTaskType().trim());
        entity.setClient(client);

        taskTypeRepository.save(entity);

        return ResponseEntity.ok(Map.of("message", "Task Type added successfully"));
    }

    // ================= DELETE TASK TYPE =================
    @PostMapping("/task-type/delete")
    public ResponseEntity<?> deleteTaskType(@RequestBody TaskTypeDto req) {

        ClientEntity client = clientRepository
                .findByClientCd(req.getClientCode().toUpperCase())
                .orElse(null);

        if (client == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Invalid Client Code"));
        }

        TaskTypeEntity task = taskTypeRepository
                .findByTaskNameIgnoreCaseAndClient(req.getTaskType(), client)
                .orElse(null);

        if (task == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Task Type not found"));
        }

        taskTypeRepository.delete(task);
        return ResponseEntity.ok(Map.of("message", "Task Type deleted successfully"));
    }



    // ================= MODIFY TASK TYPE =================
    @PostMapping("/task-type/modify")
    public ResponseEntity<?> modifyTaskType(@RequestBody TaskTypeDto req) {

        ClientEntity client = clientRepository
                .findByClientCd(req.getClientCode().toUpperCase())
                .orElse(null);

        if (client == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Invalid Client Code"));
        }

        TaskTypeEntity existing = taskTypeRepository
                .findByTaskNameIgnoreCaseAndClient(req.getOldTaskType(), client)
                .orElse(null);

        if (existing == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Old Task Type not found"));
        }

        if (taskTypeRepository.existsByTaskNameIgnoreCaseAndClient(
                req.getNewTaskType(), client)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "New Task Type already exists"));
        }

        existing.setTaskName(req.getNewTaskType().trim());
        taskTypeRepository.save(existing);

        return ResponseEntity.ok(Map.of("message", "Task Type updated successfully"));
    }


    @GetMapping("/task-types/{clientCode}")
    public ResponseEntity<List<String>> getTaskTypesByClient(
            @PathVariable String clientCode) {

        ClientEntity client = clientRepository
                .findByClientCd(clientCode.toUpperCase())
                .orElseThrow(() ->
                        new RuntimeException("Invalid Client Code"));

        // ✅ USE REPOSITORY METHOD
        List<String> taskNames =
                taskTypeRepository.findTaskNamesByClient(client);

        return ResponseEntity.ok(taskNames); // 🔥 RETURN ARRAY ONLY
    }

    @PostMapping("/user-role")
    public ResponseEntity<?> addUserRole(@RequestBody UserRoleDto req) {

        if (req.getEmail() == null || req.getEmail().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "User email is required"));
        }

        if (req.getRole() == null || req.getRole().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Role is required"));
        }

        User user = userRepository
                .findByEmailIgnoreCase(req.getEmail())
                .orElse(null);

        if (user == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "User not found"));
        }

        Role role;
        try {
            role = Role.valueOf(req.getRole().toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Invalid role"));
        }

        // 🔥 DUPLICATE CHECK
        if (user.getRoles().contains(role)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "User already has this role"));
        }

        user.getRoles().add(role);
        userRepository.save(user);

        return ResponseEntity.ok(
                Map.of("message", "Role added successfully")
        );
    }
}






