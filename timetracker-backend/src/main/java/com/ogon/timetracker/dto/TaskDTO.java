package com.ogon.timetracker.dto;



import lombok.*;
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskDTO {
    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private String client;
    private String ticket;
    private String ticketDescription;
    private String category;
    private String description;
    private String billable;
    private double hours;
    private String date; // We'll parse MM/DD/YYYY to LocalDate in controller
}