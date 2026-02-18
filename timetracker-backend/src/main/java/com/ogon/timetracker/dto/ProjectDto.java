package com.ogon.timetracker.dto;

import lombok.Data;

@Data
public class ProjectDto {
    private String clientCode;
    private String project;
    private String oldProject;
    private String newProject;
}
