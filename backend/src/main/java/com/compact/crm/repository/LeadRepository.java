package com.compact.crm.repository;

import com.compact.crm.entity.Lead;
import org.springframework.data.jpa.repository.JpaRepository;
import com.compact.crm.entity.Employee;
import java.util.List;

public interface LeadRepository extends JpaRepository<Lead, Long> {
    List<Lead> findByAssignedEmployee(Employee employee);

}