package com.schemewise.backend.config;

import com.schemewise.backend.model.*;
import com.schemewise.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseSeeder implements CommandLineRunner {

    private final SchemeRepository schemeRepository;
    private final SchemeRequirementRepository requirementRepository;
    private final SchemeBenefitRepository benefitRepository;
    private final SchemeDocumentRepository documentRepository;
    private final SchemeApplicationStepRepository stepRepository;
    private final SchemeFAQRepository faqRepository;
    private final SchemeSourceRepository sourceRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @org.springframework.transaction.annotation.Transactional
    public void run(String... args) throws Exception {
        seedAdminUser();
        if (schemeRepository.count() == 0) {
            log.info("Database is empty. Seeding 10 realistic DEMO government schemes...");
            seedDemoSchemes();
        } else {
            log.info("Database already initialized with schemes.");
        }
        seedOrUpdateRequirementsForAllSchemes();
    }


    private void seedAdminUser() {
        String adminEmail = "admin@schemewise.com";
        if (!userRepository.existsByEmail(adminEmail)) {
            log.info("[SEED] Creating default administrator account: {}", adminEmail);
            User admin = User.builder()
                    .name("System Administrator")
                    .email(adminEmail)
                    .password(passwordEncoder.encode("Admin@123"))
                    .role("ADMIN")
                    .build();
            userRepository.save(admin);
            log.info("[SEED] Admin account created successfully.");
        }
    }

    private void seedDemoSchemes() {
        List<DemoSchemePayload> list = new ArrayList<>();

        // 1. Student Scholarship Scheme
        list.add(new DemoSchemePayload(
                Scheme.builder()
                        .name("Pradhan Mantri National Higher Education Student Scholarship [DEMO]")
                        .department("Department of Higher Education & Social Justice")
                        .description("DEMO DATA: Merit-cum-means scholarship providing financial support for under-privileged students enrolled in recognized higher education degree programs.")
                        .shortDescription("DEMO SCHEME: Higher education scholarship for eligible low-income college students.")
                        .benefits("Full tuition fee reimbursement up to ₹75,000/year plus a monthly stipend of ₹2,500.")
                        .category("Education")
                        .beneficiaryType("Students")
                        .targetBeneficiary("College Students")
                        .schemeType("Scholarship")
                        .state("All India")
                        .applicationProcess("Apply online via portal. Submit college enrolment proof, mark sheets, and family income certificate for verification.")
                        .requiredDocuments("College ID Card, Marksheets, Income Certificate, Bank Account Details")
                        .deadline(LocalDate.now().plusMonths(4))
                        .officialUrl("https://scholarships.demo.gov.in")
                        .status("PUBLISHED")
                        .version(1)
                        .officialSchemeId("SCH-EDU-2026-01")
                        .tagsKeywords("scholarship, student, college, tuition, education")
                        .build(),
                List.of(
                        SchemeRequirement.builder().fieldName("studentStatus").fieldLabel("Student Status").dataType("BOOLEAN").operator("==").requiredValue("true").mandatory(true).weight(25.0).logicalGroup("AND").conditionOrder(1).build(),
                        SchemeRequirement.builder().fieldName("income").fieldLabel("Annual Family Income").dataType("NUMBER").operator("<=").requiredValue("300000").mandatory(true).weight(30.0).logicalGroup("AND").conditionOrder(2).build(),
                        SchemeRequirement.builder().fieldName("age").fieldLabel("Age").dataType("NUMBER").operator("<=").requiredValue("26").mandatory(false).weight(15.0).logicalGroup("AND").conditionOrder(3).build(),
                        SchemeRequirement.builder().fieldName("education").fieldLabel("Education Level").dataType("SELECT").operator("IN").requiredValue("Undergraduate,Postgraduate,Diploma").mandatory(true).weight(30.0).logicalGroup("AND").conditionOrder(4).build()
                ),
                List.of(
                        SchemeBenefit.builder().title("Tuition Fee Waiver").description("100% tuition reimbursement up to ₹75,000 per academic year.").amount("₹75,000/yr").frequency("Annual").build(),
                        SchemeBenefit.builder().title("Monthly Books & Living Allowance").description("Monthly stipend directly credited to student bank account.").amount("₹2,500/mo").frequency("Monthly").build()
                ),
                List.of(
                        SchemeDocument.builder().name("Institutional Bonafide Certificate").description("Issued by college principal/dean confirming active enrolment.").mandatory(true).build(),
                        SchemeDocument.builder().name("Income Certificate").description("Official income certificate issued by Tehsildar or Revenue Authority.").mandatory(true).build(),
                        SchemeDocument.builder().name("Previous Academic Marksheet").description("Copy of last qualifying exam mark sheet (min 60% required).").mandatory(true).build()
                ),
                List.of(
                        SchemeApplicationStep.builder().stepNumber(1).title("Portal Registration").description("Register on the Portal with email and Aadhaar-linked mobile number.").build(),
                        SchemeApplicationStep.builder().stepNumber(2).title("Complete Data Wallet Profile").description("Verify academic details, institution code, and bank account in Data Wallet.").build(),
                        SchemeApplicationStep.builder().stepNumber(3).title("Upload Verifiable Credentials").description("Attach bonafide certificate and income proof.").build(),
                        SchemeApplicationStep.builder().stepNumber(4).title("Institution Verification").description("College Nodal Officer reviews and digitally approves application.").build(),
                        SchemeApplicationStep.builder().stepNumber(5).title("DBT Disbursement").description("Scholarship amount credited directly to bank account via Aadhaar Bridge.").build()
                ),
                List.of(
                        SchemeFAQ.builder().question("Who can apply for this scholarship?").answer("Regular full-time students enrolled in undergraduate or postgraduate degree courses with annual family income below ₹3 Lakhs.").displayOrder(1).build(),
                        SchemeFAQ.builder().question("Is distance education eligible?").answer("No, this scheme is strictly for regular full-time campus programs.").displayOrder(2).build()
                ),
                List.of(
                        SchemeSource.builder().sourceName("Ministry of Education Guidelines (Demo)").officialUrl("https://scholarships.demo.gov.in/rules").documentUrl("https://scholarships.demo.gov.in/docs/guidelines.pdf").referenceDescription("Demo Reference Document for Student Scholarship Scheme.").sourceType("Government Portal").build()
                )
        ));

        // 2. Women Entrepreneurship Support Scheme
        list.add(new DemoSchemePayload(
                Scheme.builder()
                        .name("Mahila Udyamita Women Entrepreneurship Support [DEMO]")
                        .department("Ministry of Women & Child Development & MSME")
                        .description("DEMO DATA: Financial grant and low-interest seed capital for women-led micro enterprises and startups.")
                        .shortDescription("DEMO SCHEME: Seed grants and collateral-free business loans for female entrepreneurs.")
                        .benefits("Collateral-free seed capital up to ₹5,00,000 with 35% capital subsidy for eligible women entrepreneurs.")
                        .category("Entrepreneurship")
                        .beneficiaryType("Women Entrepreneurs")
                        .targetBeneficiary("Women Business Owners")
                        .schemeType("Financial Assistance")
                        .state("All India")
                        .applicationProcess("Submit business proposal online. Undergo district committee evaluation followed by bank sanction.")
                        .requiredDocuments("Business Registration Proof, Bank Statement, Aadhaar, Project Report")
                        .deadline(LocalDate.now().plusMonths(6))
                        .officialUrl("https://womenbiz.demo.gov.in")
                        .status("PUBLISHED")
                        .version(1)
                        .officialSchemeId("SCH-WOM-2026-02")
                        .tagsKeywords("women, entrepreneurship, business loan, grant, subsidy")
                        .build(),
                List.of(
                        SchemeRequirement.builder().fieldName("gender").fieldLabel("Gender").dataType("SELECT").operator("==").requiredValue("Female").mandatory(true).weight(35.0).logicalGroup("AND").conditionOrder(1).build(),
                        SchemeRequirement.builder().fieldName("age").fieldLabel("Age").dataType("NUMBER").operator(">=").requiredValue("21").mandatory(true).weight(20.0).logicalGroup("AND").conditionOrder(2).build(),
                        SchemeRequirement.builder().fieldName("income").fieldLabel("Annual Personal Income").dataType("NUMBER").operator("<=").requiredValue("500000").mandatory(false).weight(15.0).logicalGroup("AND").conditionOrder(3).build(),
                        SchemeRequirement.builder().fieldName("employmentStatus").fieldLabel("Employment / Business Status").dataType("SELECT").operator("IN").requiredValue("Self-Employed,Business Owner,Unemployed").mandatory(true).weight(30.0).logicalGroup("AND").conditionOrder(4).build()
                ),
                List.of(
                        SchemeBenefit.builder().title("Collateral-Free Seed Capital").description("Low interest business loan up to ₹5 Lakhs.").amount("₹5,00,000").frequency("One-time").build(),
                        SchemeBenefit.builder().title("Capital Subsidy").description("35% grant subsidy credited upon successful milestone completion.").amount("35% Subsidy").frequency("One-time").build()
                ),
                List.of(
                        SchemeDocument.builder().name("Business Plan / Project Report").description("Detailed project summary including cash flow projections.").mandatory(true).build(),
                        SchemeDocument.builder().name("Business Registration / Udyam Certificate").description("Udyam MSME Registration Certificate.").mandatory(true).build(),
                        SchemeDocument.builder().name("Bank Passbook & 6 Months Statement").description("Bank account statement of applicant or enterprise.").mandatory(true).build()
                ),
                List.of(
                        SchemeApplicationStep.builder().stepNumber(1).title("Online Application").description("Fill business proposal form on Udyamita Portal.").build(),
                        SchemeApplicationStep.builder().stepNumber(2).title("District Screening").description("Presentation to District Industries Centre committee.").build(),
                        SchemeApplicationStep.builder().stepNumber(3).title("Bank Loan Sanction").description("Nodal bank inspects premises and releases loan.").build()
                ),
                List.of(
                        SchemeFAQ.builder().question("What is the maximum loan amount?").answer("Eligible women entrepreneurs can secure collateral-free loans up to ₹5 Lakhs with 35% subsidy.").displayOrder(1).build()
                ),
                List.of(
                        SchemeSource.builder().sourceName("National Women Business Portal (Demo)").officialUrl("https://womenbiz.demo.gov.in").referenceDescription("Official demo reference for Mahila Udyamita scheme.").sourceType("Department Website").build()
                )
        ));

        // 3. Farmer Assistance Scheme
        list.add(new DemoSchemePayload(
                Scheme.builder()
                        .name("Kisan Samriddhi Small & Marginal Farmer Support [DEMO]")
                        .department("Ministry of Agriculture & Farmers Welfare")
                        .description("DEMO DATA: Annual direct income support and crop insurance subsidy for small and marginal landholding farmers.")
                        .shortDescription("DEMO SCHEME: Direct income support of ₹6,000/year for landholding farmers.")
                        .benefits("Direct cash transfer of ₹6,000 per annum in three equal installments of ₹2,000.")
                        .category("Agriculture")
                        .beneficiaryType("Farmers")
                        .targetBeneficiary("Small Farmers")
                        .schemeType("Subsidy")
                        .state("All India")
                        .applicationProcess("Register on portal with land survey numbers and Aadhaar details. Verified by village revenue officer.")
                        .requiredDocuments("Land Ownership Document (Patta/Khatauni), Aadhaar Card, Bank Details")
                        .deadline(LocalDate.now().plusMonths(5))
                        .officialUrl("https://kisan.demo.gov.in")
                        .status("PUBLISHED")
                        .version(1)
                        .officialSchemeId("SCH-AGR-2026-03")
                        .tagsKeywords("farmer, agriculture, kisan, land, subsidy")
                        .build(),
                List.of(
                        SchemeRequirement.builder().fieldName("farmerStatus").fieldLabel("Farmer Status").dataType("BOOLEAN").operator("==").requiredValue("true").mandatory(true).weight(35.0).logicalGroup("AND").conditionOrder(1).build(),
                        SchemeRequirement.builder().fieldName("landOwnership").fieldLabel("Land Ownership").dataType("BOOLEAN").operator("==").requiredValue("true").mandatory(true).weight(35.0).logicalGroup("AND").conditionOrder(2).build(),
                        SchemeRequirement.builder().fieldName("landArea").fieldLabel("Cultivable Land Area (Acres)").dataType("NUMBER").operator("<=").requiredValue("5.0").mandatory(true).weight(30.0).logicalGroup("AND").conditionOrder(3).build()
                ),
                List.of(
                        SchemeBenefit.builder().title("Direct Income Support").description("₹6,000 paid annually directly into linked bank account.").amount("₹6,000/yr").frequency("Annual").build(),
                        SchemeBenefit.builder().title("Subsidized Fertilizer Kit").description("Voucher for 50% discount on organic fertilizers.").amount("₹2,000").frequency("Seasonal").build()
                ),
                List.of(
                        SchemeDocument.builder().name("Land Record (Khatauni)").description("Updated copy of land ownership record issued by Tehsildar.").mandatory(true).build(),
                        SchemeDocument.builder().name("Aadhaar Card").description("Aadhaar card linked to bank account.").mandatory(true).build()
                ),
                List.of(
                        SchemeApplicationStep.builder().stepNumber(1).title("E-KYC Registration").description("Complete e-KYC using Aadhaar OTP.").build(),
                        SchemeApplicationStep.builder().stepNumber(2).title("Land Data Verification").description("State land record database verifies plot ownership.").build(),
                        SchemeApplicationStep.builder().stepNumber(3).title("Installment Transfer").description("Funds transferred directly to bank account via PFMS.").build()
                ),
                List.of(
                        SchemeFAQ.builder().question("Can tenant farmers apply?").answer("Tenant farmers require specific state lease certificates to qualify for income support.").displayOrder(1).build()
                ),
                List.of(
                        SchemeSource.builder().sourceName("Department of Agriculture Demo Portal").officialUrl("https://kisan.demo.gov.in").sourceType("Official Portal").build()
                )
        ));

        // 4. Senior Citizen Support Scheme
        list.add(new DemoSchemePayload(
                Scheme.builder()
                        .name("Vayoshreshtha Senior Citizen Pension & Healthcare Support [DEMO]")
                        .department("Ministry of Social Justice & Empowerment")
                        .description("DEMO DATA: Monthly pension and free healthcare insurance coverage for senior citizens aged 60 and above.")
                        .shortDescription("DEMO SCHEME: Monthly pension of ₹3,000 and healthcare card for elderly citizens.")
                        .benefits("Monthly pension of ₹3,000 along with ₹5 Lakh free annual medical cover.")
                        .category("Social Welfare")
                        .beneficiaryType("Senior Citizens")
                        .targetBeneficiary("Elderly Citizens (60+)")
                        .schemeType("Financial Assistance")
                        .state("All India")
                        .applicationProcess("Apply online or at local Gram Panchayat / Municipal Ward office with age proof and income certificate.")
                        .requiredDocuments("Age Proof (Passport/Aadhaar/Voter ID), BPL/Income Card, Bank Passbook")
                        .deadline(null)
                        .officialUrl("https://seniorpension.demo.gov.in")
                        .status("PUBLISHED")
                        .version(1)
                        .officialSchemeId("SCH-SNR-2026-04")
                        .tagsKeywords("senior citizen, pension, elderly, healthcare")
                        .build(),
                List.of(
                        SchemeRequirement.builder().fieldName("age").fieldLabel("Age").dataType("NUMBER").operator(">=").requiredValue("60").mandatory(true).weight(50.0).logicalGroup("AND").conditionOrder(1).build(),
                        SchemeRequirement.builder().fieldName("income").fieldLabel("Annual Income").dataType("NUMBER").operator("<=").requiredValue("200000").mandatory(true).weight(50.0).logicalGroup("AND").conditionOrder(2).build()
                ),
                List.of(
                        SchemeBenefit.builder().title("Monthly Pension").description("Direct monthly cash assistance credited to bank account.").amount("₹3,000/mo").frequency("Monthly").build(),
                        SchemeBenefit.builder().title("Free Health Cover Card").description("Cashless hospitalization cover up to ₹5,00,000 per year.").amount("₹5,00,000/yr").frequency("Annual").build()
                ),
                List.of(
                        SchemeDocument.builder().name("Proof of Age").description("Aadhaar Card or Birth Certificate or Voter ID Card.").mandatory(true).build(),
                        SchemeDocument.builder().name("Income Certificate").description("Annual income certificate showing income below ₹2 Lakhs.").mandatory(true).build()
                ),
                List.of(
                        SchemeApplicationStep.builder().stepNumber(1).title("Form Submission").description("Submit application online or at local administrative office.").build(),
                        SchemeApplicationStep.builder().stepNumber(2).title("Age & Income Verification").description("Verification by Social Welfare Inspector.").build(),
                        SchemeApplicationStep.builder().stepNumber(3).title("Pension Card Issue").description("Pension card issued and monthly payment started.").build()
                ),
                List.of(
                        SchemeFAQ.builder().question("What is the minimum age to apply?").answer("Applicants must be at least 60 years of age on the date of application.").displayOrder(1).build()
                ),
                List.of(
                        SchemeSource.builder().sourceName("Social Justice Department Senior Portal").officialUrl("https://seniorpension.demo.gov.in").sourceType("Government Portal").build()
                )
        ));

        // 5. Youth Skill Development Scheme
        list.add(new DemoSchemePayload(
                Scheme.builder()
                        .name("Yuva Kaushal Skill Development & Apprenticeship Fellowship [DEMO]")
                        .department("Ministry of Skill Development & Entrepreneurship")
                        .description("DEMO DATA: Free technical skill training and paid 6-month industry apprenticeship for unemployed youth.")
                        .shortDescription("DEMO SCHEME: Paid skill training and ₹8,000 monthly stipend during apprenticeship.")
                        .benefits("Free industry-certified training course plus ₹8,000 monthly stipend during 6-month apprenticeship.")
                        .category("Skill Development")
                        .beneficiaryType("Youth")
                        .targetBeneficiary("Unemployed Youth")
                        .schemeType("Skill Development")
                        .state("All India")
                        .applicationProcess("Select preferred skill domain online, attend skill center orientation, complete training, and join industry placement.")
                        .requiredDocuments("Aadhaar Card, Educational Certificate (10th/12th/Diploma), Bank Account Details")
                        .deadline(LocalDate.now().plusMonths(3))
                        .officialUrl("https://yuvakaushal.demo.gov.in")
                        .status("PUBLISHED")
                        .version(1)
                        .officialSchemeId("SCH-SKL-2026-05")
                        .tagsKeywords("skill, training, youth, apprenticeship, job")
                        .build(),
                List.of(
                        SchemeRequirement.builder().fieldName("age").fieldLabel("Age").dataType("NUMBER").operator(">=").requiredValue("18").mandatory(true).weight(25.0).logicalGroup("AND").conditionOrder(1).build(),
                        SchemeRequirement.builder().fieldName("age").fieldLabel("Age").dataType("NUMBER").operator("<=").requiredValue("29").mandatory(true).weight(25.0).logicalGroup("AND").conditionOrder(2).build(),
                        SchemeRequirement.builder().fieldName("employmentStatus").fieldLabel("Employment Status").dataType("SELECT").operator("IN").requiredValue("Unemployed,Job Seeker").mandatory(true).weight(50.0).logicalGroup("AND").conditionOrder(3).build()
                ),
                List.of(
                        SchemeBenefit.builder().title("Free Training & Certification").description("Government-certified technical course in IT, Electronics, or Automotive.").amount("Free Course").frequency("One-time").build(),
                        SchemeBenefit.builder().title("Apprenticeship Stipend").description("Monthly cash stipend provided during 6-month hands-on industry training.").amount("₹8,000/mo").frequency("Monthly").build()
                ),
                List.of(
                        SchemeDocument.builder().name("Educational Marksheet").description("Certificate showing completion of 10th standard or higher.").mandatory(true).build(),
                        SchemeDocument.builder().name("Aadhaar Card").description("Government identity proof.").mandatory(true).build()
                ),
                List.of(
                        SchemeApplicationStep.builder().stepNumber(1).title("Skill Portal Registration").description("Create profile and select preferred vocational trade.").build(),
                        SchemeApplicationStep.builder().stepNumber(2).title("Center Allocation").description("Assigned to nearest accredited training center.").build(),
                        SchemeApplicationStep.builder().stepNumber(3).title("Certification & Placement").description("Complete 3 months coursework and enter paid apprenticeship.").build()
                ),
                List.of(
                        SchemeFAQ.builder().question("How long is the training program?").answer("Training consists of 3 months classroom instruction followed by 6 months paid industry apprenticeship.").displayOrder(1).build()
                ),
                List.of(
                        SchemeSource.builder().sourceName("Skill India Demo Portal").officialUrl("https://yuvakaushal.demo.gov.in").sourceType("Official Portal").build()
                )
        ));

        // 6. Housing Assistance Scheme
        list.add(new DemoSchemePayload(
                Scheme.builder()
                        .name("Pradhan Mantri Gramin Awas Housing Subsidy Scheme [DEMO]")
                        .department("Ministry of Rural Development & Housing")
                        .description("DEMO DATA: Financial housing grant for homeless rural families and households living in kutcha/dilapidated structures.")
                        .shortDescription("DEMO SCHEME: ₹1,50,000 cash grant for constructing permanent pucca house.")
                        .benefits("Direct grant of ₹1,50,000 released in 3 construction milestone installments.")
                        .category("Housing")
                        .beneficiaryType("Rural Households")
                        .targetBeneficiary("Homeless / Kutcha House Residents")
                        .schemeType("Housing")
                        .state("All India")
                        .applicationProcess("Identified through rural housing survey and Gram Sabha approval. Inspections conducted at geotagged construction stages.")
                        .requiredDocuments("Land Ownership/Homestead Certificate, Aadhaar, Bank Details, House Photo")
                        .deadline(LocalDate.now().plusMonths(8))
                        .officialUrl("https://pmayg.demo.gov.in")
                        .status("PUBLISHED")
                        .version(1)
                        .officialSchemeId("SCH-HSG-2026-06")
                        .tagsKeywords("housing, awas, rural, home, grant")
                        .build(),
                List.of(
                        SchemeRequirement.builder().fieldName("urbanRural").fieldLabel("Location Type").dataType("SELECT").operator("==").requiredValue("Rural").mandatory(true).weight(35.0).logicalGroup("AND").conditionOrder(1).build(),
                        SchemeRequirement.builder().fieldName("housingStatus").fieldLabel("Housing Status").dataType("SELECT").operator("IN").requiredValue("Kutcha,Homeless,Rent,Temporary").mandatory(true).weight(40.0).logicalGroup("AND").conditionOrder(2).build(),
                        SchemeRequirement.builder().fieldName("income").fieldLabel("Annual Household Income").dataType("NUMBER").operator("<=").requiredValue("250000").mandatory(true).weight(25.0).logicalGroup("AND").conditionOrder(3).build()
                ),
                List.of(
                        SchemeBenefit.builder().title("House Construction Financial Grant").description("Grant of ₹1,50,000 paid in 3 milestone installments.").amount("₹1,50,000").frequency("One-time").build(),
                        SchemeBenefit.builder().title("Toilet Construction Incentive").description("Additional ₹12,000 under Swachh Bharat Mission.").amount("₹12,000").frequency("One-time").build()
                ),
                List.of(
                        SchemeDocument.builder().name("Geotagged Photo of Current Structure").description("Photo showing current Kutcha house condition.").mandatory(true).build(),
                        SchemeDocument.builder().name("Land / Homestead Title").description("Proof of plot ownership or Gram Panchayat allotment letter.").mandatory(true).build()
                ),
                List.of(
                        SchemeApplicationStep.builder().stepNumber(1).title("Gram Sabha Priority List").description("Household identified on Gram Sabha priority registry.").build(),
                        SchemeApplicationStep.builder().stepNumber(2).title("Geotagged Inspection").description("Official inspects site and uploads initial geotagged photo.").build(),
                        SchemeApplicationStep.builder().stepNumber(3).title("Milestone Payments").description("Funds released upon foundation, lintel, and roof completion.").build()
                ),
                List.of(
                        SchemeFAQ.builder().question("Are urban residents eligible under this scheme?").answer("No, this specific scheme is for rural areas. Urban residents can explore the Urban Housing Subsidy scheme.").displayOrder(1).build()
                ),
                List.of(
                        SchemeSource.builder().sourceName("Rural Housing Demo Portal").officialUrl("https://pmayg.demo.gov.in").sourceType("Official Portal").build()
                )
        ));

        // 7. Small Business Support Scheme
        list.add(new DemoSchemePayload(
                Scheme.builder()
                        .name("MSME Micro-Enterprise Growth & Credit Support Scheme [DEMO]")
                        .department("Ministry of Micro, Small & Medium Enterprises")
                        .description("DEMO DATA: Subsidized working capital loan and technology upgradation grant for micro-businesses and small traders.")
                        .shortDescription("DEMO SCHEME: ₹2,00,000 collateral-free business loan with 15% interest rebate.")
                        .benefits("Working capital credit up to ₹2,00,000 with 15% prompt repayment interest subvention.")
                        .category("Small Business")
                        .beneficiaryType("Micro Business Owners")
                        .targetBeneficiary("Traders & Micro Enterprises")
                        .schemeType("Financial Assistance")
                        .state("All India")
                        .applicationProcess("Apply online with Udyam registration card and 6-month bank statement.")
                        .requiredDocuments("Udyam Registration Certificate, Bank Account Statement, PAN/Aadhaar")
                        .deadline(LocalDate.now().plusMonths(6))
                        .officialUrl("https://msmesupport.demo.gov.in")
                        .status("PUBLISHED")
                        .version(1)
                        .officialSchemeId("SCH-MSM-2026-07")
                        .tagsKeywords("msme, small business, loan, credit, udyam")
                        .build(),
                List.of(
                        SchemeRequirement.builder().fieldName("occupation").fieldLabel("Occupation / Trade").dataType("TEXT").operator("IN").requiredValue("Business,Shopkeeper,Trader,Vendor,Self-Employed").mandatory(true).weight(50.0).logicalGroup("AND").conditionOrder(1).build(),
                        SchemeRequirement.builder().fieldName("income").fieldLabel("Annual Business Turnover").dataType("NUMBER").operator("<=").requiredValue("1000000").mandatory(false).weight(50.0).logicalGroup("AND").conditionOrder(2).build()
                ),
                List.of(
                        SchemeBenefit.builder().title("Micro-Credit Working Capital").description("Collateral-free credit facility up to ₹2 Lakhs.").amount("₹2,00,000").frequency("One-time").build(),
                        SchemeBenefit.builder().title("Interest Rebate Subvention").description("15% interest discount for regular monthly repayments.").amount("15% Subvention").frequency("Recurring").build()
                ),
                List.of(
                        SchemeDocument.builder().name("Udyam MSME Certificate").description("Valid MSME registration certificate.").mandatory(true).build(),
                        SchemeDocument.builder().name("Bank Statement").description("Last 6 months bank statement showing active business transactions.").mandatory(true).build()
                ),
                List.of(
                        SchemeApplicationStep.builder().stepNumber(1).title("Portal Registration").description("Enter Udyam Registration number on MSME portal.").build(),
                        SchemeApplicationStep.builder().stepNumber(2).title("Automated Credit Check").description("System assesses bank statement and calculates credit score.").build(),
                        SchemeApplicationStep.builder().stepNumber(3).title("Disbursement").description("Approved credit limit disbursed directly to bank account.").build()
                ),
                List.of(
                        SchemeFAQ.builder().question("Is collateral required for this loan?").answer("No collateral is required for loans up to ₹2 Lakhs under this government credit scheme.").displayOrder(1).build()
                ),
                List.of(
                        SchemeSource.builder().sourceName("MSME Credit Portal (Demo)").officialUrl("https://msmesupport.demo.gov.in").sourceType("Official Portal").build()
                )
        ));

        // 8. Disability Assistance Scheme
        list.add(new DemoSchemePayload(
                Scheme.builder()
                        .name("Divyangjan Inclusive Assistance & Assistive Tech Support [DEMO]")
                        .department("Department of Empowerment of Persons with Disabilities")
                        .description("DEMO DATA: Financial pension, free assistive equipment (wheelchairs, hearing aids, braille laptops), and skill training for persons with benchmark disabilities.")
                        .shortDescription("DEMO SCHEME: Monthly disability pension of ₹3,500 and free assistive technology devices.")
                        .benefits("Monthly pension of ₹3,500 plus 100% subsidy on customized assistive devices.")
                        .category("Disability Assistance")
                        .beneficiaryType("Persons with Disabilities")
                        .targetBeneficiary("Divyangjan (PWD)")
                        .schemeType("Social Welfare")
                        .state("All India")
                        .applicationProcess("Upload Unique Disability ID (UDID) card on portal and attend district medical assessment camp.")
                        .requiredDocuments("UDID Card / Disability Certificate (min 40%), Aadhaar Card, Income Certificate, Photo")
                        .deadline(null)
                        .officialUrl("https://divyangjan.demo.gov.in")
                        .status("PUBLISHED")
                        .version(1)
                        .officialSchemeId("SCH-DIS-2026-08")
                        .tagsKeywords("disability, divyangjan, pension, assistive device, udid")
                        .build(),
                List.of(
                        SchemeRequirement.builder().fieldName("disabilityStatus").fieldLabel("Disability Status").dataType("BOOLEAN").operator("==").requiredValue("true").mandatory(true).weight(50.0).logicalGroup("AND").conditionOrder(1).build(),
                        SchemeRequirement.builder().fieldName("disabilityPercentage").fieldLabel("Disability Percentage (%)").dataType("NUMBER").operator(">=").requiredValue("40.0").mandatory(true).weight(30.0).logicalGroup("AND").conditionOrder(2).build(),
                        SchemeRequirement.builder().fieldName("income").fieldLabel("Annual Family Income").dataType("NUMBER").operator("<=").requiredValue("300000").mandatory(false).weight(20.0).logicalGroup("AND").conditionOrder(3).build()
                ),
                List.of(
                        SchemeBenefit.builder().title("Monthly Disability Pension").description("Direct monthly pension transfer to bank account.").amount("₹3,500/mo").frequency("Monthly").build(),
                        SchemeBenefit.builder().title("Free Assistive Devices Grant").description("Free motorized wheelchairs, hearing aids, or adaptive tech devices.").amount("₹50,000 Value").frequency("One-time").build()
                ),
                List.of(
                        SchemeDocument.builder().name("UDID Card / Disability Certificate").description("Official disability certificate showing at least 40% disability.").mandatory(true).build(),
                        SchemeDocument.builder().name("Aadhaar Card").description("Identity proof.").mandatory(true).build()
                ),
                List.of(
                        SchemeApplicationStep.builder().stepNumber(1).title("UDID Verification").description("Enter UDID card details on portal.").build(),
                        SchemeApplicationStep.builder().stepNumber(2).title("Assessment Camp").description("Attend medical camp for device measurement.").build(),
                        SchemeApplicationStep.builder().stepNumber(3).title("Benefit Distribution").description("Monthly pension activated and device delivered.").build()
                ),
                List.of(
                        SchemeFAQ.builder().question("What disability percentage is required?").answer("A minimum benchmark disability of 40% certified by an authorized medical board is required.").displayOrder(1).build()
                ),
                List.of(
                        SchemeSource.builder().sourceName("Divyangjan Portal Demo").officialUrl("https://divyangjan.demo.gov.in").sourceType("Official Portal").build()
                )
        ));

        // 9. Rural Employment Support Scheme
        list.add(new DemoSchemePayload(
                Scheme.builder()
                        .name("Mahatma Gandhi Rural Employment & Livelihood Guarantee [DEMO]")
                        .department("Ministry of Rural Development")
                        .description("DEMO DATA: Guaranteed 100 days of wage employment per financial year for rural adult household members volunteering for unskilled work.")
                        .shortDescription("DEMO SCHEME: Guaranteed 100 days wage employment for rural adults.")
                        .benefits("Guaranteed 100 days wage employment paid at ₹310/day directly into bank account within 15 days of work.")
                        .category("Employment")
                        .beneficiaryType("Rural Workers")
                        .targetBeneficiary("Rural Adults")
                        .schemeType("Employment")
                        .state("All India")
                        .applicationProcess("Apply at local Gram Panchayat office for Job Card issuance and submit work demand application.")
                        .requiredDocuments("Job Card / Aadhaar Card, Bank Account Details, Passport Photo")
                        .deadline(null)
                        .officialUrl("https://mgnrega.demo.gov.in")
                        .status("PUBLISHED")
                        .version(1)
                        .officialSchemeId("SCH-EMP-2026-09")
                        .tagsKeywords("employment, rural, job card, mgnrega, wages")
                        .build(),
                List.of(
                        SchemeRequirement.builder().fieldName("urbanRural").fieldLabel("Location Type").dataType("SELECT").operator("==").requiredValue("Rural").mandatory(true).weight(50.0).logicalGroup("AND").conditionOrder(1).build(),
                        SchemeRequirement.builder().fieldName("age").fieldLabel("Age").dataType("NUMBER").operator(">=").requiredValue("18").mandatory(true).weight(50.0).logicalGroup("AND").conditionOrder(2).build()
                ),
                List.of(
                        SchemeBenefit.builder().title("Guaranteed Wage Employment").description("100 days guaranteed unskilled manual work per household.").amount("₹310/day").frequency("Daily/Weekly").build(),
                        SchemeBenefit.builder().title("Unemployment Allowance").description("Allowance paid if work is not allocated within 15 days of demand.").amount("State Wage Rate").frequency("As Applicable").build()
                ),
                List.of(
                        SchemeDocument.builder().name("Rural Job Card").description("Issued by local Gram Panchayat.").mandatory(true).build(),
                        SchemeDocument.builder().name("Bank Passbook").description("Aadhaar-linked bank account.").mandatory(true).build()
                ),
                List.of(
                        SchemeApplicationStep.builder().stepNumber(1).title("Job Card Application").description("Apply at Gram Panchayat for Job Card.").build(),
                        SchemeApplicationStep.builder().stepNumber(2).title("Work Demand Submission").description("Submit written request for work allocation.").build(),
                        SchemeApplicationStep.builder().stepNumber(3).title("Wage Transfer").description("Wages transferred directly via e-FTO within 15 days.").build()
                ),
                List.of(
                        SchemeFAQ.builder().question("How many days of work are guaranteed?").answer("Every rural household is entitled to up to 100 days of guaranteed wage employment per year.").displayOrder(1).build()
                ),
                List.of(
                        SchemeSource.builder().sourceName("NREGA Demo Portal").officialUrl("https://mgnrega.demo.gov.in").sourceType("Official Portal").build()
                )
        ));

        // 10. Girl Child Education Support Scheme
        list.add(new DemoSchemePayload(
                Scheme.builder()
                        .name("Beti Padhao Girl Child Higher Education & Welfare Support [DEMO]")
                        .department("Ministry of Women & Child Development & Education")
                        .description("DEMO DATA: Educational incentive fellowship and fixed deposit maturity bond to support higher education for female students.")
                        .shortDescription("DEMO SCHEME: ₹1,00,000 educational bond upon completing 12th standard.")
                        .benefits("Fixed deposit bond of ₹1,00,000 maturing at age 18 for girl students entering university.")
                        .category("Education")
                        .beneficiaryType("Girl Students")
                        .targetBeneficiary("Female Students")
                        .schemeType("Scholarship")
                        .state("All India")
                        .applicationProcess("Register student details in school portal. Maturity bond automatically created in postal savings bank.")
                        .requiredDocuments("Girl Child Birth Certificate, School Bonafide Certificate, Parent Income Proof, Aadhaar")
                        .deadline(LocalDate.now().plusMonths(6))
                        .officialUrl("https://betipadhao.demo.gov.in")
                        .status("PUBLISHED")
                        .version(1)
                        .officialSchemeId("SCH-GRL-2026-10")
                        .tagsKeywords("girl child, education, scholarship, beti padhao, female")
                        .build(),
                List.of(
                        SchemeRequirement.builder().fieldName("gender").fieldLabel("Gender").dataType("SELECT").operator("==").requiredValue("Female").mandatory(true).weight(40.0).logicalGroup("AND").conditionOrder(1).build(),
                        SchemeRequirement.builder().fieldName("studentStatus").fieldLabel("Student Status").dataType("BOOLEAN").operator("==").requiredValue("true").mandatory(true).weight(30.0).logicalGroup("AND").conditionOrder(2).build(),
                        SchemeRequirement.builder().fieldName("income").fieldLabel("Annual Family Income").dataType("NUMBER").operator("<=").requiredValue("350000").mandatory(true).weight(30.0).logicalGroup("AND").conditionOrder(3).build()
                ),
                List.of(
                        SchemeBenefit.builder().title("Higher Education Maturity Grant").description("Fixed bond of ₹1,00,000 for college admission.").amount("₹1,00,000").frequency("One-time").build(),
                        SchemeBenefit.builder().title("Annual Laptop / Tablet Allowance").description("Allowance for acquiring digital learning devices.").amount("₹15,000").frequency("Annual").build()
                ),
                List.of(
                        SchemeDocument.builder().name("Girl Child Birth Certificate").description("Official birth registration certificate.").mandatory(true).build(),
                        SchemeDocument.builder().name("School Enrolment Certificate").description("Issued by headmaster or principal.").mandatory(true).build()
                ),
                List.of(
                        SchemeApplicationStep.builder().stepNumber(1).title("School Portal Entry").description("School Nodal Officer enters girl student profile.").build(),
                        SchemeApplicationStep.builder().stepNumber(2).title("Bond Account Creation").description("Post Office / Bank opens interest-bearing bond account.").build(),
                        SchemeApplicationStep.builder().stepNumber(3).title("Maturity Disbursement").description("Maturity proceeds credited when student enrolls in college.").build()
                ),
                List.of(
                        SchemeFAQ.builder().question("At what age does the bond mature?").answer("The educational bond matures when the girl child turns 18 years old and passes 12th board exams.").displayOrder(1).build()
                ),
                List.of(
                        SchemeSource.builder().sourceName("Beti Padhao Demo Portal").officialUrl("https://betipadhao.demo.gov.in").sourceType("Official Portal").build()
                )
        ));

        // Persist schemes and requirements
        for (DemoSchemePayload payload : list) {
            Scheme saved = schemeRepository.save(payload.getScheme());

            if (payload.getRequirements() != null) {
                for (SchemeRequirement req : payload.getRequirements()) {
                    req.setSchemeId(saved.getId());
                    requirementRepository.save(req);
                }
            }
            if (payload.getBenefits() != null) {
                for (SchemeBenefit b : payload.getBenefits()) {
                    b.setSchemeId(saved.getId());
                    benefitRepository.save(b);
                }
            }
            if (payload.getDocuments() != null) {
                for (SchemeDocument d : payload.getDocuments()) {
                    d.setSchemeId(saved.getId());
                    documentRepository.save(d);
                }
            }
            if (payload.getSteps() != null) {
                for (SchemeApplicationStep s : payload.getSteps()) {
                    s.setSchemeId(saved.getId());
                    stepRepository.save(s);
                }
            }
            if (payload.getFaqs() != null) {
                for (SchemeFAQ f : payload.getFaqs()) {
                    f.setSchemeId(saved.getId());
                    faqRepository.save(f);
                }
            }
            if (payload.getSources() != null) {
                for (SchemeSource src : payload.getSources()) {
                    src.setSchemeId(saved.getId());
                    sourceRepository.save(src);
                }
            }
        }

        log.info("Database seeding successfully completed. 10 realistic DEMO schemes initialized.");
    }

    @org.springframework.transaction.annotation.Transactional
    private void seedOrUpdateRequirementsForAllSchemes() {
        List<Scheme> allSchemes = schemeRepository.findAll();
        log.info("[SEED] Updating dynamic eligibility requirements for all {} schemes in database...", allSchemes.size());
        
        for (Scheme s : allSchemes) {
            requirementRepository.deleteBySchemeId(s.getId());

            log.info("[SEED] Seeding custom eligibility rules for scheme: {} (ID: {})", s.getName(), s.getId());
            List<SchemeRequirement> reqs = new ArrayList<>();
            String name = s.getName().toLowerCase();
            String cat = (s.getCategory() != null ? s.getCategory() : "").toLowerCase();

            if (name.contains("central sector scholarship") || s.getId().equals(14L)) {
                reqs.add(SchemeRequirement.builder().fieldName("studentStatus").fieldLabel("Student Status").dataType("BOOLEAN").operator("==").requiredValue("true").mandatory(true).weight(25.0).logicalGroup("AND").conditionOrder(1).questionText("Are you currently enrolled as a full-time student in a higher education institution?").build());
                reqs.add(SchemeRequirement.builder().fieldName("income").fieldLabel("Annual Family Income").dataType("NUMBER").operator("<=").requiredValue("450000").mandatory(true).unit("₹").weight(25.0).logicalGroup("AND").conditionOrder(2).questionText("What is your total annual family income from all sources?").build());
                reqs.add(SchemeRequirement.builder().fieldName("twelfthPercentile").fieldLabel("12th Board Exam Percentile").dataType("NUMBER").operator(">=").requiredValue("80.0").mandatory(true).unit("%").weight(30.0).logicalGroup("AND").conditionOrder(3).questionText("What was your Class 12th Board Examination Percentile?").helpText("Central Sector Scholarship requires 80th percentile or above in Class 12 board exams.").build());
                reqs.add(SchemeRequirement.builder().fieldName("education").fieldLabel("Education Level").dataType("SELECT").operator("IN").requiredValue("Undergraduate,Postgraduate").mandatory(true).optionsCsv("Undergraduate,Postgraduate,Diploma,Secondary").weight(20.0).logicalGroup("AND").conditionOrder(4).questionText("What level of higher education degree are you pursuing?").build());
            } else if (name.contains("post matric") || name.contains("post-matric") || s.getId().equals(1L)) {
                reqs.add(SchemeRequirement.builder().fieldName("studentStatus").fieldLabel("Student Status").dataType("BOOLEAN").operator("==").requiredValue("true").mandatory(true).weight(25.0).logicalGroup("AND").conditionOrder(1).questionText("Are you currently enrolled as a student in a post-secondary course?").build());
                reqs.add(SchemeRequirement.builder().fieldName("income").fieldLabel("Annual Family Income").dataType("NUMBER").operator("<=").requiredValue("250000").mandatory(true).unit("₹").weight(30.0).logicalGroup("AND").conditionOrder(2).questionText("What is your annual family income?").build());
                reqs.add(SchemeRequirement.builder().fieldName("previousExamPercentage").fieldLabel("Previous Academic Score %").dataType("NUMBER").operator(">=").requiredValue("50.0").mandatory(true).unit("%").weight(25.0).logicalGroup("AND").conditionOrder(3).questionText("What percentage did you achieve in your previous qualifying academic examination?").build());
                reqs.add(SchemeRequirement.builder().fieldName("education").fieldLabel("Education Level").dataType("SELECT").operator("IN").requiredValue("Undergraduate,Postgraduate,Diploma").mandatory(true).optionsCsv("Undergraduate,Postgraduate,Diploma,Secondary").weight(20.0).logicalGroup("AND").conditionOrder(4).questionText("What is your current education level?").build());
            } else if (name.contains("kisan") || name.contains("pm-kisan") || cat.contains("agriculture") || s.getId().equals(2L)) {
                reqs.add(SchemeRequirement.builder().fieldName("farmerStatus").fieldLabel("Farmer Status").dataType("BOOLEAN").operator("==").requiredValue("true").mandatory(true).weight(35.0).logicalGroup("AND").conditionOrder(1).questionText("Are you a practicing farmer or landholding agricultural worker?").build());
                reqs.add(SchemeRequirement.builder().fieldName("landOwnership").fieldLabel("Land Ownership").dataType("BOOLEAN").operator("==").requiredValue("true").mandatory(true).weight(35.0).logicalGroup("AND").conditionOrder(2).dependsOnField("farmerStatus").dependsOnValue("Yes").questionText("Do you own cultivable agricultural land registered in your name?").build());
                reqs.add(SchemeRequirement.builder().fieldName("landArea").fieldLabel("Cultivable Land Area").dataType("NUMBER").operator("<=").requiredValue("5.0").mandatory(true).unit("Acres").weight(15.0).logicalGroup("AND").conditionOrder(3).dependsOnField("farmerStatus").dependsOnValue("Yes").questionText("What is the total area of cultivable land owned by your family?").build());
                reqs.add(SchemeRequirement.builder().fieldName("landRecordStatus").fieldLabel("Land Revenue Record Verification").dataType("SELECT").operator("==").requiredValue("Verified").mandatory(true).optionsCsv("Verified,Pending,Not Available").weight(15.0).logicalGroup("AND").conditionOrder(4).dependsOnField("farmerStatus").dependsOnValue("Yes").questionText("Is your land ownership record verified in the state land revenue database?").build());
            } else if (name.contains("rozgar") || name.contains("pmry") || s.getId().equals(3L)) {
                reqs.add(SchemeRequirement.builder().fieldName("age").fieldLabel("Minimum Age").dataType("NUMBER").operator(">=").requiredValue("18").mandatory(true).weight(20.0).logicalGroup("AND").conditionOrder(1).questionText("What is your age?").build());
                reqs.add(SchemeRequirement.builder().fieldName("age").fieldLabel("Maximum Age").dataType("NUMBER").operator("<=").requiredValue("35").mandatory(true).weight(20.0).logicalGroup("AND").conditionOrder(2).questionText("What is your age?").build());
                reqs.add(SchemeRequirement.builder().fieldName("employmentStatus").fieldLabel("Employment Status").dataType("SELECT").operator("IN").requiredValue("Unemployed,Job Seeker").mandatory(true).optionsCsv("Unemployed,Job Seeker,Employed,Student").weight(30.0).logicalGroup("AND").conditionOrder(3).questionText("What is your current employment status?").build());
                reqs.add(SchemeRequirement.builder().fieldName("income").fieldLabel("Annual Family Income").dataType("NUMBER").operator("<=").requiredValue("240000").mandatory(true).unit("₹").weight(15.0).logicalGroup("AND").conditionOrder(4).questionText("What is your family's annual income?").build());
                reqs.add(SchemeRequirement.builder().fieldName("businessPlanApproved").fieldLabel("Business Project Plan Status").dataType("SELECT").operator("==").requiredValue("Yes").mandatory(true).optionsCsv("Yes,No,Draft").weight(15.0).logicalGroup("AND").conditionOrder(5).questionText("Do you have a prepared micro-enterprise business plan for PMRY loan approval?").build());
            } else if (name.contains("old age") || name.contains("senior") || s.getId().equals(4L)) {
                reqs.add(SchemeRequirement.builder().fieldName("age").fieldLabel("Minimum Age").dataType("NUMBER").operator(">=").requiredValue("60").mandatory(true).weight(50.0).logicalGroup("AND").conditionOrder(1).questionText("What is your age?").build());
                reqs.add(SchemeRequirement.builder().fieldName("income").fieldLabel("Annual Income").dataType("NUMBER").operator("<=").requiredValue("120000").mandatory(true).unit("₹").weight(30.0).logicalGroup("AND").conditionOrder(2).questionText("What is your annual income?").build());
                reqs.add(SchemeRequirement.builder().fieldName("bplCardStatus").fieldLabel("BPL Ration Card Status").dataType("SELECT").operator("==").requiredValue("Yes").mandatory(true).optionsCsv("Yes,No").weight(20.0).logicalGroup("AND").conditionOrder(3).questionText("Does your household hold an active BPL (Below Poverty Line) card?").build());
            } else if (name.contains("disability") || name.contains("divyangjan") || s.getId().equals(5L)) {
                reqs.add(SchemeRequirement.builder().fieldName("disabilityStatus").fieldLabel("Disability Status").dataType("BOOLEAN").operator("==").requiredValue("true").mandatory(true).weight(40.0).logicalGroup("AND").conditionOrder(1).questionText("Do you have a recognized physical or mental disability?").build());
                reqs.add(SchemeRequirement.builder().fieldName("disabilityPercentage").fieldLabel("Disability Percentage").dataType("NUMBER").operator(">=").requiredValue("40.0").mandatory(true).unit("%").weight(30.0).logicalGroup("AND").conditionOrder(2).dependsOnField("disabilityStatus").dependsOnValue("Yes").questionText("What is your certified disability percentage?").build());
                reqs.add(SchemeRequirement.builder().fieldName("income").fieldLabel("Annual Family Income").dataType("NUMBER").operator("<=").requiredValue("120000").mandatory(true).unit("₹").weight(30.0).logicalGroup("AND").conditionOrder(3).questionText("What is your annual household income?").build());
            } else if (name.contains("awas") || name.contains("housing") || s.getId().equals(6L)) {
                reqs.add(SchemeRequirement.builder().fieldName("urbanRural").fieldLabel("Location Type").dataType("SELECT").operator("==").requiredValue("Rural").mandatory(true).optionsCsv("Rural,Urban").weight(30.0).logicalGroup("AND").conditionOrder(1).questionText("Do you reside in a rural village area?").build());
                reqs.add(SchemeRequirement.builder().fieldName("housingStatus").fieldLabel("Current Housing Structure").dataType("SELECT").operator("IN").requiredValue("Kutcha,Homeless,Temporary,Rent").mandatory(true).optionsCsv("Kutcha,Homeless,Temporary,Rent,Pucca").weight(40.0).logicalGroup("AND").conditionOrder(2).questionText("What type of home do you currently live in?").build());
                reqs.add(SchemeRequirement.builder().fieldName("income").fieldLabel("Annual Household Income").dataType("NUMBER").operator("<=").requiredValue("300000").mandatory(true).unit("₹").weight(30.0).logicalGroup("AND").conditionOrder(3).questionText("What is your annual household income?").build());
            } else if (name.contains("widow") || s.getId().equals(7L)) {
                reqs.add(SchemeRequirement.builder().fieldName("gender").fieldLabel("Gender").dataType("SELECT").operator("==").requiredValue("Female").mandatory(true).optionsCsv("Female,Male").weight(30.0).logicalGroup("AND").conditionOrder(1).questionText("Select your gender.").build());
                reqs.add(SchemeRequirement.builder().fieldName("maritalStatus").fieldLabel("Marital Status").dataType("SELECT").operator("==").requiredValue("Widowed").mandatory(true).optionsCsv("Widowed,Single,Married").weight(40.0).logicalGroup("AND").conditionOrder(2).questionText("What is your marital status?").build());
                reqs.add(SchemeRequirement.builder().fieldName("income").fieldLabel("Annual Income").dataType("NUMBER").operator("<=").requiredValue("120000").mandatory(true).unit("₹").weight(30.0).logicalGroup("AND").conditionOrder(3).questionText("What is your annual income?").build());
            } else if (name.contains("mgnrega") || name.contains("job card") || s.getId().equals(8L)) {
                reqs.add(SchemeRequirement.builder().fieldName("urbanRural").fieldLabel("Location Type").dataType("SELECT").operator("==").requiredValue("Rural").mandatory(true).optionsCsv("Rural,Urban").weight(40.0).logicalGroup("AND").conditionOrder(1).questionText("Do you reside in a rural area?").build());
                reqs.add(SchemeRequirement.builder().fieldName("age").fieldLabel("Minimum Age").dataType("NUMBER").operator(">=").requiredValue("18").mandatory(true).weight(30.0).logicalGroup("AND").conditionOrder(2).questionText("Are you an adult aged 18 or older?").build());
                reqs.add(SchemeRequirement.builder().fieldName("jobCardStatus").fieldLabel("Job Card Registration").dataType("SELECT").operator("IN").requiredValue("Registered,Applied").mandatory(true).optionsCsv("Registered,Applied,Not Registered").weight(30.0).logicalGroup("AND").conditionOrder(3).questionText("What is your MGNREGA Job Card status?").build());
            } else if (name.contains("magalir") || name.contains("urimai") || s.getId().equals(9L)) {
                reqs.add(SchemeRequirement.builder().fieldName("gender").fieldLabel("Gender").dataType("SELECT").operator("==").requiredValue("Female").mandatory(true).optionsCsv("Female,Male").weight(25.0).logicalGroup("AND").conditionOrder(1).questionText("Select your gender.").build());
                reqs.add(SchemeRequirement.builder().fieldName("state").fieldLabel("State Residence").dataType("TEXT").operator("==").requiredValue("Tamil Nadu").mandatory(true).weight(25.0).logicalGroup("AND").conditionOrder(2).questionText("Are you a permanent resident of Tamil Nadu?").build());
                reqs.add(SchemeRequirement.builder().fieldName("age").fieldLabel("Minimum Age").dataType("NUMBER").operator(">=").requiredValue("21").mandatory(true).weight(25.0).logicalGroup("AND").conditionOrder(3).questionText("What is your age?").build());
                reqs.add(SchemeRequirement.builder().fieldName("income").fieldLabel("Annual Family Income").dataType("NUMBER").operator("<=").requiredValue("250000").mandatory(true).unit("₹").weight(25.0).logicalGroup("AND").conditionOrder(4).questionText("What is your annual family income?").build());
            } else if (name.contains("fellowship") || s.getId().equals(10L)) {
                reqs.add(SchemeRequirement.builder().fieldName("education").fieldLabel("Education Qualification").dataType("SELECT").operator("IN").requiredValue("Postgraduate,PhD,Master of Technology,Master of Business Administration").mandatory(true).optionsCsv("Postgraduate,PhD,Undergraduate,Diploma").weight(35.0).logicalGroup("AND").conditionOrder(1).questionText("What is your highest completed educational degree?").build());
                reqs.add(SchemeRequirement.builder().fieldName("age").fieldLabel("Maximum Age").dataType("NUMBER").operator("<=").requiredValue("30").mandatory(true).weight(25.0).logicalGroup("AND").conditionOrder(2).questionText("What is your age?").build());
                reqs.add(SchemeRequirement.builder().fieldName("graduationPercentage").fieldLabel("Graduation Aggregate Score %").dataType("NUMBER").operator(">=").requiredValue("60.0").mandatory(true).unit("%").weight(25.0).logicalGroup("AND").conditionOrder(3).questionText("What aggregate percentage did you score in your Bachelor's degree?").build());
                reqs.add(SchemeRequirement.builder().fieldName("studentStatus").fieldLabel("Student Status").dataType("SELECT").operator("==").requiredValue("No").mandatory(true).optionsCsv("No,Yes").weight(15.0).logicalGroup("AND").conditionOrder(4).questionText("Are you currently a non-enrolled young professional ready for full-time fellowship?").build());
            } else if (name.contains("stand-up") || name.contains("stand up") || s.getId().equals(11L)) {
                reqs.add(SchemeRequirement.builder().fieldName("age").fieldLabel("Minimum Age").dataType("NUMBER").operator(">=").requiredValue("18").mandatory(true).weight(30.0).logicalGroup("AND").conditionOrder(1).questionText("What is your age?").build());
                reqs.add(SchemeRequirement.builder().fieldName("targetCategory").fieldLabel("Target Entrepreneur Category").dataType("SELECT").operator("IN").requiredValue("Woman Entrepreneur,SC,ST").mandatory(true).optionsCsv("Woman Entrepreneur,SC,ST,General").weight(40.0).logicalGroup("AND").conditionOrder(2).questionText("Which target category applies to your business promoter profile?").build());
                reqs.add(SchemeRequirement.builder().fieldName("greenfieldProject").fieldLabel("Greenfield Project Status").dataType("SELECT").operator("==").requiredValue("Yes").mandatory(true).optionsCsv("Yes,No").weight(30.0).logicalGroup("AND").conditionOrder(3).questionText("Is your proposed business a greenfield (first-time venture) project?").build());
            } else if (name.contains("svanidhi") || name.contains("vendor") || s.getId().equals(12L)) {
                reqs.add(SchemeRequirement.builder().fieldName("occupation").fieldLabel("Occupation").dataType("TEXT").operator("IN").requiredValue("Vendor,Trader,Shopkeeper,Business").mandatory(true).optionsCsv("Vendor,Trader,Shopkeeper,Student,Unemployed").weight(50.0).logicalGroup("AND").conditionOrder(1).questionText("What is your primary occupation?").build());
                reqs.add(SchemeRequirement.builder().fieldName("urbanRural").fieldLabel("Location Type").dataType("SELECT").operator("==").requiredValue("Urban").mandatory(true).optionsCsv("Urban,Rural").weight(25.0).logicalGroup("AND").conditionOrder(2).questionText("Do you operate your vending stall in an urban municipality?").build());
                reqs.add(SchemeRequirement.builder().fieldName("vendingCertificateStatus").fieldLabel("Certificate of Vending Status").dataType("SELECT").operator("==").requiredValue("Yes").mandatory(true).optionsCsv("Yes,No").weight(25.0).logicalGroup("AND").conditionOrder(3).questionText("Do you possess a Certificate of Vending or Urban Local Body identity card?").build());
            } else if (name.contains("matsya") || name.contains("pmmsy") || name.contains("fisheries") || s.getId().equals(13L)) {
                reqs.add(SchemeRequirement.builder().fieldName("occupation").fieldLabel("Occupation").dataType("TEXT").operator("IN").requiredValue("Fisherman,Aquaculture,Fisheries Farmer").mandatory(true).optionsCsv("Fisherman,Aquaculture,Student,Unemployed").weight(60.0).logicalGroup("AND").conditionOrder(1).questionText("What is your primary occupation?").build());
                reqs.add(SchemeRequirement.builder().fieldName("age").fieldLabel("Minimum Age").dataType("NUMBER").operator(">=").requiredValue("18").mandatory(true).weight(40.0).logicalGroup("AND").conditionOrder(2).questionText("What is your age?").build());
            } else if (name.contains("kaushalya") || name.contains("ddu-gky") || cat.contains("skill") || s.getId().equals(15L)) {
                reqs.add(SchemeRequirement.builder().fieldName("urbanRural").fieldLabel("Location Type").dataType("SELECT").operator("==").requiredValue("Rural").mandatory(true).optionsCsv("Rural,Urban").weight(30.0).logicalGroup("AND").conditionOrder(1).questionText("Do you reside in a rural area?").build());
                reqs.add(SchemeRequirement.builder().fieldName("age").fieldLabel("Minimum Age").dataType("NUMBER").operator(">=").requiredValue("15").mandatory(true).weight(20.0).logicalGroup("AND").conditionOrder(2).questionText("What is your age?").build());
                reqs.add(SchemeRequirement.builder().fieldName("age").fieldLabel("Maximum Age").dataType("NUMBER").operator("<=").requiredValue("35").mandatory(true).weight(20.0).logicalGroup("AND").conditionOrder(3).questionText("What is your age?").build());
                reqs.add(SchemeRequirement.builder().fieldName("income").fieldLabel("Annual Family Income").dataType("NUMBER").operator("<=").requiredValue("200000").mandatory(true).unit("₹").weight(30.0).logicalGroup("AND").conditionOrder(4).questionText("What is your family's annual income?").build());
            } else {
                reqs.add(SchemeRequirement.builder().fieldName("income").fieldLabel("Annual Income").dataType("NUMBER").operator("<=").requiredValue("250000").mandatory(true).unit("₹").weight(50.0).logicalGroup("AND").conditionOrder(1).questionText("What is your annual income?").build());
                reqs.add(SchemeRequirement.builder().fieldName("age").fieldLabel("Minimum Age").dataType("NUMBER").operator(">=").requiredValue("18").mandatory(true).weight(50.0).logicalGroup("AND").conditionOrder(2).questionText("What is your age?").build());
            }

            for (SchemeRequirement r : reqs) {
                r.setSchemeId(s.getId());
                requirementRepository.save(r);
            }
        }
    }

    @lombok.Value
    private static class DemoSchemePayload {
        Scheme scheme;
        List<SchemeRequirement> requirements;
        List<SchemeBenefit> benefits;
        List<SchemeDocument> documents;
        List<SchemeApplicationStep> steps;
        List<SchemeFAQ> faqs;
        List<SchemeSource> sources;
    }
}

