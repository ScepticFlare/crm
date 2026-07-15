package com.compact.crm.entity;

import com.compact.crm.enums.ActivityType;
import com.compact.crm.enums.FollowUpStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "followups")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FollowUp {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "lead_id")
    private Lead lead;

    @ManyToOne
    @JoinColumn(name = "opportunity_id")
    private Opportunity opportunity;

    @ManyToOne
    @JoinColumn(name = "employee_id")
    private Employee employee;

    @Enumerated(EnumType.STRING)
    private ActivityType activityType;

    @Enumerated(EnumType.STRING)
    private FollowUpStatus status;

    private LocalDateTime scheduledDate;

    private LocalDateTime completedDate;

    @Column(columnDefinition = "TEXT")
    private String remarks;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}