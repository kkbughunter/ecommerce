package com.astraval.ecommercebackend.modules.user;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByGoogleSubject(String googleSubject);

    Optional<User> findByEmailIgnoreCase(String email);

    Optional<User> findByEmailIgnoreCaseAndIsActiveTrue(String email);

    Optional<User> findByUserIdAndIsActiveTrue(Long userId);

}
