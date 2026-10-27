package com.schemewise.backend.dto;

import com.schemewise.backend.model.DataWallet;
import com.schemewise.backend.model.SchemeRequirement;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class RuleTestRequestDTO {
    private Long schemeId;
    private List<SchemeRequirement> requirements;
    private DataWallet testWallet;
    private Map<String, Object> customAttributes;
}
