package com.compact.crm.service;

import com.compact.crm.dto.request.FollowUpRequest;
import com.compact.crm.entity.ActivityType;
import com.compact.crm.entity.Employee;
import com.compact.crm.entity.FollowUp;
import com.compact.crm.entity.Lead;
import com.compact.crm.entity.Opportunity;
import com.compact.crm.exception.ResourceNotFoundException;
import com.compact.crm.repository.ActivityTypeRepository;
import com.compact.crm.repository.EmployeeRepository;
import com.compact.crm.repository.FollowUpRepository;
import com.compact.crm.repository.LeadRepository;
import com.compact.crm.repository.OpportunityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FollowUpService {

    private final FollowUpRepository followUpRepository;
    private final LeadRepository leadRepository;
    private final OpportunityRepository opportunityRepository;
    private final EmployeeRepository employeeRepository;
    private final ActivityTypeRepository activityTypeRepository;

    public FollowUp createFollowUp(FollowUpRequest request) {

        if (request.getLeadId() == null && request.getOpportunityId() == null) {
            throw new ResourceNotFoundException(
                    "FollowUp must belong to either a Lead or an Opportunity");
        }

        Lead lead = null;
        Opportunity opportunity = null;

        if (request.getLeadId() != null) {
            lead = leadRepository.findById(request.getLeadId())
                    .orElseThrow(() -> new ResourceNotFoundException("Lead not found"));
        }

        if (request.getOpportunityId() != null) {
            opportunity = opportunityRepository.findById(request.getOpportunityId())
                    .orElseThrow(() -> new ResourceNotFoundException("Opportunity not found"));
        }

        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        ActivityType activityType = activityTypeRepository
                .findById(request.getActivityTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("Activity Type not found"));

        FollowUp followUp = FollowUp.builder()
                .lead(lead)
                .opportunity(opportunity)
                .employee(employee)
                .activityType(activityType)
                .status(request.getStatus())
                .scheduledDate(request.getScheduledDate())
                .completedDate(request.getCompletedDate())
                .remarks(request.getRemarks())
                .build();

        return followUpRepository.save(followUp);
    }

    public List<FollowUp> getAllFollowUps() {
        return followUpRepository.findAll();
    }

    public FollowUp getFollowUpById(Long id) {

        return followUpRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("FollowUp not found"));
    }

    public FollowUp updateFollowUp(Long id, FollowUpRequest request) {

        FollowUp followUp = followUpRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("FollowUp not found"));

        Lead lead = null;
        Opportunity opportunity = null;

        if (request.getLeadId() != null) {
            lead = leadRepository.findById(request.getLeadId())
                    .orElseThrow(() -> new ResourceNotFoundException("Lead not found"));
        }

        if (request.getOpportunityId() != null) {
            opportunity = opportunityRepository.findById(request.getOpportunityId())
                    .orElseThrow(() -> new ResourceNotFoundException("Opportunity not found"));
        }

        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        ActivityType activityType = activityTypeRepository
                .findById(request.getActivityTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("Activity Type not found"));

        followUp.setLead(lead);
        followUp.setOpportunity(opportunity);
        followUp.setEmployee(employee);
        followUp.setActivityType(activityType);
        followUp.setStatus(request.getStatus());
        followUp.setScheduledDate(request.getScheduledDate());
        followUp.setCompletedDate(request.getCompletedDate());
        followUp.setRemarks(request.getRemarks());

        return followUpRepository.save(followUp);
    }
    public List<FollowUp> getFollowUpsByLead(Long leadId) {

        return followUpRepository.findByLeadId(leadId);

    }

    public List<FollowUp> getFollowUpsByOpportunity(Long opportunityId) {

        return followUpRepository.findByOpportunityId(opportunityId);

    }

    public void deleteFollowUp(Long id) {

        FollowUp followUp = followUpRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("FollowUp not found"));

        followUpRepository.delete(followUp);
    }
}