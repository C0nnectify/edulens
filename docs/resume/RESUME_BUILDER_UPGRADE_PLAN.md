# Resume Builder Upgrade Plan

## Executive Summary
This document outlines a comprehensive plan to upgrade the EduLen resume builder with multi-resume support, industry-specific templates, import/export capabilities, and ATS-friendly designs inspired by Reactive-Resume architecture.

---

## Research Findings

### Current Implementation Analysis

**Location**: `/src/components/dashboard/resume/EnhancedResumeBuilderV2.tsx`

**Current Features**:
- Step-by-step resume creation flow
- Real-time preview
- Auto-save functionality
- Single resume editing
- Basic template support (enum-based)

**Current Limitations**:
1. No multi-resume management
2. No import functionality (LinkedIn, PDF, DOCX, JSON)
3. Template switching is not fully implemented
4. No industry-specific templates
5. Limited ATS optimization features
6. No resume duplication/cloning
7. Missing export to multiple formats

### Reactive-Resume Architecture Insights

**Key Learnings**:

1. **Parser System** (`libs/parser/`):
   - LinkedIn CSV import support
   - JSON-Resume format support
   - Reactive-Resume v3 migration
   - Modular parser interface for extensibility

2. **Schema Design** (`libs/schema/`):
   - Zod-based validation
   - Comprehensive section types
   - Flexible custom sections
   - URL handling for links

3. **Template System** (`apps/artboard/src/templates/`):
   - Component-based templates (Ditto, Pikachu, Kakuna, etc.)
   - Section mapping system
   - Flexible layout with columns
   - Reusable section components

4. **Template Props**:
   ```typescript
   type TemplateProps = {
     columns: SectionKey[][];
     isFirstPage?: boolean;
   };
   ```

### ATS-Friendly Design Best Practices (2025)

**Format Requirements**:
1. Reverse chronological layout
2. Standard file types: .docx, .pdf, .txt
3. Simple, clean design - NO graphics, tables, text boxes
4. Classic fonts: Arial, Helvetica, Times New Roman
5. 1-inch margins
6. Standard section headings
7. Single column layout preferred (2-column can fail ATS)
8. 99.7% of recruiters use keyword filters

**Industry-Specific Optimizations**:
- **Healthcare**: Clinical experience, licenses, certifications prominent
- **Engineering**: Technical skills matrix, project portfolio
- **Technology**: GitHub/LinkedIn links, tech stack showcase
- **Design**: Portfolio links (minimal graphics for ATS)

---

## Proposed Architecture

### 1. Multi-Resume Support

#### Database Schema Enhancement
```typescript
// Enhanced Resume with metadata
interface Resume {
  id: string;
  userId: string;
  title: string;
  industryTarget?: IndustryType; // NEW
  createdAt: Date;
  updatedAt: Date;
  template: string;
  personalInfo: PersonalInfo;
  sections: ResumeSections;
  metadata: {
    version: number;
    isPublic: boolean;
    isFavorite: boolean;
    tags: string[];
    targetRole?: string;
    targetIndustry?: string[];
    lastAnalyzed?: Date;
    atsScore?: number;
  };
}
```

#### Resume Management Features
1. **Resume List View** - Grid/list of all user resumes
2. **Quick Actions**:
   - Create new (from scratch/template)
   - Duplicate existing
   - Delete with confirmation
   - Star/favorite
   - Tag management
3. **Filtering & Sorting**:
   - By date, ATS score, industry
   - Search by title/tags

#### API Routes
```
POST   /api/resume/create        - Create new resume
GET    /api/resume/list          - Get user's resumes
GET    /api/resume/:id           - Get specific resume
PUT    /api/resume/:id           - Update resume
DELETE /api/resume/:id           - Delete resume
POST   /api/resume/:id/duplicate - Clone resume
POST   /api/resume/import        - Import from file
GET    /api/resume/:id/export    - Export to format
```

---

### 2. Industry-Specific Template System

#### Template Categories

```typescript
enum IndustryType {
  // Healthcare
  HEALTHCARE_DOCTOR = 'healthcare-doctor',
  HEALTHCARE_NURSE = 'healthcare-nurse',
  HEALTHCARE_MEDICAL_ASSISTANT = 'healthcare-medical-assistant',

  // Engineering
  ENGINEERING_CIVIL = 'engineering-civil',
  ENGINEERING_MECHANICAL = 'engineering-mechanical',
  ENGINEERING_ELECTRICAL = 'engineering-electrical',

  // Technology
  TECH_SOFTWARE_ENGINEER = 'tech-software-engineer',
  TECH_FRONTEND_DEVELOPER = 'tech-frontend-developer',
  TECH_BACKEND_DEVELOPER = 'tech-backend-developer',
  TECH_FULLSTACK = 'tech-fullstack',
  TECH_ML_AI_ENGINEER = 'tech-ml-ai-engineer',
  TECH_DATA_SCIENTIST = 'tech-data-scientist',
  TECH_DEVOPS = 'tech-devops',

  // Design
  DESIGN_UI_UX = 'design-ui-ux',
  DESIGN_GRAPHIC = 'design-graphic',
  DESIGN_PRODUCT = 'design-product',

  // Business
  BUSINESS_MBA = 'business-mba',
  BUSINESS_ANALYST = 'business-analyst',
  BUSINESS_CONSULTANT = 'business-consultant',

  // Education
  EDUCATION_ARTS = 'education-arts',
  EDUCATION_SCIENCES = 'education-sciences',

  // Generic/ATS
  GENERIC_ATS_SIMPLE = 'generic-ats-simple',
  GENERIC_MODERN = 'generic-modern',
  GENERIC_CLASSIC = 'generic-classic',
}
```

#### Template Configuration

```typescript
interface IndustryTemplate {
  id: string;
  name: string;
  industry: IndustryType;
  description: string;
  preview: string; // Preview image URL
  atsScore: number; // Pre-calculated ATS compatibility

  // Section configuration
  sectionOrder: string[];
  requiredSections: string[];
  optionalSections: string[];

  // Visual configuration
  layout: {
    columns: 1 | 2; // Most should be 1 for ATS
    headerStyle: 'centered' | 'left' | 'split';
    spacing: 'compact' | 'normal' | 'spacious';
  };

  // Typography
  fonts: {
    heading: string; // Arial, Helvetica, Times New Roman
    body: string;
    sizes: {
      name: number;
      heading: number;
      subheading: number;
      body: number;
    };
  };

  // Colors (minimal for ATS)
  colors: {
    primary: string;
    text: string;
    heading: string;
    accent?: string; // Optional, minimal use
  };

  // Industry-specific sections
  customSections?: {
    label: string;
    key: string;
    type: 'licenses' | 'publications' | 'portfolio' | 'research';
  }[];

  // Sample content for guidance
  sampleContent?: {
    summary?: string;
    experience?: string[];
    skills?: string[];
  };
}
```

#### Template Library Structure

```
/src/templates/
  ├── healthcare/
  │   ├── doctor.tsx
  │   ├── nurse.tsx
  │   └── medical-assistant.tsx
  ├── engineering/
  │   ├── civil.tsx
  │   ├── mechanical.tsx
  │   └── electrical.tsx
  ├── technology/
  │   ├── software-engineer.tsx
  │   ├── frontend-developer.tsx
  │   ├── backend-developer.tsx
  │   ├── fullstack.tsx
  │   ├── ml-ai-engineer.tsx
  │   └── data-scientist.tsx
  ├── design/
  │   ├── ui-ux.tsx
  │   └── graphic.tsx
  ├── business/
  │   ├── mba.tsx
  │   └── analyst.tsx
  ├── generic/
  │   ├── ats-simple.tsx (MOST ATS-FRIENDLY)
  │   ├── modern.tsx
  │   └── classic.tsx
  └── template-registry.ts
```

#### ATS-Optimized Base Template

All templates will inherit from an ATS-optimized base:

```typescript
// Base ATS-Friendly Template
const ATSBaseTemplate = {
  layout: {
    columns: 1, // Single column for maximum compatibility
    margins: { top: 25.4, right: 25.4, bottom: 25.4, left: 25.4, unit: 'mm' }, // 1 inch
    spacing: 'normal',
  },
  fonts: {
    heading: 'Arial',
    body: 'Arial',
    sizes: { name: 16, heading: 14, subheading: 12, body: 11 },
  },
  colors: {
    primary: '#000000',
    text: '#000000',
    heading: '#000000',
    accent: '#333333', // Minimal use
  },
  formatting: {
    useBulletPoints: true,
    useStandardHeadings: true,
    avoidGraphics: true,
    avoidTables: true,
    avoidTextBoxes: true,
  },
};
```

---

### 3. Import/Export System

#### Import Sources

##### 1. LinkedIn Import
```typescript
// Leveraging Reactive-Resume parser
import { LinkedInParser } from '@/lib/parsers/linkedin';

interface LinkedInImportService {
  parseZip(file: File): Promise<Resume>;
  extractProfile(data: LinkedInData): PersonalInfo;
  extractExperience(data: LinkedInData): Experience[];
  extractEducation(data: LinkedInData): Education[];
  extractSkills(data: LinkedInData): Skill[];
  extractCertifications(data: LinkedInData): Certification[];
}
```

##### 2. JSON Resume Import
```typescript
interface JSONResumeImportService {
  validate(json: unknown): boolean;
  parse(json: JSONResume): Resume;
  mapToInternalSchema(json: JSONResume): Resume;
}
```

##### 3. PDF Import (using AI)
```typescript
interface PDFImportService {
  extractText(file: File): Promise<string>;
  parseWithAI(text: string): Promise<Resume>;
  // Uses GPT/Claude to structure unstructured PDF data
}
```

##### 4. DOCX Import
```typescript
interface DOCXImportService {
  extractStructuredData(file: File): Promise<Resume>;
  parseHeadings(doc: Document): SectionMap;
  extractBulletPoints(doc: Document): string[];
}
```

#### Export Formats

##### 1. PDF Export (Primary)
```typescript
interface PDFExportOptions {
  template: string;
  colorMode: 'color' | 'bw'; // Black & white for ATS
  pageSize: 'A4' | 'Letter';
  margins: PageMargins;
  includePhoto: boolean; // Default false for ATS
}

// Using React-PDF or Puppeteer
async function exportToPDF(resume: Resume, options: PDFExportOptions): Promise<Blob>
```

##### 2. DOCX Export
```typescript
// Using docx library
async function exportToDOCX(resume: Resume, template: string): Promise<Blob>
```

##### 3. JSON Export
```typescript
// Full data export for backup/transfer
async function exportToJSON(resume: Resume): Promise<Blob>
```

##### 4. TXT Export (Ultra ATS-Safe)
```typescript
// Plain text version for maximum compatibility
async function exportToTXT(resume: Resume): Promise<string>
```

#### Import/Export UI Components

```typescript
// Import Dialog
<ImportResumeDialog>
  - Drag & drop zone
  - File type selection (LinkedIn ZIP, JSON, PDF, DOCX)
  - Progress indicator
  - Preview before import
  - Template selection for imported data
</ImportResumeDialog>

// Export Dialog
<ExportResumeDialog>
  - Format selection (PDF, DOCX, JSON, TXT)
  - Template preview
  - Export options (color, margins, etc.)
  - ATS compatibility score display
  - Download button
</ExportResumeDialog>
```

---

### 4. Enhanced Template Switcher

#### Template Selection UI

```typescript
<TemplateSelector>
  - Industry category tabs
  - Template grid with previews
  - ATS score badge on each template
  - "Switch Template" with data preservation
  - Live preview of current resume in new template
</TemplateSelector>
```

#### Template Switching Logic

```typescript
interface TemplateSwitcher {
  switchTemplate(resumeId: string, newTemplateId: string): Promise<Resume>;
  preserveData(currentResume: Resume, newTemplate: Template): Resume;
  mapSections(currentSections: Sections, newTemplate: Template): Sections;
  handleMissingSections(sections: string[], template: Template): void;
}

// Key: Preserve all data, only change visual presentation
async function switchTemplate(resume: Resume, newTemplate: IndustryTemplate): Promise<Resume> {
  return {
    ...resume,
    template: newTemplate.id,
    // Reorder sections based on new template
    metadata: {
      ...resume.metadata,
      sectionOrder: newTemplate.sectionOrder,
    },
    updatedAt: new Date(),
  };
}
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Database schema updates
- [ ] Multi-resume API endpoints
- [ ] Resume list/management UI
- [ ] Resume duplication feature

### Phase 2: Import System (Week 3-4)
- [ ] LinkedIn import parser
- [ ] JSON Resume import
- [ ] PDF import (AI-powered)
- [ ] DOCX import
- [ ] Import UI components

### Phase 3: Template System (Week 5-7)
- [ ] ATS base template
- [ ] Healthcare templates (3)
- [ ] Technology templates (7)
- [ ] Engineering templates (3)
- [ ] Design templates (2)
- [ ] Business templates (3)
- [ ] Generic templates (3)
- [ ] Template registry & metadata

### Phase 4: Export System (Week 8-9)
- [ ] PDF export with multiple templates
- [ ] DOCX export
- [ ] JSON export
- [ ] TXT export
- [ ] Export UI & options

### Phase 5: Template Switching (Week 10)
- [ ] Template switcher UI
- [ ] Data preservation logic
- [ ] Live preview during switch
- [ ] Template recommendation engine

### Phase 6: Polish & Testing (Week 11-12)
- [ ] ATS compliance testing
- [ ] User testing with real resumes
- [ ] Performance optimization
- [ ] Documentation
- [ ] Bug fixes

---

## Technical Implementation Details

### File Structure

```
src/
├── app/
│   └── api/
│       └── resume/
│           ├── create/route.ts
│           ├── list/route.ts
│           ├── [id]/route.ts
│           ├── [id]/duplicate/route.ts
│           ├── import/route.ts
│           └── [id]/export/route.ts
├── components/
│   └── dashboard/
│       └── resume/
│           ├── ResumeListView.tsx          # NEW
│           ├── ResumeCard.tsx              # NEW
│           ├── TemplateSelector.tsx        # ENHANCED
│           ├── ImportDialog.tsx            # NEW
│           ├── ExportDialog.tsx            # NEW
│           ├── TemplateSwitcher.tsx        # NEW
│           └── EnhancedResumeBuilderV2.tsx # ENHANCED
├── lib/
│   ├── parsers/
│   │   ├── linkedin.ts                     # NEW
│   │   ├── json-resume.ts                  # NEW
│   │   ├── pdf.ts                          # NEW
│   │   └── docx.ts                         # NEW
│   ├── exporters/
│   │   ├── pdf.ts                          # NEW
│   │   ├── docx.ts                         # NEW
│   │   ├── json.ts                         # NEW
│   │   └── txt.ts                          # NEW
│   └── templates/
│       ├── registry.ts                     # NEW
│       └── base-ats.ts                     # NEW
├── templates/
│   ├── healthcare/...                      # NEW
│   ├── technology/...                      # NEW
│   ├── engineering/...                     # NEW
│   ├── design/...                          # NEW
│   ├── business/...                        # NEW
│   └── generic/...                         # NEW
└── types/
    ├── resume.ts                           # ENHANCED
    └── template.ts                         # NEW
```

### Key Dependencies

```json
{
  "dependencies": {
    "@react-pdf/renderer": "^3.x",      // PDF generation
    "docx": "^8.x",                     // DOCX export
    "mammoth": "^1.x",                  // DOCX import
    "pdf-parse": "^1.x",                // PDF parsing
    "jszip": "^3.x",                    // LinkedIn ZIP handling
    "zod": "^3.x",                      // Schema validation
    "papaparse": "^5.x"                 // CSV parsing for LinkedIn
  }
}
```

---

## Industry Template Specifications

### Technology Templates

#### 1. Software Engineer (Generic)
- **ATS Score**: 95/100
- **Layout**: Single column
- **Key Sections**: Technical Skills, Experience, Projects, Education
- **Special Features**: GitHub link prominence, tech stack highlighting

#### 2. Frontend Developer
- **ATS Score**: 93/100
- **Layout**: Single column
- **Key Sections**: Technical Skills (React, Vue, etc.), Portfolio, Experience
- **Special Features**: Live project links, framework expertise

#### 3. Backend Developer
- **ATS Score**: 94/100
- **Key Sections**: Technical Skills (APIs, databases), System Architecture, Experience
- **Special Features**: API development, database expertise

#### 4. ML/AI Engineer
- **ATS Score**: 92/100
- **Key Sections**: Technical Skills (Python, TensorFlow, PyTorch), Research, Publications
- **Special Features**: Model development, research papers

#### 5. Data Scientist
- **ATS Score**: 93/100
- **Key Sections**: Technical Skills, Data Projects, Publications, Certifications
- **Special Features**: Statistical analysis, visualization tools

### Healthcare Templates

#### 1. Doctor/Physician
- **ATS Score**: 96/100
- **Layout**: Single column
- **Key Sections**: Licenses & Certifications, Clinical Experience, Education, Publications
- **Special Features**: Board certifications prominent, residency details

#### 2. Nurse (RN/LPN/NP)
- **ATS Score**: 97/100
- **Key Sections**: Licenses, Certifications (BLS/ACLS), Clinical Experience, Education
- **Special Features**: Patient care metrics, specializations

#### 3. Medical Assistant
- **ATS Score**: 96/100
- **Key Sections**: Certifications, Clinical Skills, Experience, Education
- **Special Features**: Administrative & clinical skills

### Engineering Templates

#### 1. Civil Engineer
- **ATS Score**: 94/100
- **Key Sections**: Professional Engineer License, Projects, Technical Skills, Experience
- **Special Features**: PE license, project management, AutoCAD

#### 2. Mechanical Engineer
- **ATS Score**: 94/100
- **Key Sections**: Technical Skills (CAD, FEA), Projects, Experience, Certifications
- **Special Features**: Design software, manufacturing

#### 3. Electrical Engineer
- **ATS Score**: 93/100
- **Key Sections**: Technical Skills (Circuit Design, Power Systems), Projects, Experience
- **Special Features**: Schematic design, testing

### Design Templates

#### 1. UI/UX Designer
- **ATS Score**: 88/100 (lower due to portfolio needs)
- **Key Sections**: Portfolio Link, Design Tools, Experience, Projects
- **Special Features**: Portfolio URL prominent, Figma/Sketch

#### 2. Graphic Designer
- **ATS Score**: 87/100
- **Key Sections**: Portfolio Link, Software Proficiency, Experience, Projects
- **Special Features**: Adobe Creative Suite, portfolio

### Business Templates

#### 1. MBA/Business Graduate
- **ATS Score**: 95/100
- **Key Sections**: Education (MBA details), Experience, Skills, Achievements
- **Special Features**: Leadership, quantified achievements

#### 2. Business Analyst
- **ATS Score**: 94/100
- **Key Sections**: Technical Skills (SQL, Excel, Tableau), Experience, Projects
- **Special Features**: Data analysis, process improvement

---

## ATS Compliance Checklist

Each template must meet these criteria:

### Required Elements
- [ ] Single column layout (or carefully tested 2-column)
- [ ] Standard fonts (Arial, Helvetica, Times New Roman, Calibri)
- [ ] Font size 10-12pt for body, 14-16pt for headings
- [ ] 1-inch margins (25.4mm)
- [ ] Standard section headings ("Work Experience", "Education", "Skills")
- [ ] No images, graphics, charts
- [ ] No tables (unless tested)
- [ ] No text boxes
- [ ] No headers/footers
- [ ] Reverse chronological order
- [ ] Clear date formats (MM/YYYY)
- [ ] Bullet points for achievements
- [ ] Keywords from job descriptions
- [ ] Proper heading hierarchy (H1 for name, H2 for sections)

### Export Format Compliance
- [ ] PDF export creates selectable text (not image)
- [ ] DOCX export maintains formatting
- [ ] TXT export preserves structure
- [ ] File size < 2MB

### Testing Checklist
- [ ] Test with major ATS systems (Taleo, Workday, Greenhouse)
- [ ] Test keyword extraction
- [ ] Test section parsing
- [ ] Test contact info extraction
- [ ] Test date parsing

---

## Database Schema (MongoDB)

```typescript
// Resume Collection
{
  _id: ObjectId,
  userId: string,
  title: string,
  industryTarget: string, // IndustryType enum
  template: string, // Template ID

  // Resume content
  personalInfo: {
    fullName: string,
    email: string,
    phone: string,
    location: {
      city: string,
      state: string,
      country: string,
    },
    linkedIn: string,
    github: string,
    portfolio: string,
    professionalTitle: string,
  },

  summary: string,

  experience: [{
    id: string,
    company: string,
    position: string,
    location: string,
    startDate: Date,
    endDate: Date,
    current: boolean,
    achievements: [string],
    order: number,
  }],

  education: [{
    id: string,
    institution: string,
    degree: string,
    field: string,
    location: string,
    startDate: Date,
    endDate: Date,
    gpa: number,
    order: number,
  }],

  skills: [{
    id: string,
    name: string,
    category: string,
    proficiency: string,
    order: number,
  }],

  projects: [{
    id: string,
    name: string,
    description: string,
    technologies: [string],
    url: string,
    githubUrl: string,
    order: number,
  }],

  certifications: [{
    id: string,
    name: string,
    issuer: string,
    date: Date,
    credentialId: string,
    url: string,
    order: number,
  }],

  languages: [{
    id: string,
    name: string,
    proficiency: string,
  }],

  customSections: [{
    id: string,
    title: string,
    content: string,
    items: [{}],
    order: number,
  }],

  // Metadata
  metadata: {
    version: number,
    isPublic: boolean,
    isFavorite: boolean,
    tags: [string],
    targetRole: string,
    targetIndustry: [string],
    lastAnalyzed: Date,
    atsScore: number,
    sectionOrder: [string],
    sectionVisibility: {},
  },

  createdAt: Date,
  updatedAt: Date,
}

// Create indexes
db.resumes.createIndex({ userId: 1, updatedAt: -1 })
db.resumes.createIndex({ userId: 1, 'metadata.isFavorite': 1 })
db.resumes.createIndex({ userId: 1, 'metadata.tags': 1 })
db.resumes.createIndex({ userId: 1, 'metadata.atsScore': -1 })
```

---

## API Endpoints Specification

### Resume Management

#### Create Resume
```typescript
POST /api/resume/create
Body: {
  title: string,
  template?: string,
  industryTarget?: string,
  sourceResumeId?: string, // For duplication
}
Response: {
  success: boolean,
  resume: Resume,
}
```

#### List Resumes
```typescript
GET /api/resume/list
Query: {
  page?: number,
  limit?: number,
  sortBy?: 'updatedAt' | 'createdAt' | 'title' | 'atsScore',
  sortOrder?: 'asc' | 'desc',
  filter?: {
    isFavorite?: boolean,
    tags?: string[],
    industryTarget?: string,
  },
}
Response: {
  success: boolean,
  resumes: Resume[],
  total: number,
  page: number,
  totalPages: number,
}
```

#### Get Resume
```typescript
GET /api/resume/:id
Response: {
  success: boolean,
  resume: Resume,
}
```

#### Update Resume
```typescript
PUT /api/resume/:id
Body: Partial<Resume>
Response: {
  success: boolean,
  resume: Resume,
}
```

#### Delete Resume
```typescript
DELETE /api/resume/:id
Response: {
  success: boolean,
  message: string,
}
```

#### Duplicate Resume
```typescript
POST /api/resume/:id/duplicate
Body: {
  title?: string,
}
Response: {
  success: boolean,
  resume: Resume,
}
```

### Import/Export

#### Import Resume
```typescript
POST /api/resume/import
Body: FormData {
  file: File,
  type: 'linkedin' | 'json' | 'pdf' | 'docx',
  template?: string,
}
Response: {
  success: boolean,
  resume: Resume,
  warnings?: string[],
}
```

#### Export Resume
```typescript
GET /api/resume/:id/export
Query: {
  format: 'pdf' | 'docx' | 'json' | 'txt',
  template?: string,
  options?: ExportOptions,
}
Response: {
  success: boolean,
  downloadUrl: string,
  fileName: string,
}
```

### Templates

#### List Templates
```typescript
GET /api/templates/list
Query: {
  industry?: string,
  atsMinScore?: number,
}
Response: {
  success: boolean,
  templates: IndustryTemplate[],
}
```

#### Get Template
```typescript
GET /api/templates/:id
Response: {
  success: boolean,
  template: IndustryTemplate,
}
```

---

## UI Component Specifications

### Resume List View

```typescript
<ResumeListView>
  {/* Header */}
  <Header>
    <Title>My Resumes</Title>
    <CreateButton>
      <Dropdown>
        - Blank Resume
        - From Template
        - Import from LinkedIn
        - Import from File
      </Dropdown>
    </CreateButton>
  </Header>

  {/* Filters & Search */}
  <FilterBar>
    <SearchInput placeholder="Search resumes..." />
    <FilterDropdown>
      - All Resumes
      - Favorites
      - By Industry
      - By ATS Score
    </FilterDropdown>
    <SortDropdown>
      - Recently Updated
      - Recently Created
      - Highest ATS Score
      - A-Z
    </SortDropdown>
  </FilterBar>

  {/* Resume Grid */}
  <ResumeGrid>
    {resumes.map(resume => (
      <ResumeCard
        key={resume.id}
        resume={resume}
        onEdit={handleEdit}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        onToggleFavorite={handleToggleFavorite}
      />
    ))}
  </ResumeGrid>
</ResumeListView>
```

### Resume Card

```typescript
<ResumeCard>
  <Thumbnail>
    {/* Mini preview of resume */}
  </Thumbnail>

  <Content>
    <Title>{resume.title}</Title>
    <Metadata>
      <IndustryBadge>{resume.industryTarget}</IndustryBadge>
      <ATSScoreBadge score={resume.metadata.atsScore} />
      <LastUpdated>{resume.updatedAt}</LastUpdated>
    </Metadata>
    <Tags>
      {resume.metadata.tags.map(tag => <Tag>{tag}</Tag>)}
    </Tags>
  </Content>

  <Actions>
    <IconButton icon={Star} onClick={handleFavorite} />
    <IconButton icon={Edit} onClick={handleEdit} />
    <DropdownMenu>
      - Duplicate
      - Export as PDF
      - Export as DOCX
      - Delete
    </DropdownMenu>
  </Actions>
</ResumeCard>
```

### Template Selector

```typescript
<TemplateSelector>
  <Tabs>
    <Tab>All</Tab>
    <Tab>Healthcare</Tab>
    <Tab>Technology</Tab>
    <Tab>Engineering</Tab>
    <Tab>Design</Tab>
    <Tab>Business</Tab>
    <Tab>Generic/ATS</Tab>
  </Tabs>

  <TemplateGrid>
    {templates.map(template => (
      <TemplateCard
        key={template.id}
        template={template}
        selected={currentTemplate === template.id}
        onSelect={handleSelect}
      >
        <PreviewImage src={template.preview} />
        <Name>{template.name}</Name>
        <ATSScore score={template.atsScore} />
        <Description>{template.description}</Description>
      </TemplateCard>
    ))}
  </TemplateGrid>

  <PreviewPanel>
    <LivePreview resume={currentResume} template={selectedTemplate} />
    <ApplyButton onClick={handleApplyTemplate}>
      Apply Template
    </ApplyButton>
  </PreviewPanel>
</TemplateSelector>
```

### Import Dialog

```typescript
<ImportDialog>
  <Tabs>
    <Tab>LinkedIn</Tab>
    <Tab>JSON Resume</Tab>
    <Tab>PDF</Tab>
    <Tab>DOCX</Tab>
  </Tabs>

  <Content>
    {importType === 'linkedin' && (
      <>
        <Instructions>
          1. Go to LinkedIn Settings
          2. Request your data archive
          3. Upload the ZIP file here
        </Instructions>
        <FileUpload accept=".zip" />
      </>
    )}

    {importType === 'json' && (
      <FileUpload accept=".json" />
    )}

    {importType === 'pdf' && (
      <>
        <Alert>
          PDF import uses AI to extract data. Results may require review.
        </Alert>
        <FileUpload accept=".pdf" />
      </>
    )}

    {importType === 'docx' && (
      <FileUpload accept=".docx" />
    )}
  </Content>

  {importedData && (
    <PreviewSection>
      <Title>Review Imported Data</Title>
      <DataPreview data={importedData} />
      <TemplateSelector />
      <ConfirmButton onClick={handleImport}>
        Create Resume
      </ConfirmButton>
    </PreviewSection>
  )}
</ImportDialog>
```

### Export Dialog

```typescript
<ExportDialog>
  <FormatSelector>
    <FormatOption value="pdf">
      <Icon component={FileText} />
      <Label>PDF</Label>
      <Description>Best for applications</Description>
    </FormatOption>
    <FormatOption value="docx">
      <Icon component={FileDoc} />
      <Label>Word Document</Label>
      <Description>Editable format</Description>
    </FormatOption>
    <FormatOption value="json">
      <Icon component={FileCode} />
      <Label>JSON</Label>
      <Description>Data backup</Description>
    </FormatOption>
    <FormatOption value="txt">
      <Icon component={File} />
      <Label>Plain Text</Label>
      <Description>Ultra ATS-safe</Description>
    </FormatOption>
  </FormatSelector>

  {format === 'pdf' && (
    <PDFOptions>
      <TemplateSelector current={resume.template} />
      <ColorModeToggle options={['Color', 'Black & White']} />
      <PageSizeSelector options={['A4', 'Letter']} />
      <PhotoToggle />
      <ATSScoreDisplay score={calculateATSScore(options)} />
    </PDFOptions>
  )}

  <PreviewSection>
    <DocumentPreview resume={resume} options={exportOptions} />
  </PreviewSection>

  <Actions>
    <CancelButton>Cancel</CancelButton>
    <DownloadButton onClick={handleExport}>
      Download {format.toUpperCase()}
    </DownloadButton>
  </Actions>
</ExportDialog>
```

---

## Testing Strategy

### Unit Tests
- Template rendering with various data
- Import parsers (LinkedIn, JSON, PDF, DOCX)
- Export generators (PDF, DOCX, JSON, TXT)
- Data transformation utilities
- ATS compliance checks

### Integration Tests
- End-to-end resume creation flow
- Import → Edit → Export flow
- Template switching with data preservation
- Multi-resume management

### ATS Compliance Tests
- Test exports with ATS simulators
- Keyword extraction validation
- Section parsing accuracy
- Contact info extraction

### User Acceptance Tests
- Real user resume imports
- Template switching user flow
- Export quality validation
- Mobile responsiveness

---

## Performance Considerations

### Optimization Strategies
1. **Lazy Loading**: Templates loaded on-demand
2. **Image Optimization**: Template previews compressed
3. **Caching**: Template metadata cached
4. **Chunking**: Large imports processed in chunks
5. **Background Jobs**: Export generation in background
6. **CDN**: Template assets served from CDN

### Performance Metrics
- Resume list load: < 500ms
- Template switch: < 1s
- PDF export: < 3s
- Import processing: < 5s

---

## Security Considerations

### Data Protection
- User resumes encrypted at rest
- Secure file upload validation
- Virus scanning for imports
- Rate limiting on API endpoints
- CORS configuration for uploads

### Access Control
- User can only access own resumes
- Resume sharing with permissions
- Public/private resume settings

---

## Accessibility

### WCAG 2.1 AA Compliance
- Keyboard navigation for all features
- Screen reader support
- Color contrast ratios
- Focus indicators
- Alt text for images
- ARIA labels

---

## Documentation

### User Documentation
- How to import from LinkedIn
- How to choose the right template
- ATS optimization tips
- Export format guide

### Developer Documentation
- Template creation guide
- Parser implementation guide
- API documentation
- Database schema documentation

---

## Success Metrics

### KPIs to Track
1. **Adoption**:
   - Number of resumes created
   - Import usage rate
   - Template diversity

2. **Quality**:
   - Average ATS score
   - Export success rate
   - Template switch rate

3. **Engagement**:
   - Time spent in builder
   - Number of edits per resume
   - Return user rate

4. **Performance**:
   - Page load times
   - Export generation time
   - Import success rate

---

## Future Enhancements

### Post-Launch Features
1. AI-powered resume optimization
2. Real-time ATS scoring
3. Job description matching
4. Resume analytics dashboard
5. Collaborative resume editing
6. Version history/rollback
7. Resume A/B testing
8. Industry-specific AI suggestions
9. Integration with job boards
10. Mobile app

---

## Conclusion

This comprehensive upgrade will transform the EduLen resume builder into a professional-grade tool with:

- **Multi-resume management** for different job applications
- **Industry-specific templates** optimized for ATS
- **Flexible import/export** supporting all major formats
- **Template switching** with full data preservation
- **ATS compliance** as a core design principle

The modular architecture inspired by Reactive-Resume, combined with industry research and ATS best practices, will provide students with a powerful tool to create professional, ATS-friendly resumes tailored to their target industries.
