package com.compact.crm.service;

import com.compact.crm.dto.request.EmployeeRequest;
import com.compact.crm.exception.ResourceNotFoundException;
import com.compact.crm.entity.Employee;
import com.compact.crm.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EmployeeService {

    private final EmployeeRepository employeeRepository;

    public Employee createEmployee(EmployeeRequest request) {

        Employee employee = Employee.builder()
                .name(request.getName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .password(request.getPassword())
                .build();

        return employeeRepository.save(employee);
    }

    public List<Employee> getAllEmployees() {
        return employeeRepository.findAll();
    }

    public Employee getEmployeeById(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
    }

    public Employee updateEmployee(Long id, EmployeeRequest request) {

        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        employee.setName(request.getName());
        employee.setEmail(request.getEmail());
        employee.setPhone(request.getPhone());
        employee.setPassword(request.getPassword());

        return employeeRepository.save(employee);
    }

    public void deleteEmployee(Long id) {

        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        employeeRepository.delete(employee);
    }
}