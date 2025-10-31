package com.ogon.timetracker.repositories;


import com.ogon.timetracker.entities.TaskEntity;
import com.ogon.timetracker.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface TaskRepository extends JpaRepository<TaskEntity, Long>, JpaSpecificationExecutor<TaskEntity> {
  TaskEntity findByTicket(String ticketNumber);


  @Query("SELECT t FROM TaskEntity t WHERE t.email = :email AND FUNCTION('STR_TO_DATE', t.date, '%d-%m-%Y') BETWEEN :start AND :end")
  List<TaskEntity> findByEmailAndDateBetweenString(@Param("email") String email,
                                                   @Param("start") LocalDate start,
                                                   @Param("end") LocalDate end);


  Optional<TaskEntity> findById(Long id);
}