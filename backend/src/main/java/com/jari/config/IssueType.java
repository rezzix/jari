package com.jari.config;

import jakarta.persistence.*;

@Entity
@Table(name = "issue_type")
public class IssueType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    public IssueType() {}

    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}