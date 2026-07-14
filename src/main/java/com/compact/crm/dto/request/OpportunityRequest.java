package com.compact.crm.dto.request;

import com.compact.crm.enums.SalesStage;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OpportunityRequest {

    private Long leadId;
    private String title;
    private Double productValue;
    private LocalDate expectedClosingDate;
    private SalesStage salesStage;
}