package com.compact.crm.dto.request;

import com.compact.crm.enums.LeadSource;
import com.compact.crm.enums.LeadStatus;
import com.compact.crm.enums.LeadValidity;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LeadRequest {

    @NotBlank(message = "Company name is required")
    private String companyName;

    @NotBlank(message = "Contact person is required")
    private String contactPerson;

    @NotBlank(message = "Designation is required")
    private String designation;

    @NotBlank(message = "Phone is required")
    @Size(min = 10, max = 10, message = "Phone number must be exactly 10 digits")
    private String phone;

    private String alternatePhone;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    private String secondaryEmail;
    private String website;

    @NotBlank(message = "City is required")
    private String city;

    @NotBlank(message = "State is required")
    private String state;

    private String pincode;
    private String interestedProduct;
    private String description;

    @NotNull(message = "Lead status is required")
    private LeadStatus leadStatus;

    private LeadValidity leadValidity;

    @NotNull(message = "Lead source is required")
    private LeadSource leadSource;

    @NotNull(message = "Assigned employee is required")
    private Long assignedEmployeeId;
}