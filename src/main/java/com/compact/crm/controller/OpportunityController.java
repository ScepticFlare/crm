package com.compact.crm.controller;

import com.compact.crm.dto.request.OpportunityRequest;
import com.compact.crm.entity.Opportunity;
import com.compact.crm.service.OpportunityService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/opportunities")
@RequiredArgsConstructor
public class OpportunityController {

    private final OpportunityService opportunityService;

    @PostMapping
    public Opportunity createOpportunity(@RequestBody OpportunityRequest request) {
        return opportunityService.createOpportunity(request);
    }

    @GetMapping
    public List<Opportunity> getAllOpportunities() {
        return opportunityService.getAllOpportunities();
    }

    @GetMapping("/{id}")
    public Opportunity getOpportunityById(@PathVariable Long id) {
        return opportunityService.getOpportunityById(id);
    }

    @PutMapping("/{id}")
    public Opportunity updateOpportunity(@PathVariable Long id, @RequestBody OpportunityRequest request) {
        return opportunityService.updateOpportunity(id, request);
    }

    @DeleteMapping("/{id}")
    public void deleteOpportunity(@PathVariable Long id) {
        opportunityService.deleteOpportunity(id);
    }
}