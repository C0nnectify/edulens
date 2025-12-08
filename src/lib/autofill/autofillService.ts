/**
 * Auto-fill Service for EduLen
 * Handles data extraction from browser extensions and external sources
 */

export interface UserData {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    nationality: string;
    address: {
      street: string;
      city: string;
      state: string;
      country: string;
      zipCode: string;
    };
  };
  academicInfo: {
    currentEducation: string;
    gpa: string;
    institution: string;
    graduationDate: string;
    major: string;
    achievements: string[];
  };
  professionalInfo: {
    workExperience: Array<{
      title: string;
      company: string;
      duration: string;
      description: string;
    }>;
    skills: string[];
    certifications: string[];
  };
  preferences: {
    targetCountries: string[];
    preferredPrograms: string[];
    budget: string;
    startDate: string;
  };
}

export interface AutoFillSource {
  name: string;
  type: 'extension' | 'upload' | 'manual';
  available: boolean;
  extractData: () => Promise<Partial<UserData>>;
}

class AutoFillService {
  private sources: Map<string, AutoFillSource> = new Map();
  private extractedData: Partial<UserData> = {};

  constructor() {
    this.initializeSources();
  }

  /**
   * Initialize available auto-fill sources
   */
  private initializeSources() {
    // LinkedIn Extension Integration
    this.registerSource({
      name: 'LinkedIn',
      type: 'extension',
      available: this.checkExtensionAvailable('linkedin'),
      extractData: this.extractLinkedInData.bind(this)
    });

    // Resume/CV Upload
    this.registerSource({
      name: 'Resume Upload',
      type: 'upload',
      available: true,
      extractData: this.extractResumeData.bind(this)
    });

    // University Portal Data
    this.registerSource({
      name: 'University Portal',
      type: 'extension',
      available: this.checkExtensionAvailable('university-portal'),
      extractData: this.extractUniversityPortalData.bind(this)
    });

    // Google/Social Profile
    this.registerSource({
      name: 'Google Profile',
      type: 'extension',
      available: this.checkExtensionAvailable('google-profile'),
      extractData: this.extractGoogleProfileData.bind(this)
    });
  }

  /**
   * Register a new auto-fill source
   */
  registerSource(source: AutoFillSource) {
    this.sources.set(source.name, source);
  }

  /**
   * Get all available sources
   */
  getAvailableSources(): AutoFillSource[] {
    return Array.from(this.sources.values()).filter(source => source.available);
  }

  /**
   * Extract data from a specific source by name
   */
  async extractFromSource(sourceName: string): Promise<Partial<UserData>> {
    const source = this.sources.get(sourceName);
    if (!source || !source.available) {
      throw new Error(`Source "${sourceName}" is not available`);
    }

    try {
      const data = await source.extractData();
      this.mergeExtractedData(data);
      return data;
    } catch (error) {
      console.error(`Failed to extract data from ${sourceName}:`, error);
      throw error;
    }
  }

  /**
   * Extract data from all available sources
   */
  async extractFromAllSources(): Promise<Partial<UserData>> {
    const availableSources = this.getAvailableSources();
    const extractPromises = availableSources.map(source =>
      this.extractFromSource(source.name).catch(error => {
        console.warn(`Failed to extract from ${source.name}:`, error);
        return {};
      })
    );

    const results = await Promise.all(extractPromises);
    const mergedData = results.reduce((acc, data) => this.deepMerge(acc, data), {});

    this.extractedData = mergedData;
    return mergedData;
  }

  /**
   * Get currently extracted data
   */
  getExtractedData(): Partial<UserData> {
    return this.extractedData;
  }

  /**
   * Clear extracted data
   */
  clearExtractedData() {
    this.extractedData = {};
  }

  /**
   * LinkedIn data extraction
   */
  private async extractLinkedInData(): Promise<Partial<UserData>> {
    return new Promise((resolve) => {
      // Simulate extension communication
      if (typeof window !== 'undefined' && window.postMessage) {
        const messageHandler = (event: MessageEvent) => {
          if (event.data.type === 'LINKEDIN_DATA_RESPONSE') {
            window.removeEventListener('message', messageHandler);
            resolve(this.parseLinkedInData(event.data.payload));
          }
        };

        window.addEventListener('message', messageHandler);
        window.postMessage({ type: 'REQUEST_LINKEDIN_DATA' }, '*');

        // Timeout after 5 seconds
        setTimeout(() => {
          window.removeEventListener('message', messageHandler);
          resolve({});
        }, 5000);
      } else {
        resolve({});
      }
    });
  }

  /**
   * Resume/CV upload data extraction
   */
  private async extractResumeData(): Promise<Partial<UserData>> {
    // This would integrate with a file upload and parsing service
    return {};
  }

  /**
   * University portal data extraction
   */
  private async extractUniversityPortalData(): Promise<Partial<UserData>> {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.postMessage) {
        const messageHandler = (event: MessageEvent) => {
          if (event.data.type === 'UNIVERSITY_PORTAL_DATA_RESPONSE') {
            window.removeEventListener('message', messageHandler);
            resolve(this.parseUniversityPortalData(event.data.payload));
          }
        };

        window.addEventListener('message', messageHandler);
        window.postMessage({ type: 'REQUEST_UNIVERSITY_PORTAL_DATA' }, '*');

        setTimeout(() => {
          window.removeEventListener('message', messageHandler);
          resolve({});
        }, 5000);
      } else {
        resolve({});
      }
    });
  }

  /**
   * Google profile data extraction
   */
  private async extractGoogleProfileData(): Promise<Partial<UserData>> {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.postMessage) {
        const messageHandler = (event: MessageEvent) => {
          if (event.data.type === 'GOOGLE_PROFILE_DATA_RESPONSE') {
            window.removeEventListener('message', messageHandler);
            resolve(this.parseGoogleProfileData(event.data.payload));
          }
        };

        window.addEventListener('message', messageHandler);
        window.postMessage({ type: 'REQUEST_GOOGLE_PROFILE_DATA' }, '*');

        setTimeout(() => {
          window.removeEventListener('message', messageHandler);
          resolve({});
        }, 5000);
      } else {
        resolve({});
      }
    });
  }

  /**
   * Check if browser extension is available
   */
  private checkExtensionAvailable(extensionType: string): boolean {
    if (typeof window === 'undefined') return false;

    // Check for extension-specific signals
    const extensionSignals = {
      'linkedin': () => document.querySelector('[data-linkedin-extension]') !== null,
      'university-portal': () => document.querySelector('[data-university-extension]') !== null,
      'google-profile': () => document.querySelector('[data-google-extension]') !== null
    };

    const checkFunction = extensionSignals[extensionType as keyof typeof extensionSignals];
    return checkFunction ? checkFunction() : false;
  }

  /**
   * Parse LinkedIn data
   */
  private parseLinkedInData(data: any): Partial<UserData> {
    if (!data) return {};

    return {
      personalInfo: {
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || '',
        phone: data.phone || '',
        dateOfBirth: '',
        nationality: '',
        address: {
          street: '',
          city: data.location?.city || '',
          state: data.location?.state || '',
          country: data.location?.country || '',
          zipCode: ''
        }
      },
      professionalInfo: {
        workExperience: data.positions?.map((pos: any) => ({
          title: pos.title || '',
          company: pos.company || '',
          duration: `${pos.startDate} - ${pos.endDate || 'Present'}`,
          description: pos.description || ''
        })) || [],
        skills: data.skills || [],
        certifications: data.certifications?.map((cert: any) => cert.name) || []
      },
      academicInfo: {
        currentEducation: data.education?.[0]?.degree || '',
        gpa: '',
        institution: data.education?.[0]?.school || '',
        graduationDate: data.education?.[0]?.endDate || '',
        major: data.education?.[0]?.fieldOfStudy || '',
        achievements: []
      }
    };
  }

  /**
   * Parse university portal data
   */
  private parseUniversityPortalData(data: any): Partial<UserData> {
    if (!data) return {};

    return {
      academicInfo: {
        currentEducation: data.currentDegree || '',
        gpa: data.gpa || '',
        institution: data.currentInstitution || '',
        graduationDate: data.expectedGraduation || '',
        major: data.major || '',
        achievements: data.achievements || []
      },
      preferences: {
        targetCountries: data.targetCountries || [],
        preferredPrograms: data.programsOfInterest || [],
        budget: data.budget || '',
        startDate: data.intendedStartDate || ''
      }
    };
  }

  /**
   * Parse Google profile data
   */
  private parseGoogleProfileData(data: any): Partial<UserData> {
    if (!data) return {};

    return {
      personalInfo: {
        firstName: data.given_name || '',
        lastName: data.family_name || '',
        email: data.email || '',
        phone: '',
        dateOfBirth: '',
        nationality: '',
        address: {
          street: '',
          city: '',
          state: '',
          country: '',
          zipCode: ''
        }
      }
    };
  }

  /**
   * Merge extracted data with existing data
   */
  private mergeExtractedData(newData: Partial<UserData>) {
    this.extractedData = this.deepMerge(this.extractedData, newData);
  }

  /**
   * Deep merge two objects
   */
  private deepMerge(target: any, source: any): any {
    const result = { ...target };

    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else if (source[key] !== undefined && source[key] !== null && source[key] !== '') {
        result[key] = source[key];
      }
    }

    return result;
  }
}

// Export singleton instance
export const autoFillService = new AutoFillService();
export default AutoFillService;