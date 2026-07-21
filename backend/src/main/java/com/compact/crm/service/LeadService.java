package com.compact.crm.service;

import com.compact.crm.dto.request.LeadRequest;
import com.compact.crm.entity.Employee;
import com.compact.crm.entity.Lead;
import com.compact.crm.exception.ResourceNotFoundException;
import com.compact.crm.repository.EmployeeRepository;
import com.compact.crm.repository.IndustryRepository;
import com.compact.crm.repository.LeadRepository;
import com.compact.crm.repository.LeadSourceMasterRepository;
import com.compact.crm.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LeadService {

    private final LeadRepository leadRepository;
    private final EmployeeRepository employeeRepository;
    private final ProductRepository productRepository;
    private final IndustryRepository industryRepository;
    private final LeadSourceMasterRepository leadSourceMasterRepository;

    public Lead createLead(LeadRequest request) {

        Employee employee = employeeRepository.findById(request.getAssignedEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

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
                .product(
                        productRepository.findById(request.getProductId())
                                .orElseThrow(() -> new ResourceNotFoundException("Product not found"))
                )
                .industry(
                        industryRepository.findById(request.getIndustryId())
                                .orElseThrow(() -> new ResourceNotFoundException("Industry not found"))
                )
                .description(request.getDescription())
                .leadStatus(request.getLeadStatus())
                .leadValidity(request.getLeadValidity())
                .leadSource(
                        leadSourceMasterRepository.findById(request.getLeadSourceId())
                                .orElseThrow(() -> new ResourceNotFoundException("Lead Source not found"))
                )
                .assignedEmployee(employee)
                .build();

        return leadRepository.save(lead);
    }

    public List<Lead> getAllLeads() {
        return leadRepository.findAll();
    }

    public Lead getLeadById(Long id) {
        return leadRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found"));
    }

    public Lead updateLead(Long id, LeadRequest request) {

        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found"));

        Employee employee = employeeRepository.findById(request.getAssignedEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

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

        lead.setProduct(
                productRepository.findById(request.getProductId())
                        .orElseThrow(() -> new ResourceNotFoundException("Product not found"))
        );

        lead.setIndustry(
                industryRepository.findById(request.getIndustryId())
                        .orElseThrow(() -> new ResourceNotFoundException("Industry not found"))
        );

        lead.setDescription(request.getDescription());
        lead.setLeadStatus(request.getLeadStatus());
        lead.setLeadValidity(request.getLeadValidity());

        lead.setLeadSource(
                leadSourceMasterRepository.findById(request.getLeadSourceId())
                        .orElseThrow(() -> new ResourceNotFoundException("Lead Source not found"))
        );

        lead.setAssignedEmployee(employee);

        return leadRepository.save(lead);
    }

    public void deleteLead(Long id) {

        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found"));

        leadRepository.delete(lead);
    }
}