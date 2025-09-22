    package com.smartcommerce.backend.cart.repository;

    import com.smartcommerce.backend.auth.entity.User;
    import com.smartcommerce.backend.cart.entity.CartItem;
    import org.springframework.data.jpa.repository.JpaRepository;
    import org.springframework.data.jpa.repository.Modifying;
    import org.springframework.data.jpa.repository.Query;
    import org.springframework.data.repository.query.Param;
    import org.springframework.stereotype.Repository;
    import org.springframework.transaction.annotation.Transactional;

    import java.util.List;
    import java.util.Optional;

    @Repository
    public interface CartItemRepository extends JpaRepository<CartItem, Long> {

        List<CartItem> findByUser_Id(Long userId);

        Optional<CartItem> findByUser_IdAndProduct_Id(Long userId, Long productId);

        // Derived delete
        void deleteByUser_Id(Long userId);

        // Safety net (explicit JPQL)
        @Modifying
        @Transactional
        @Query("delete from CartItem c where c.user.id = :userId")
        void deleteAllByUserId(@Param("userId") Long userId);
    }
