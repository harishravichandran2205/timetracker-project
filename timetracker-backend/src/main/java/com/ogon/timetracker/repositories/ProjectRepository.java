package com.ogon.timetracker.repositories;

import com.ogon.timetracker.entities.ClientEntity;
import com.ogon.timetracker.entities.ProjectEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProjectRepository extends JpaRepository<ProjectEntity, Long> {

    @Query("select p.projectName from ProjectEntity p where p.client = :client order by p.projectName")
    List<String> findProjectNamesByClient(@Param("client") ClientEntity client);

    boolean existsByProjectNameIgnoreCaseAndClient(String projectName, ClientEntity client);

    Optional<ProjectEntity> findByProjectNameIgnoreCaseAndClient(String projectName, ClientEntity client);
}
