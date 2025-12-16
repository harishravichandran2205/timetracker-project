package com.ogon.timetracker.repositories;

import com.ogon.timetracker.entities.ClientEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ClientRepository extends JpaRepository<ClientEntity, Long> {

    boolean existsByClientCd(String clientCd);
    boolean existsByClientName(String clientName);

    Optional<ClientEntity> findByClientCd(String clientCd);
    Optional<ClientEntity> findByClientName(String clientName);

    @Query("select c.clientCd from ClientEntity c order by c.clientCd")
    List<String> findAllClientCodes();


}


