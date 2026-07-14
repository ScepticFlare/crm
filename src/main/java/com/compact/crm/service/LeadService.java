package com.compact.crm.service;

import com.compact.crm.dto.request.LeadRequest;
import com.compact.crm.entity.Lead;
import com.compact.crm.repository.LeadRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LeadService {

    private final LeadRepository leadRepository;

    public Lead createLead(LeadRequest request) {

        Lead lead = Lead.builder()
                .companyName(request.getCompanyName())
                .contactPerson(request.getContactPerson())
                .designation(request.getDesignation())
                .phone(request.getPhone())
                .alternatePhone(request.getAlternatePhone())
                .email(request.getEmail())
                .secondaryEmail(request.getSecondaryEmail())
                .website(request.getWebsite())
                .city(request.getCity())
                .state(request.getState())
                .pincode(request.getPincode())
                .interestedProduct(request.getInterestedProduct())
                .description(request.getDescription())
                .leadStatus(request.getLeadStatus())
                .leadValidity(request.getLeadValidity())
                .leadSource(request.getLeadSource())
                .assignedUserId(request.getAssignedUserId())
                .build();

        return leadRepository.save(lead);
    }

    public List<Lead> getAllLeads() {
        return leadRepository.findAll();
    }

    public Lead getLeadById(Long id) {
        return leadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lead not found"));
    }

    public Lead updateLead(Long id, LeadRequest request) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lead not found"));

        lead.setCompanyName(request.getCompanyName());
        lead.setContactPerson(request.getContactPerson());
        lead.setDesignation(request.getDesignation());
        lead.setPhone(request.getPhone());
        lead.setAlternatePhone(request.getAlternatePhone());
        lead.setEmail(request.getEmail());
        lead.setSecondaryEmail(request.getSecondaryEmail());
        lead.setWebsite(request.getWebsite());
        lead.setCity(request.getCity());
        lead.setState(request.getState());
        lead.setPincode(request.getPincode());
        lead.setInterestedProduct(request.getInterestedProduct());
        lead.setDescription(request.getDescription());
        lead.setLeadStatus(request.getLeadStatus());
        lead.setLeadValidity(request.getLeadValidity());
        lead.setLeadSource(request.getLeadSource());
        lead.setAssignedUserId(request.getAssignedUserId());

        return leadRepository.save(lead);
    }

    public void deleteLead(Long id) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lead not found"));
        leadRepository.delete(lead);
    }
}