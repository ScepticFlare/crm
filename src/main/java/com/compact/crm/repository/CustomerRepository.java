package com.compact.crm.repository;

import com.compact.crm.entity.Customer;
import com.compact.crm.entity.Opportunity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {

    Optional<Customer> findByOpportunity(Opportunity opportunity);

}