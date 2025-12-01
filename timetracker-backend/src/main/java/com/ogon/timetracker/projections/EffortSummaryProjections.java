package com.ogon.timetracker.projections;

// src/main/java/com/example/timetracker/projections/EffortSummaryProjection.java
public interface EffortSummaryProjections {
    long getUserId();      // username
    String getClient();
    String getTicket();
    Double getTotalHours();
}

