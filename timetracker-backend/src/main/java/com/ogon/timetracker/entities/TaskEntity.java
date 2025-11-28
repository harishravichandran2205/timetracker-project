package com.ogon.timetracker.entities;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.ogon.timetracker.converters.JsonMapConverter;
import io.swagger.v3.oas.annotations.info.Contact;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@Entity
@Builder
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "tasks")
public class TaskEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long rowId;
    private String email;
    private String firstName;
    private String lastName;
    private String client;
    private String ticket;
    private String ticketDescription;
    private String category;
    private String description;
    private String billable;
    private Double hours;
    private String date;






    @Transient
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Map<String, Double> hoursByDate;

    public Map<String, Double> getHoursByDate() {
        return hoursByDate;
    }

    public void setHoursByDate(Map<String, Double> hoursByDate) {
        this.hoursByDate = hoursByDate;
    }
}
