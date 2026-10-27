export interface DataWalletFieldDefinition {
  key: string;
  label: string;
  type: 'number' | 'select' | 'boolean' | 'text';
  category: 'Personal' | 'Socio-Economic' | 'Education & Work' | 'Agriculture' | 'Disability & Housing';
  options?: string[];
  description: string;
}

export const CENTRALIZED_FIELD_REGISTRY: DataWalletFieldDefinition[] = [
  {
    key: 'age',
    label: 'Citizen Age',
    type: 'number',
    category: 'Personal',
    description: 'Calculated or recorded age of the applicant in years.',
  },
  {
    key: 'gender',
    label: 'Gender',
    type: 'select',
    category: 'Personal',
    options: ['Female', 'Male', 'Transgender', 'All'],
    description: 'Gender identity of the citizen.',
  },
  {
    key: 'state',
    label: 'State of Residence',
    type: 'select',
    category: 'Personal',
    options: [
      'All India',
      'Tamil Nadu',
      'Kerala',
      'Karnataka',
      'Maharashtra',
      'Delhi',
      'Uttar Pradesh',
      'West Bengal',
      'Gujarat',
      'Rajasthan',
      'Telangana',
      'Andhra Pradesh',
      'Punjab',
    ],
    description: 'State where citizen currently resides.',
  },
  {
    key: 'district',
    label: 'District',
    type: 'text',
    category: 'Personal',
    description: 'District location of the citizen.',
  },
  {
    key: 'urbanRural',
    label: 'Location Type (Urban / Rural)',
    type: 'select',
    category: 'Personal',
    options: ['Rural', 'Urban', 'Semi-Urban'],
    description: 'Locality type of applicant residence.',
  },
  {
    key: 'income',
    label: 'Annual Family Income (₹)',
    type: 'number',
    category: 'Socio-Economic',
    description: 'Total annual gross income of the citizen or household.',
  },
  {
    key: 'familySize',
    label: 'Family Members Count',
    type: 'number',
    category: 'Socio-Economic',
    description: 'Total number of family members in household.',
  },
  {
    key: 'maritalStatus',
    label: 'Marital Status',
    type: 'select',
    category: 'Socio-Economic',
    options: ['Single', 'Married', 'Widowed', 'Divorced', 'Separated'],
    description: 'Marital status of the citizen.',
  },
  {
    key: 'education',
    label: 'Education Level',
    type: 'select',
    category: 'Education & Work',
    options: [
      'Primary',
      'Secondary (10th)',
      'Higher Secondary (12th)',
      'Diploma',
      'Undergraduate',
      'Postgraduate',
      'Doctorate (PhD)',
      'Uneducated',
    ],
    description: 'Highest completed level of formal education.',
  },
  {
    key: 'studentStatus',
    label: 'Current Student Status',
    type: 'boolean',
    category: 'Education & Work',
    description: 'Whether the applicant is currently enrolled in a school, college, or university.',
  },
  {
    key: 'employmentStatus',
    label: 'Employment Status',
    type: 'select',
    category: 'Education & Work',
    options: [
      'Unemployed',
      'Salaried Private',
      'Government Employee',
      'Self-Employed',
      'Business Owner',
      'Daily Wage Worker',
      'Job Seeker',
    ],
    description: 'Current primary work or employment situation.',
  },
  {
    key: 'occupation',
    label: 'Occupation / Trade',
    type: 'text',
    category: 'Education & Work',
    description: 'Specific profession, trade, or occupation.',
  },
  {
    key: 'farmerStatus',
    label: 'Farmer Status',
    type: 'boolean',
    category: 'Agriculture',
    description: 'Whether the applicant or household engages in agricultural farming.',
  },
  {
    key: 'landOwnership',
    label: 'Agricultural Land Ownership',
    type: 'boolean',
    category: 'Agriculture',
    description: 'Whether applicant owns agricultural land.',
  },
  {
    key: 'landArea',
    label: 'Land Area (Acres)',
    type: 'number',
    category: 'Agriculture',
    description: 'Total agricultural land holding in acres.',
  },
  {
    key: 'disabilityStatus',
    label: 'Disability Status',
    type: 'boolean',
    category: 'Disability & Housing',
    description: 'Whether applicant has a recognized benchmark disability.',
  },
  {
    key: 'disabilityPercentage',
    label: 'Disability Percentage (%)',
    type: 'number',
    category: 'Disability & Housing',
    description: 'Certified percentage of disability.',
  },
  {
    key: 'housingStatus',
    label: 'Housing Condition',
    type: 'select',
    category: 'Disability & Housing',
    options: ['Owned (Pucca)', 'Kutcha / Dilapidated', 'Homeless', 'Rented', 'Temporary Shelter'],
    description: 'Type of housing currently occupied by household.',
  },
  {
    key: 'existingBenefits',
    label: 'Existing Government Benefits',
    type: 'text',
    category: 'Socio-Economic',
    description: 'Other government assistance currently being received.',
  },
];

export function getFieldDefinition(key: string): DataWalletFieldDefinition | undefined {
  return CENTRALIZED_FIELD_REGISTRY.find(
    (f) => f.key.toLowerCase() === key.toLowerCase()
  );
}
