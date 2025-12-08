/**
 * Template Registry
 *
 * Central registry for all industry-specific resume templates
 */

import {
  IndustryTemplate,
  IndustryCategory,
} from '@/types/resume';
import {
  IndustryTemplateConfig,
  ATSBaseTemplate,
} from '@/types/template';

/**
 * Template Registry - All available templates
 */
export const TemplateRegistry: IndustryTemplateConfig[] = [
  // ============================================================================
  // GENERIC / ATS TEMPLATES
  // ============================================================================
  {
    id: 'generic-ats-simple',
    name: 'ATS Simple',
    industry: IndustryTemplate.GENERIC_ATS_SIMPLE,
    category: IndustryCategory.GENERIC,
    description: 'Maximum ATS compatibility with clean, simple design. Perfect for any industry.',
    atsScore: 98,
    features: ['Single column', 'Standard fonts', 'No graphics', 'Keyword optimized'],
    sectionOrder: ['personalInfo', 'summary', 'experience', 'education', 'skills', 'certifications'],
    requiredSections: ['personalInfo', 'experience', 'education', 'skills'],
    optionalSections: ['summary', 'certifications', 'projects', 'languages'],
    ...ATSBaseTemplate,
  },
  {
    id: 'generic-modern',
    name: 'Modern Professional',
    industry: IndustryTemplate.GENERIC_MODERN,
    category: IndustryCategory.GENERIC,
    description: 'Clean, modern design with subtle styling while maintaining ATS compatibility.',
    atsScore: 94,
    features: ['Professional design', 'ATS-friendly', 'Versatile'],
    sectionOrder: ['personalInfo', 'summary', 'experience', 'education', 'skills', 'projects'],
    requiredSections: ['personalInfo', 'experience', 'education'],
    optionalSections: ['summary', 'skills', 'projects', 'certifications', 'languages'],
    layout: {
      columns: 1,
      spacing: 'normal',
      headerStyle: 'centered',
      showIcons: true,
      showDividers: true,
    },
    fonts: ATSBaseTemplate.fonts!,
    colors: {
      primary: '#2563eb',
      text: '#1f2937',
      heading: '#111827',
      background: '#ffffff',
      accent: '#3b82f6',
      border: '#e5e7eb',
    },
  },
  {
    id: 'generic-classic',
    name: 'Classic Professional',
    industry: IndustryTemplate.GENERIC_CLASSIC,
    category: IndustryCategory.GENERIC,
    description: 'Traditional format trusted by recruiters for decades.',
    atsScore: 97,
    features: ['Traditional layout', 'Highly compatible', 'Professional'],
    sectionOrder: ['personalInfo', 'summary', 'experience', 'education', 'skills'],
    requiredSections: ['personalInfo', 'experience', 'education'],
    optionalSections: ['summary', 'skills', 'certifications'],
    layout: {
      columns: 1,
      spacing: 'spacious',
      headerStyle: 'centered',
      showIcons: false,
      showDividers: false,
    },
    fonts: {
      heading: 'Times New Roman',
      body: 'Times New Roman',
      size: {
        name: 20,
        heading: 14,
        subheading: 12,
        body: 11,
        small: 10,
      },
    },
    colors: ATSBaseTemplate.colors!,
  },

  // ============================================================================
  // HEALTHCARE TEMPLATES
  // ============================================================================
  {
    id: 'healthcare-doctor',
    name: 'Physician/Doctor',
    industry: IndustryTemplate.HEALTHCARE_DOCTOR,
    category: IndustryCategory.HEALTHCARE,
    description: 'Optimized for medical doctors with emphasis on credentials and clinical experience.',
    atsScore: 96,
    features: ['Credentials prominent', 'Clinical experience focus', 'Publications section'],
    sectionOrder: ['personalInfo', 'summary', 'licenses', 'certifications', 'experience', 'education', 'publications', 'skills'],
    requiredSections: ['personalInfo', 'licenses', 'experience', 'education'],
    optionalSections: ['summary', 'certifications', 'publications', 'skills', 'research'],
    customSections: [
      {
        label: 'Medical Licenses',
        key: 'licenses',
        type: 'licenses',
        required: true,
        description: 'State medical licenses and DEA registration',
      },
      {
        label: 'Board Certifications',
        key: 'boardCertifications',
        type: 'licenses',
        description: 'Board certifications and specializations',
      },
      {
        label: 'Publications & Research',
        key: 'publications',
        type: 'publications',
        description: 'Published papers, research, and presentations',
      },
    ],
    ...ATSBaseTemplate,
    sampleContent: {
      summary: 'Board-certified physician with [X] years of experience in [specialty]. Skilled in [key clinical areas].',
      skills: ['Clinical Diagnosis', 'Patient Care', 'EMR Systems', 'Medical Research'],
    },
  },
  {
    id: 'healthcare-nurse',
    name: 'Registered Nurse',
    industry: IndustryTemplate.HEALTHCARE_NURSE,
    category: IndustryCategory.HEALTHCARE,
    description: 'Designed for RNs, LPNs, and NPs with focus on certifications and patient care.',
    atsScore: 97,
    features: ['License & certification focus', 'Patient care metrics', 'Specialty areas'],
    sectionOrder: ['personalInfo', 'summary', 'licenses', 'certifications', 'experience', 'education', 'skills'],
    requiredSections: ['personalInfo', 'licenses', 'certifications', 'experience', 'education'],
    optionalSections: ['summary', 'skills'],
    customSections: [
      {
        label: 'Nursing Licenses',
        key: 'licenses',
        type: 'licenses',
        required: true,
        description: 'RN/LPN licenses, multistate compact',
      },
      {
        label: 'Clinical Certifications',
        key: 'certifications',
        type: 'licenses',
        description: 'BLS, ACLS, PALS, specialty certifications',
      },
    ],
    ...ATSBaseTemplate,
    sampleContent: {
      summary: 'Compassionate registered nurse with [X] years in [specialty]. BLS/ACLS certified.',
      skills: ['Patient Assessment', 'Medication Administration', 'EMR Documentation', 'Patient Education'],
    },
  },
  {
    id: 'healthcare-medical-assistant',
    name: 'Medical Assistant',
    industry: IndustryTemplate.HEALTHCARE_MEDICAL_ASSISTANT,
    category: IndustryCategory.HEALTHCARE,
    description: 'Perfect for medical assistants highlighting both clinical and administrative skills.',
    atsScore: 96,
    features: ['Clinical & administrative balance', 'Certification focus', 'Skills-forward'],
    sectionOrder: ['personalInfo', 'summary', 'skills', 'certifications', 'experience', 'education'],
    requiredSections: ['personalInfo', 'certifications', 'experience', 'education'],
    optionalSections: ['summary', 'skills'],
    ...ATSBaseTemplate,
    sampleContent: {
      summary: 'Certified medical assistant with expertise in both clinical and administrative healthcare operations.',
      skills: ['Vital Signs', 'Phlebotomy', 'EKG', 'Medical Billing', 'EMR Systems', 'Patient Scheduling'],
    },
  },

  // ============================================================================
  // TECHNOLOGY TEMPLATES
  // ============================================================================
  {
    id: 'tech-software-engineer',
    name: 'Software Engineer',
    industry: IndustryTemplate.TECH_SOFTWARE_ENGINEER,
    category: IndustryCategory.TECHNOLOGY,
    description: 'Comprehensive template for software engineers with technical skills and projects showcase.',
    atsScore: 93,
    features: ['Technical skills matrix', 'Projects section', 'GitHub integration'],
    sectionOrder: ['personalInfo', 'summary', 'skills', 'experience', 'projects', 'education', 'certifications'],
    requiredSections: ['personalInfo', 'skills', 'experience', 'education'],
    optionalSections: ['summary', 'projects', 'certifications'],
    customSections: [
      {
        label: 'Technical Projects',
        key: 'projects',
        type: 'projects',
        description: 'Open source contributions and personal projects',
      },
    ],
    ...ATSBaseTemplate,
    colors: {
      primary: '#0f172a',
      text: '#1e293b',
      heading: '#0f172a',
      background: '#ffffff',
      accent: '#3b82f6',
      border: '#cbd5e1',
    },
    sampleContent: {
      summary: 'Software engineer with [X] years of experience building scalable applications using [technologies].',
      skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'SQL', 'Git', 'Docker'],
    },
  },
  {
    id: 'tech-frontend-developer',
    name: 'Frontend Developer',
    industry: IndustryTemplate.TECH_FRONTEND_DEVELOPER,
    category: IndustryCategory.TECHNOLOGY,
    description: 'Focused on frontend frameworks, UI/UX, and responsive design skills.',
    atsScore: 92,
    features: ['Frontend frameworks', 'Portfolio links', 'UI/UX focus'],
    sectionOrder: ['personalInfo', 'summary', 'skills', 'experience', 'projects', 'education'],
    requiredSections: ['personalInfo', 'skills', 'experience', 'education'],
    optionalSections: ['summary', 'projects', 'certifications'],
    ...ATSBaseTemplate,
    sampleContent: {
      summary: 'Frontend developer specializing in modern web applications with React, Vue, or Angular.',
      skills: ['React', 'Vue.js', 'TypeScript', 'HTML5', 'CSS3', 'Tailwind', 'Webpack', 'REST APIs'],
    },
  },
  {
    id: 'tech-backend-developer',
    name: 'Backend Developer',
    industry: IndustryTemplate.TECH_BACKEND_DEVELOPER,
    category: IndustryCategory.TECHNOLOGY,
    description: 'Emphasizes APIs, databases, and system architecture expertise.',
    atsScore: 93,
    features: ['API development', 'Database expertise', 'System design'],
    sectionOrder: ['personalInfo', 'summary', 'skills', 'experience', 'projects', 'education'],
    requiredSections: ['personalInfo', 'skills', 'experience', 'education'],
    optionalSections: ['summary', 'projects', 'certifications'],
    ...ATSBaseTemplate,
    sampleContent: {
      summary: 'Backend developer experienced in building robust APIs and distributed systems.',
      skills: ['Node.js', 'Python', 'Java', 'PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes', 'AWS'],
    },
  },
  {
    id: 'tech-fullstack',
    name: 'Full Stack Developer',
    industry: IndustryTemplate.TECH_FULLSTACK,
    category: IndustryCategory.TECHNOLOGY,
    description: 'Balanced template showcasing both frontend and backend capabilities.',
    atsScore: 93,
    features: ['Full stack expertise', 'End-to-end projects', 'Versatile skills'],
    sectionOrder: ['personalInfo', 'summary', 'skills', 'experience', 'projects', 'education'],
    requiredSections: ['personalInfo', 'skills', 'experience', 'education'],
    optionalSections: ['summary', 'projects', 'certifications'],
    ...ATSBaseTemplate,
    sampleContent: {
      summary: 'Full stack developer with expertise in modern web technologies and end-to-end application development.',
      skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Docker', 'AWS', 'CI/CD', 'Agile'],
    },
  },
  {
    id: 'tech-ml-ai-engineer',
    name: 'ML/AI Engineer',
    industry: IndustryTemplate.TECH_ML_AI_ENGINEER,
    category: IndustryCategory.TECHNOLOGY,
    description: 'Optimized for machine learning and AI roles with research and publications.',
    atsScore: 92,
    features: ['Research focus', 'Publications', 'Model development'],
    sectionOrder: ['personalInfo', 'summary', 'skills', 'experience', 'projects', 'publications', 'education'],
    requiredSections: ['personalInfo', 'skills', 'experience', 'education'],
    optionalSections: ['summary', 'projects', 'publications', 'certifications'],
    customSections: [
      {
        label: 'Research & Publications',
        key: 'publications',
        type: 'publications',
        description: 'Published papers, conference presentations, and research projects',
      },
    ],
    ...ATSBaseTemplate,
    sampleContent: {
      summary: 'ML engineer specializing in deep learning and natural language processing with [X] years of experience.',
      skills: ['Python', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'NLP', 'Computer Vision', 'AWS SageMaker'],
    },
  },
  {
    id: 'tech-data-scientist',
    name: 'Data Scientist',
    industry: IndustryTemplate.TECH_DATA_SCIENTIST,
    category: IndustryCategory.TECHNOLOGY,
    description: 'Statistical analysis, data visualization, and machine learning focus.',
    atsScore: 93,
    features: ['Statistical analysis', 'Data visualization', 'ML models'],
    sectionOrder: ['personalInfo', 'summary', 'skills', 'experience', 'projects', 'education', 'certifications'],
    requiredSections: ['personalInfo', 'skills', 'experience', 'education'],
    optionalSections: ['summary', 'projects', 'certifications'],
    ...ATSBaseTemplate,
    sampleContent: {
      summary: 'Data scientist with expertise in statistical modeling, machine learning, and data visualization.',
      skills: ['Python', 'R', 'SQL', 'Pandas', 'NumPy', 'Scikit-learn', 'Tableau', 'Power BI', 'A/B Testing'],
    },
  },
  {
    id: 'tech-devops',
    name: 'DevOps Engineer',
    industry: IndustryTemplate.TECH_DEVOPS,
    category: IndustryCategory.TECHNOLOGY,
    description: 'Infrastructure, CI/CD, and cloud platform expertise.',
    atsScore: 94,
    features: ['Cloud platforms', 'CI/CD pipelines', 'Infrastructure as code'],
    sectionOrder: ['personalInfo', 'summary', 'skills', 'experience', 'certifications', 'education'],
    requiredSections: ['personalInfo', 'skills', 'experience', 'education'],
    optionalSections: ['summary', 'certifications', 'projects'],
    ...ATSBaseTemplate,
    sampleContent: {
      summary: 'DevOps engineer experienced in building scalable infrastructure and automating deployment pipelines.',
      skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'Jenkins', 'GitLab CI', 'Python', 'Bash'],
    },
  },

  // ============================================================================
  // ENGINEERING TEMPLATES
  // ============================================================================
  {
    id: 'engineering-civil',
    name: 'Civil Engineer',
    industry: IndustryTemplate.ENGINEERING_CIVIL,
    category: IndustryCategory.ENGINEERING,
    description: 'PE license, project management, and CAD software expertise.',
    atsScore: 94,
    features: ['PE license prominent', 'Project portfolio', 'CAD software'],
    sectionOrder: ['personalInfo', 'summary', 'licenses', 'skills', 'experience', 'projects', 'education', 'certifications'],
    requiredSections: ['personalInfo', 'experience', 'education'],
    optionalSections: ['summary', 'licenses', 'skills', 'projects', 'certifications'],
    customSections: [
      {
        label: 'Professional Engineering License',
        key: 'licenses',
        type: 'licenses',
        description: 'PE license, state registrations',
      },
    ],
    ...ATSBaseTemplate,
    sampleContent: {
      summary: 'Licensed professional engineer with [X] years of experience in infrastructure design and project management.',
      skills: ['AutoCAD', 'Civil 3D', 'Structural Design', 'Project Management', 'LEED', 'Revit'],
    },
  },
  {
    id: 'engineering-mechanical',
    name: 'Mechanical Engineer',
    industry: IndustryTemplate.ENGINEERING_MECHANICAL,
    category: IndustryCategory.ENGINEERING,
    description: 'CAD, FEA, and manufacturing expertise for mechanical engineers.',
    atsScore: 94,
    features: ['CAD/FEA tools', 'Manufacturing focus', 'Design projects'],
    sectionOrder: ['personalInfo', 'summary', 'skills', 'experience', 'projects', 'education', 'certifications'],
    requiredSections: ['personalInfo', 'skills', 'experience', 'education'],
    optionalSections: ['summary', 'projects', 'certifications'],
    ...ATSBaseTemplate,
    sampleContent: {
      summary: 'Mechanical engineer with expertise in product design, prototyping, and manufacturing processes.',
      skills: ['SolidWorks', 'AutoCAD', 'ANSYS', 'MATLAB', 'CAM', 'GD&T', 'Lean Manufacturing'],
    },
  },
  {
    id: 'engineering-electrical',
    name: 'Electrical Engineer',
    industry: IndustryTemplate.ENGINEERING_ELECTRICAL,
    category: IndustryCategory.ENGINEERING,
    description: 'Circuit design, power systems, and testing focus.',
    atsScore: 93,
    features: ['Circuit design', 'Power systems', 'Testing/validation'],
    sectionOrder: ['personalInfo', 'summary', 'skills', 'experience', 'projects', 'education', 'certifications'],
    requiredSections: ['personalInfo', 'skills', 'experience', 'education'],
    optionalSections: ['summary', 'projects', 'certifications'],
    ...ATSBaseTemplate,
    sampleContent: {
      summary: 'Electrical engineer specializing in circuit design, embedded systems, and power distribution.',
      skills: ['Circuit Design', 'PCB Layout', 'SPICE', 'MATLAB', 'PLC Programming', 'Oscilloscopes', 'Multimeters'],
    },
  },

  // ============================================================================
  // DESIGN TEMPLATES
  // ============================================================================
  {
    id: 'design-ui-ux',
    name: 'UI/UX Designer',
    industry: IndustryTemplate.DESIGN_UI_UX,
    category: IndustryCategory.DESIGN,
    description: 'Portfolio-focused template for UI/UX designers (ATS-compatible version).',
    atsScore: 88,
    features: ['Portfolio link prominent', 'Design tools', 'User research'],
    sectionOrder: ['personalInfo', 'summary', 'portfolio', 'skills', 'experience', 'education'],
    requiredSections: ['personalInfo', 'portfolio', 'experience', 'education'],
    optionalSections: ['summary', 'skills', 'certifications'],
    customSections: [
      {
        label: 'Portfolio',
        key: 'portfolio',
        type: 'portfolio',
        required: true,
        description: 'Link to design portfolio (Behance, Dribbble, personal site)',
      },
    ],
    ...ATSBaseTemplate,
    sampleContent: {
      summary: 'UI/UX designer with [X] years creating intuitive digital experiences for web and mobile.',
      skills: ['Figma', 'Sketch', 'Adobe XD', 'Prototyping', 'User Research', 'Wireframing', 'Design Systems'],
    },
  },
  {
    id: 'design-graphic',
    name: 'Graphic Designer',
    industry: IndustryTemplate.DESIGN_GRAPHIC,
    category: IndustryCategory.DESIGN,
    description: 'Showcases creative projects while maintaining ATS readability.',
    atsScore: 87,
    features: ['Portfolio links', 'Adobe Creative Suite', 'Brand design'],
    sectionOrder: ['personalInfo', 'summary', 'portfolio', 'skills', 'experience', 'education'],
    requiredSections: ['personalInfo', 'portfolio', 'experience', 'education'],
    optionalSections: ['summary', 'skills', 'certifications'],
    customSections: [
      {
        label: 'Portfolio',
        key: 'portfolio',
        type: 'portfolio',
        required: true,
        description: 'Link to design portfolio',
      },
    ],
    ...ATSBaseTemplate,
    sampleContent: {
      summary: 'Creative graphic designer specializing in branding, print, and digital design.',
      skills: ['Adobe Photoshop', 'Illustrator', 'InDesign', 'Branding', 'Typography', 'Print Design'],
    },
  },

  // ============================================================================
  // BUSINESS TEMPLATES
  // ============================================================================
  {
    id: 'business-mba',
    name: 'MBA Graduate',
    industry: IndustryTemplate.BUSINESS_MBA,
    category: IndustryCategory.BUSINESS,
    description: 'Emphasizes education, leadership, and quantified achievements.',
    atsScore: 95,
    features: ['Education prominent', 'Leadership focus', 'Quantified results'],
    sectionOrder: ['personalInfo', 'summary', 'education', 'experience', 'skills', 'certifications'],
    requiredSections: ['personalInfo', 'education', 'experience'],
    optionalSections: ['summary', 'skills', 'certifications', 'projects'],
    ...ATSBaseTemplate,
    sampleContent: {
      summary: 'MBA graduate with focus on [concentration] and proven track record in [key area].',
      skills: ['Strategic Planning', 'Financial Analysis', 'Project Management', 'Leadership', 'Data Analysis'],
    },
  },
  {
    id: 'business-analyst',
    name: 'Business Analyst',
    industry: IndustryTemplate.BUSINESS_ANALYST,
    category: IndustryCategory.BUSINESS,
    description: 'Data analysis, SQL, and process improvement focus.',
    atsScore: 94,
    features: ['Data analysis tools', 'Process improvement', 'Technical skills'],
    sectionOrder: ['personalInfo', 'summary', 'skills', 'experience', 'education', 'certifications'],
    requiredSections: ['personalInfo', 'skills', 'experience', 'education'],
    optionalSections: ['summary', 'certifications', 'projects'],
    ...ATSBaseTemplate,
    sampleContent: {
      summary: 'Business analyst with expertise in data analysis, process optimization, and stakeholder management.',
      skills: ['SQL', 'Excel', 'Tableau', 'Power BI', 'Requirements Gathering', 'Process Mapping', 'Agile'],
    },
  },
  {
    id: 'business-consultant',
    name: 'Business Consultant',
    industry: IndustryTemplate.BUSINESS_CONSULTANT,
    category: IndustryCategory.BUSINESS,
    description: 'Strategy, problem-solving, and client management emphasis.',
    atsScore: 94,
    features: ['Strategy focus', 'Client projects', 'Impact metrics'],
    sectionOrder: ['personalInfo', 'summary', 'experience', 'education', 'skills', 'certifications'],
    requiredSections: ['personalInfo', 'experience', 'education'],
    optionalSections: ['summary', 'skills', 'certifications'],
    ...ATSBaseTemplate,
    sampleContent: {
      summary: 'Management consultant with experience delivering strategic solutions for Fortune 500 clients.',
      skills: ['Strategy Development', 'Financial Modeling', 'Change Management', 'Stakeholder Management'],
    },
  },
];

/**
 * Get template by ID
 */
export function getTemplateById(id: string): IndustryTemplateConfig | undefined {
  return TemplateRegistry.find(template => template.id === id);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: IndustryCategory): IndustryTemplateConfig[] {
  return TemplateRegistry.filter(template => template.category === category);
}

/**
 * Get all template categories with counts
 */
export function getTemplateCategories(): Array<{ category: IndustryCategory; count: number; templates: IndustryTemplateConfig[] }> {
  const categories = Object.values(IndustryCategory);
  return categories.map(category => ({
    category,
    count: TemplateRegistry.filter(t => t.category === category).length,
    templates: getTemplatesByCategory(category),
  }));
}

/**
 * Search templates
 */
export function searchTemplates(query: string): IndustryTemplateConfig[] {
  const lowerQuery = query.toLowerCase();
  return TemplateRegistry.filter(
    template =>
      template.name.toLowerCase().includes(lowerQuery) ||
      template.description.toLowerCase().includes(lowerQuery) ||
      template.category.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get templates by minimum ATS score
 */
export function getTemplatesByATSScore(minScore: number): IndustryTemplateConfig[] {
  return TemplateRegistry.filter(template => template.atsScore >= minScore).sort(
    (a, b) => b.atsScore - a.atsScore
  );
}
