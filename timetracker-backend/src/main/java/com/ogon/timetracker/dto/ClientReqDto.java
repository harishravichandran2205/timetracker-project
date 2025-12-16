package com.ogon.timetracker.dto;

import lombok.Data;

@Data
public class ClientReqDto {
    private String oldClientCd;
    private String oldClientName;
    private String newClientCd;
    private String newClientName;
}
