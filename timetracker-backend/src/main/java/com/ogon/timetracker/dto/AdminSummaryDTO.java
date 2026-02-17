package com.ogon.timetracker.dto;
import lombok.Builder;
import lombok.Data;

import java.util.Set;

@Data
@Builder
public class AdminSummaryDTO {

    private String client;
    private String project;
    private String ticket;
    private String ticketDescription;

    private double billableHours;
    private double nonBillableHours;

    private Set<String> descriptions; // unique descriptions
}
