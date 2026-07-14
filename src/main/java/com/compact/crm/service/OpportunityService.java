package com.compact.crm.service;

import com.compact.crm.dto.request.OpportunityRequest;
import com.compact.crm.entity.Lead;
import com.compact.crm.entity.Opportunity;
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

    public Opportunity createOpportunity(OpportunityRequest request) {
        Lead lead = leadRepository.findById(request.getLeadId())
                .orElseThrow(() -> new RuntimeException("Lead not found"));

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
                .orElseThrow(() -> new RuntimeException("Opportunity not found"));
    }

    public Opportunity updateOpportunity(Long id, OpportunityRequest request) {
        Opportunity opportunity = opportunityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Opportunity not found"));

        Lead lead = leadRepository.findById(request.getLeadId())
                .orElseThrow(() -> new RuntimeException("Lead not found"));

        opportunity.setTitle(request.getTitle());
        opportunity.setProductValue(request.getProductValue());
        opportunity.setExpectedClosingDate(request.getExpectedClosingDate());
        opportunity.setSalesStage(request.getSalesStage());
        opportunity.setLead(lead);

        return opportunityRepository.save(opportunity);
    }

    public void deleteOpportunity(Long id) {
        Opportunity opportunity = opportunityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Opportunity not found"));
        opportunityRepository.delete(opportunity);
    }
}