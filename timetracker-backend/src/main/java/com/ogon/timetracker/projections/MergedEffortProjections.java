package com.ogon.timetracker.projections;

public interface MergedEffortProjections {
    Long getRowId();
    String getClient();
    String getProject();
    String getTicket();
    String getTicketDescription();
    String getCategory();
    String getBillable();
    String getDescription();
    String getHoursByDate();

    // Optional, safe to leave null if not in your query
    Double getTotalHours();
    String getDate();
}
