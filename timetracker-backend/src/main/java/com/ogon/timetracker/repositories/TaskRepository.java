package com.ogon.timetracker.repositories;


import com.ogon.timetracker.entities.TaskEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import com.ogon.timetracker.projections.MergedEffortProjections;


import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface TaskRepository extends JpaRepository<TaskEntity, Long>, JpaSpecificationExecutor<TaskEntity> {
  TaskEntity findByTicket(String ticketNumber);


//  @Query("SELECT t FROM TaskEntity t WHERE t.email = :email AND FUNCTION('STR_TO_DATE', t.date, '%d-%m-%Y') BETWEEN :start AND :end")
//  List<TaskEntity> findByEmailAndDateBetweenString(@Param("email") String email,
//                                                   @Param("start") LocalDate start,
//                                                   @Param("end") LocalDate end);


  Optional<TaskEntity> findById(Long id);
  List<TaskEntity> findByRowId(Long rowId);
  @Query(value = "SELECT COALESCE(MAX(row_id), 0) + 1 FROM tasks", nativeQuery = true)
  Long getNextRowId();

  @Query(value = """
  SELECT
      row_id AS rowId,
      client,
      ticket,
      ticket_description AS ticketDescription,
      category,
      billable,
      description,
      JSON_OBJECTAGG(date, totalHours) AS hoursByDate
  FROM (
      SELECT\s
          row_id,
          client,
          ticket,
          ticket_description,
          category,
          billable,
          description,
          date,
          SUM(hours) AS totalHours   -- ✔ sums ONLY same day
      FROM timetracker_db.tasks
      WHERE user_id = :userId
        AND STR_TO_DATE(date, '%d-%m-%Y') BETWEEN :startDate AND :endDate
      GROUP BY row_id,client, ticket, ticket_description, category, billable, description, date
      -- ✔ grouping includes date → means adding only for same day
  ) merged
  GROUP BY\s
      row_id,client, ticket, ticket_description, category, billable, description
 \s""", nativeQuery = true)
  List<MergedEffortProjections> getMergedEffortsByDate(
          @Param("userId") Long userId,
          @Param("startDate") LocalDate startDate,
          @Param("endDate") LocalDate endDate
  );


  @Query(value = """
SELECT *
FROM timetracker_db.tasks
WHERE email = :email
  AND client = :client
  AND ticket = :ticket
  AND date = :date
  AND category = :category
  AND description = :description
  AND billable = :billable
  AND rowId = :rowId
""", nativeQuery = true)
  List<TaskEntity> findExistingTask(
          @Param("email") String email,
          @Param("client") String client,
          @Param("ticket") String ticket,
          @Param("date") String date,
          @Param("category") String category,
          @Param("description") String description,
          @Param("billable") String billable,
          @Param ("rowId") Long rowId
  );


  @Query("SELECT t FROM TaskEntity t WHERE t.userId = :userId AND FUNCTION('STR_TO_DATE', t.date, '%d-%m-%Y') BETWEEN :start AND :end")
  List<TaskEntity> findByUserIdAndDateBetweenString(@Param("userId") Long userId,
                                                   @Param("start") LocalDate start,
                                                   @Param("end") LocalDate end);

  @Query("SELECT t FROM TaskEntity t WHERE t.client = :client AND FUNCTION('STR_TO_DATE', t.date, '%d-%m-%Y') BETWEEN :startDate AND :endDate")
  List<TaskEntity> getSummaryByClientAndDateRange(
          @Param("client") String client,
          @Param("startDate") LocalDate startDate,
          @Param("endDate") LocalDate endDate
  );


}