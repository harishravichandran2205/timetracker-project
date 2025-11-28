package com.ogon.timetracker.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "client_tasktype")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@IdClass(ClientTaskTypeId.class)
public class ClientTaskTypeEntity {

    @Id
    @ManyToOne
    @JoinColumn(name = "client_id")
    private ClientEntity client;

    @Id
    @ManyToOne
    @JoinColumn(name = "tasktype_id")
    private TaskTypeEntity taskType;
}
