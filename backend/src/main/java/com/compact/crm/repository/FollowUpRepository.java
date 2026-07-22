package com.compact.crm.repository;

import com.compact.crm.entity.Employee;
import com.compact.crm.entity.FollowUp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FollowUpRepository extends JpaRepository<FollowUp, Long> {

    List<FollowUp> findByLeadId(Long leadId);

    List<FollowUp> findByOpportunityId(Long opportunityId);

    List<FollowUp> findByLead_AssignedEmployee(Employee employee);

    List<FollowUp> findByOpportunity_Lead_AssignedEmployee(Employee employee);

}