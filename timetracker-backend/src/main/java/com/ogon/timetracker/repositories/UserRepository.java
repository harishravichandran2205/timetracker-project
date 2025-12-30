package com.ogon.timetracker.repositories;


import com.ogon.timetracker.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
//    User findByEmail(String email);
    boolean existsByEmail(String email);

    Optional<User> findByEmailIgnoreCase(String email);

}
