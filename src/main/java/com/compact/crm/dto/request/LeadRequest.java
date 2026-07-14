package com.compact.crm.dto.request;

import com.compact.crm.enums.LeadSource;
import com.compact.crm.enums.LeadStatus;
import com.compact.crm.enums.LeadValidity;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LeadRequest {

    private String companyName;
    private String contactPerson;
    private String designation;
    private String phone;
    private String alternatePhone;
    private String email;
    private String secondaryEmail;
    private String website;
    private String city;
    private String state;
    private String pincode;
    private String interestedProduct;
    private String description;
    private LeadStatus leadStatus;
    private LeadValidity leadValidity;
    private LeadSource leadSource;
    private Long assignedUserId;
}