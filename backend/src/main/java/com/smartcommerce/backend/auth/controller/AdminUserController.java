// src/main/java/com/smartcommerce/backend/auth/controller/AdminUserController.java
package com.smartcommerce.backend.auth.controller;

import com.smartcommerce.backend.auth.dto.AdminCreateUserRequest;
import com.smartcommerce.backend.auth.dto.AdminUpdateUserRequest;
import com.smartcommerce.backend.auth.entity.User;
import com.smartcommerce.backend.auth.service.AdminUserService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    private final AdminUserService service;

    public AdminUserController(AdminUserService service) {
        this.service = service;
    }

    @PostMapping
    public User create(@RequestBody @Valid AdminCreateUserRequest req) {
        return service.create(req);
    }

    @GetMapping
    public List<User> list() {
        return service.list();
    }

    @GetMapping("/{id}")
    public User get(@PathVariable Long id) {
        return service.get(id);
    }

    @PutMapping("/{id}")
    public User update(@PathVariable Long id, @RequestBody AdminUpdateUserRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id) {
        service.delete(id);
        return "User deleted";
    }
}
