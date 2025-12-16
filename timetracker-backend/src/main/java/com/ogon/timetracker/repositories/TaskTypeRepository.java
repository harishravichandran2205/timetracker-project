package com.ogon.timetracker.repositories;

import com.ogon.timetracker.entities.ClientEntity;
import com.ogon.timetracker.entities.TaskTypeEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TaskTypeRepository extends JpaRepository<TaskTypeEntity, Long> {

    @Query("select t.taskName from TaskTypeEntity t where t.client = :client")
    List<String> findTaskNamesByClient(@Param("client") ClientEntity client);

    boolean existsByTaskNameIgnoreCaseAndClient(
            String taskName, ClientEntity client
    );

    Optional<TaskTypeEntity> findByTaskNameIgnoreCaseAndClient(
            String taskName, ClientEntity client
    );
}

