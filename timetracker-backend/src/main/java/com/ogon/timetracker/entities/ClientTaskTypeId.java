package com.ogon.timetracker.entities;

import java.io.Serializable;
import lombok.Data;

@Data
public class ClientTaskTypeId implements Serializable {
    private Long client;
    private Long taskType;
}