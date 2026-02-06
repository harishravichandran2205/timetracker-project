package com.ogon.timetracker.dto;

import lombok.Data;

@Data
public class TaskTypeDto {

    // for add / delete / modify
    private String clientCode;

    // add / delete
    private String taskType;

    // modify
    private String oldTaskType;
    private String newTaskType;
}

