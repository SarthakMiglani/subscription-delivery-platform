package com.juiceplatform.repository;

import com.juiceplatform.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByPhone(String phone);

    Optional<User> findByGoogleId(String googleId);

    /**
     * Used by AdminPasswordBootstrap to locate all admin accounts eligible for
     * a startup password override via ADMIN_BOOTSTRAP_PASSWORD.
     */
    List<User> findAllByRoleAndAuthProvider(User.UserRole role, User.AuthProvider authProvider);

    /**
     * Returns all users with role=CUSTOMER, ordered by createdAt DESC.
     * Used by admin customer list with no search filter.
     */
    Page<User> findByRoleOrderByCreatedAtDesc(User.UserRole role, Pageable pageable);

    /**
     * Returns CUSTOMER-role users whose name, phone, or email contains the search term (case-insensitive).
     * Used by admin customer search.
     */
    @Query("SELECT u FROM User u WHERE u.role = :role AND (" +
           "LOWER(u.name) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(u.phone) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :q, '%')))" +
           " ORDER BY u.createdAt DESC")
    Page<User> searchCustomers(@Param("role") User.UserRole role,
                               @Param("q") String query,
                               Pageable pageable);
}
