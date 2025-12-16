package com.ogon.timetracker.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
@Entity
@Table(
        name = "task_type_entity",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"task_name", "client_id"})
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaskTypeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "task_name", nullable = false)
    private String taskName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private ClientEntity client;
}
