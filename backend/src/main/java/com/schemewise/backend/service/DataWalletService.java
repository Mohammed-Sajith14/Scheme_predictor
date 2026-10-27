package com.schemewise.backend.service;

import com.schemewise.backend.model.DataWallet;
import com.schemewise.backend.repository.DataWalletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class DataWalletService {

    private final DataWalletRepository walletRepository;
    
    @Lazy
    private final SchemeService schemeService;

    public Optional<DataWallet> getWalletByUserId(Long userId) {
        return walletRepository.findByUserId(userId);
    }

    @Transactional
    public DataWallet saveOrUpdateWallet(Long userId, DataWallet updatedWallet) {
        DataWallet wallet = walletRepository.findByUserId(userId)
                .orElse(DataWallet.builder().userId(userId).build());

        // Update standard fields
        if (updatedWallet.getDateOfBirth() != null) wallet.setDateOfBirth(updatedWallet.getDateOfBirth());
        if (updatedWallet.getGender() != null) wallet.setGender(updatedWallet.getGender());
        if (updatedWallet.getState() != null) wallet.setState(updatedWallet.getState());
        if (updatedWallet.getDistrict() != null) wallet.setDistrict(updatedWallet.getDistrict());
        if (updatedWallet.getUrbanRural() != null) wallet.setUrbanRural(updatedWallet.getUrbanRural());
        if (updatedWallet.getIncome() != null) wallet.setIncome(updatedWallet.getIncome());
        if (updatedWallet.getOccupation() != null) wallet.setOccupation(updatedWallet.getOccupation());
        if (updatedWallet.getEmploymentStatus() != null) wallet.setEmploymentStatus(updatedWallet.getEmploymentStatus());
        if (updatedWallet.getEducation() != null) wallet.setEducation(updatedWallet.getEducation());
        if (updatedWallet.getStudentStatus() != null) wallet.setStudentStatus(updatedWallet.getStudentStatus());
        if (updatedWallet.getFamilySize() != null) wallet.setFamilySize(updatedWallet.getFamilySize());
        if (updatedWallet.getMaritalStatus() != null) wallet.setMaritalStatus(updatedWallet.getMaritalStatus());
        if (updatedWallet.getFarmerStatus() != null) wallet.setFarmerStatus(updatedWallet.getFarmerStatus());
        if (updatedWallet.getLandOwnership() != null) wallet.setLandOwnership(updatedWallet.getLandOwnership());
        if (updatedWallet.getLandArea() != null) wallet.setLandArea(updatedWallet.getLandArea());
        if (updatedWallet.getDisabilityStatus() != null) wallet.setDisabilityStatus(updatedWallet.getDisabilityStatus());
        if (updatedWallet.getDisabilityPercentage() != null) wallet.setDisabilityPercentage(updatedWallet.getDisabilityPercentage());
        if (updatedWallet.getDisabilityCertificateStatus() != null) wallet.setDisabilityCertificateStatus(updatedWallet.getDisabilityCertificateStatus());
        if (updatedWallet.getHousingStatus() != null) wallet.setHousingStatus(updatedWallet.getHousingStatus());
        if (updatedWallet.getExistingBenefits() != null) wallet.setExistingBenefits(updatedWallet.getExistingBenefits());

        // Merge additional dynamic attributes JSON
        if (updatedWallet.getAdditionalAttributes() != null && !updatedWallet.getAdditionalAttributes().trim().isEmpty()) {
            wallet.setAdditionalAttributes(mergeJsonAttributes(wallet.getAdditionalAttributes(), updatedWallet.getAdditionalAttributes()));
        }

        // Calculate profile completion
        double completion = calculateProfileCompletion(wallet);
        wallet.setProfileCompletion(completion);

        DataWallet saved = walletRepository.save(wallet);

        // Trigger Recalculate Eligibility for all schemes
        schemeService.recalculateAllEligibility(userId, saved);

        return saved;
    }

    private String mergeJsonAttributes(String existingJson, String newJson) {
        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        try {
            java.util.Map<String, Object> existingMap = (existingJson != null && !existingJson.trim().isEmpty()) 
                ? mapper.readValue(existingJson, new com.fasterxml.jackson.core.type.TypeReference<java.util.Map<String, Object>>() {})
                : new java.util.HashMap<>();
            java.util.Map<String, Object> newMap = mapper.readValue(newJson, new com.fasterxml.jackson.core.type.TypeReference<java.util.Map<String, Object>>() {});
            existingMap.putAll(newMap);
            return mapper.writeValueAsString(existingMap);
        } catch (Exception e) {
            return newJson;
        }
    }

    public double calculateProfileCompletion(DataWallet wallet) {
        int filled = 0;
        int total = 18;

        if (wallet.getDateOfBirth() != null) filled++;
        if (wallet.getGender() != null && !wallet.getGender().isEmpty()) filled++;
        if (wallet.getState() != null && !wallet.getState().isEmpty()) filled++;
        if (wallet.getDistrict() != null && !wallet.getDistrict().isEmpty()) filled++;
        if (wallet.getUrbanRural() != null && !wallet.getUrbanRural().isEmpty()) filled++;
        if (wallet.getIncome() != null) filled++;
        if (wallet.getOccupation() != null && !wallet.getOccupation().isEmpty()) filled++;
        if (wallet.getEmploymentStatus() != null && !wallet.getEmploymentStatus().isEmpty()) filled++;
        if (wallet.getEducation() != null && !wallet.getEducation().isEmpty()) filled++;
        if (wallet.getStudentStatus() != null && !wallet.getStudentStatus().isEmpty()) filled++;
        if (wallet.getFamilySize() != null) filled++;
        if (wallet.getMaritalStatus() != null && !wallet.getMaritalStatus().isEmpty()) filled++;
        if (wallet.getFarmerStatus() != null && !wallet.getFarmerStatus().isEmpty()) filled++;
        if (wallet.getLandOwnership() != null && !wallet.getLandOwnership().isEmpty()) filled++;
        if (wallet.getLandArea() != null) filled++;
        if (wallet.getDisabilityStatus() != null && !wallet.getDisabilityStatus().isEmpty()) filled++;
        if (wallet.getHousingStatus() != null && !wallet.getHousingStatus().isEmpty()) filled++;
        if (wallet.getExistingBenefits() != null && !wallet.getExistingBenefits().isEmpty()) filled++;

        return (filled * 100.0) / total;
    }
}
