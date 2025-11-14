package com.ogon.timetracker.services;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ogon.timetracker.dto.TaskDTO;
import com.ogon.timetracker.entities.TaskEntity;
import com.ogon.timetracker.projections.MergedEffortProjections;
import com.ogon.timetracker.repositories.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class TaskService {

    @Autowired
    private TaskRepository taskRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public List<TaskDTO> getMergedEffortsByDate(String email,
                                                LocalDate startDate,
                                                LocalDate endDate) {

        List<MergedEffortProjections> projections =
                taskRepository.getMergedEffortsByDate(email, startDate, endDate);

        List<TaskDTO> results = new ArrayList<>();

        DateTimeFormatter inputFormatter = DateTimeFormatter.ofPattern("dd-MM-yyyy");
        DateTimeFormatter displayFormatter = DateTimeFormatter.ofPattern("d MMM (EEE)", Locale.ENGLISH);

        for (MergedEffortProjections p : projections) {
            if (p.getHoursByDate() == null || p.getHoursByDate().isBlank()) {
                continue;
            }

            try {
                // Example: {"03-11-2025": 8.0, "04-11-2025": 2.5}
                Map<String, Double> rawHoursMap = objectMapper.readValue(
                        p.getHoursByDate(),
                        new TypeReference<Map<String, Double>>() {}
                );

                //  Convert date keys to UI-friendly format like "10 Nov (Mon)"
                Map<String, Double> formattedHoursMap = new LinkedHashMap<>();
                for (Map.Entry<String, Double> entry : rawHoursMap.entrySet()) {
                    try {
                        LocalDate parsedDate = LocalDate.parse(entry.getKey(), inputFormatter);
                        String formattedDate = parsedDate.format(displayFormatter);
                        formattedHoursMap.put(formattedDate, entry.getValue());
                    } catch (Exception dateEx) {
                        System.err.println("⚠️ Invalid date format: " + entry.getKey());
                        formattedHoursMap.put(entry.getKey(), entry.getValue());
                    }
                }

                //  Calculate total hours
                double totalHours = formattedHoursMap.values().stream()
                        .mapToDouble(Double::doubleValue)
                        .sum();

                // Build DTO (not Entity)
                TaskDTO dto = TaskDTO.builder()
                        .email(email)
                        .client(p.getClient())
                        .ticket(p.getTicket())
                        .ticketDescription(p.getTicketDescription())
                        .category(p.getCategory())
                        .billable(p.getBillable())
                        .description(p.getDescription())
                        .hours(totalHours)
                        .hoursByDate(formattedHoursMap)
                        .build();

                results.add(dto);

            } catch (Exception ex) {
                System.err.println("Failed to parse hoursByDate for ticket "
                        + p.getTicket() + ": " + ex.getMessage());
            }
        }

        return results;
    }

}
