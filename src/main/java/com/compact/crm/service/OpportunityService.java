package com.compact.crm.service;

import com.compact.crm.dto.request.OpportunityRequest;
import com.compact.crm.entity.Lead;
import com.compact.crm.entity.Opportunity;
import com.compact.crm.exception.ResourceNotFoundException;
import com.compact.crm.repository.LeadRepository;
import com.compact.crm.repository.OpportunityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class OpportunityService {

    private final OpportunityRepository opportunityRepository;
    private final LeadRepository leadRepository;

    /**
     * Convert a Lead into an Opportunity.
     */
    public Opportunity convertLeadToOpportunity(Long leadId, OpportunityRequest request) {

        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found"));

        // Prevent duplicate conversion
        boolean alreadyConverted = opportunityRepository.findAll()
                .stream()
                .anyMatch(o -> o.getLead().getId().equals(leadId));

        if (alreadyConverted) {
            throw new RuntimeException("This lead has already been converted into an Opportunity.");
        }

        Opportunity opportunity = Opportunity.builder()
                .title(request.getTitle())
                .productValue(request.getProductValue())
                .expectedClosingDate(request.getExpectedClosingDate())
                .salesStage(request.getSalesStage())
                .lead(lead)
                .build();

        return opportunityRepository.save(opportunity);
    }

    public List<Opportunity> getAllOpportunities() {
        return opportunityRepository.findAll();
    }

    public Opportunity getOpportunityById(Long id) {
        return opportunityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Opportunity not found"));
    }

    public Opportunity updateOpportunity(Long id, OpportunityRequest request) {

        Opportunity opportunity = opportunityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Opportunity not found"));

        opportunity.setTitle(request.getTitle());
        opportunity.setProductValue(request.getProductValue());
        opportunity.setExpectedClosingDate(request.getExpectedClosingDate());
        opportunity.setSalesStage(request.getSalesStage());

        return opportunityRepository.save(opportunity);
    }

    public void deleteOpportunity(Long id) {

        Opportunity opportunity = opportunityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Opportunity not found"));

        opportunityRepository.delete(opportunity);
    }
}