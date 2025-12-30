package com.example.chatapp.model;

public class UserDTO {
    private User user;
    private String status; // Peut être: "NONE", "WAITING", "FRIEND"

    public UserDTO(User user, String status) {
        this.user = user;
        this.status = status;
    }

    public User getUser() { return user; }
    public String getStatus() { return status; }
}