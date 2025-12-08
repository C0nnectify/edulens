import { NextRequest, NextResponse } from 'next/server';
import { deadlines, applications, documentChecklistData } from '@/lib/data-store';

interface ValidationCheck {
  id: string;
  category: string;
  name: string;
  status: 'pass' | 'warning' | 'fail' | 'pending';
  message: string;
  details?: string;
  suggestion?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: applicationId } = await params;

    // Get application
    const application = applications.get(applicationId);
    if (!application) {
      return NextResponse.json(
        { success: false, error: 'Application not found' },
        { status: 404 }
      );
    }

    const checks: ValidationCheck[] = [];
    const blockers: string[] = [];
    const warnings: string[] = [];

    // 1. Document Validation
    const requiredDocuments = documentChecklistData.get(applicationId) || [];
    const missingRequired = requiredDocuments.filter(
      (doc) => doc.required && doc.status === 'missing'
    );

    if (missingRequired.length > 0) {
      checks.push({
        id: 'docs-required',
        category: 'documents',
        name: 'Required Documents',
        status: 'fail',
        message: `${missingRequired.length} required document(s) missing`,
        details: missingRequired.map((d) => d.name).join(', '),
        suggestion: 'Upload all required documents before submitting',
      });
      blockers.push(`Missing ${missingRequired.length} required documents`);
    } else {
      checks.push({
        id: 'docs-required',
        category: 'documents',
        name: 'Required Documents',
        status: 'pass',
        message: 'All required documents uploaded',
      });
    }

    const rejectedDocuments = requiredDocuments.filter(
      (doc) => doc.validationStatus === 'rejected'
    );

    if (rejectedDocuments.length > 0) {
      checks.push({
        id: 'docs-validation',
        category: 'documents',
        name: 'Document Validation',
        status: 'fail',
        message: `${rejectedDocuments.length} document(s) failed validation`,
        details: rejectedDocuments.map((d) => d.name).join(', '),
        suggestion: 'Fix validation errors and re-upload documents',
      });
      blockers.push(`${rejectedDocuments.length} documents failed validation`);
    } else if (requiredDocuments.some((doc) => doc.status === 'uploaded')) {
      checks.push({
        id: 'docs-validation',
        category: 'documents',
        name: 'Document Validation',
        status: 'warning',
        message: 'Some documents not yet validated',
        suggestion: 'Wait for validation to complete or re-upload',
      });
      warnings.push('Some documents pending validation');
    } else {
      checks.push({
        id: 'docs-validation',
        category: 'documents',
        name: 'Document Validation',
        status: 'pass',
        message: 'All documents validated successfully',
      });
    }

    // 2. Deadline Validation
    const appDeadlines = Array.from(deadlines.values()).filter(
      (d) => d.applicationId === applicationId
    );
    const primaryDeadline = appDeadlines.find((d) => d.type === 'application');

    if (!primaryDeadline) {
      checks.push({
        id: 'deadline-set',
        category: 'deadlines',
        name: 'Application Deadline',
        status: 'warning',
        message: 'No application deadline set',
        suggestion: 'Set the application deadline to receive reminders',
      });
      warnings.push('No application deadline set');
    } else {
      const now = new Date();
      const deadline = new Date(primaryDeadline.date);
      const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntilDeadline < 0) {
        checks.push({
          id: 'deadline-set',
          category: 'deadlines',
          name: 'Application Deadline',
          status: 'fail',
          message: 'Application deadline has passed',
          details: `Deadline was ${primaryDeadline.date}`,
          suggestion: 'Check if deadline has been extended or apply to rolling admission',
        });
        blockers.push('Application deadline has passed');
      } else if (hoursUntilDeadline < 24) {
        checks.push({
          id: 'deadline-set',
          category: 'deadlines',
          name: 'Application Deadline',
          status: 'warning',
          message: `Less than 24 hours until deadline`,
          details: `Deadline: ${primaryDeadline.date}`,
        });
        warnings.push('Less than 24 hours until deadline');
      } else {
        checks.push({
          id: 'deadline-set',
          category: 'deadlines',
          name: 'Application Deadline',
          status: 'pass',
          message: `Deadline: ${primaryDeadline.date}`,
        });
      }
    }

    // 3. Profile Completeness
    if (!application.universityName || !application.programName) {
      checks.push({
        id: 'profile-basic',
        category: 'profile',
        name: 'Basic Information',
        status: 'fail',
        message: 'University or program name missing',
        suggestion: 'Complete basic application information',
      });
      blockers.push('Missing university or program information');
    } else {
      checks.push({
        id: 'profile-basic',
        category: 'profile',
        name: 'Basic Information',
        status: 'pass',
        message: 'Basic information complete',
      });
    }

    if (!application.degreeLevel) {
      checks.push({
        id: 'profile-degree',
        category: 'profile',
        name: 'Degree Level',
        status: 'warning',
        message: 'Degree level not specified',
        suggestion: 'Specify degree level (undergraduate, graduate, etc.)',
      });
      warnings.push('Degree level not specified');
    } else {
      checks.push({
        id: 'profile-degree',
        category: 'profile',
        name: 'Degree Level',
        status: 'pass',
        message: `Degree level: ${application.degreeLevel}`,
      });
    }

    // 4. Portal Credentials (if needed)
    checks.push({
      id: 'portal-access',
      category: 'communication',
      name: 'Portal Access',
      status: 'pass',
      message: 'Portal URL recorded',
      details: application.portalUrl || 'No portal URL',
    });

    // 5. Payment Information
    if (application.applicationFee && application.applicationFee > 0) {
      checks.push({
        id: 'payment',
        category: 'profile',
        name: 'Application Fee',
        status: 'warning',
        message: `Application fee: $${application.applicationFee}`,
        details: 'Ensure payment is ready',
      });
      warnings.push('Application fee payment required');
    } else {
      checks.push({
        id: 'payment',
        category: 'profile',
        name: 'Application Fee',
        status: 'pass',
        message: 'No application fee or fee waiver',
      });
    }

    // Calculate completion percentage
    const totalChecks = checks.length;
    const passedChecks = checks.filter((c) => c.status === 'pass').length;
    const completionPercentage = Math.round((passedChecks / totalChecks) * 100);

    // Determine overall status
    let overallStatus: 'ready' | 'has_warnings' | 'not_ready';
    if (blockers.length > 0) {
      overallStatus = 'not_ready';
    } else if (warnings.length > 0) {
      overallStatus = 'has_warnings';
    } else {
      overallStatus = 'ready';
    }

    const report = {
      overallStatus,
      completionPercentage,
      checks,
      canSubmit: blockers.length === 0,
      blockers,
      warnings,
    };

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Error validating submission:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to validate submission' },
      { status: 500 }
    );
  }
}

// Export documentChecklistData for other files if needed
export { documentChecklistData };
