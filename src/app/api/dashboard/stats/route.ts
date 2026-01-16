import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDatabase } from '@/lib/db/mongodb';
import { getChatCollections } from '@/lib/db/chatHistory';
import { ApplicationModel } from '@/lib/db/models/application';

// GET /api/dashboard/stats - Get user dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const db = await getDatabase();

    // Get documents count (from documents_metadata collection)
    const documentsCount = await db
      .collection('documents_metadata')
      .countDocuments({ userId });

    // Get generated documents count (SOPs, CVs, Resumes, LORs from chat sessions with documentType)
    const { sessions: chatSessionsCollection } = await getChatCollections();
    
    // Count chat sessions
    const chatSessionsCount = await chatSessionsCollection.countDocuments({
      $or: [{ userId }, { userId: session.user.id }]
    });

    // Count generated documents (sessions with documentType)
    const generatedDocsCount = await chatSessionsCollection.countDocuments({
      $or: [{ userId }, { userId: session.user.id }],
      documentType: { $in: ['sop', 'lor', 'cv', 'resume'] }
    });

    // Get applications data
    const applications = await ApplicationModel.findByUserId(userId);
    const applicationsCount = applications.length;

    // Calculate upload progress based on profile completeness
    const profile = await db.collection('user_profiles').findOne({
      $or: [{ userId }, { user_id: userId }]
    });
    
    const smartProfile = await db.collection('smart_profiles').findOne({
      $or: [{ userId }, { user_id: userId }]
    });

    // Calculate profile completeness percentage
    let uploadProgress = 0;
    if (smartProfile || profile) {
      const checkFields = [
        smartProfile?.personal_info?.full_name || profile?.name,
        smartProfile?.contact_info?.email || profile?.email,
        smartProfile?.education?.length > 0,
        smartProfile?.test_scores,
        smartProfile?.work_experience?.length > 0,
        smartProfile?.future_ambitions?.target_degree,
        smartProfile?.future_ambitions?.target_countries?.length > 0,
        documentsCount > 0,
      ];
      const filledFields = checkFields.filter(Boolean).length;
      uploadProgress = Math.round((filledFields / checkFields.length) * 100);
    }

    // Get recent activity
    const recentChatSessions = await chatSessionsCollection
      .find({ $or: [{ userId }, { userId: session.user.id }] })
      .sort({ updatedAt: -1 })
      .limit(10)
      .toArray();

    const recentActivity = recentChatSessions.map(session => {
      let title = session.title || 'Chat session';
      let type: 'document' | 'chat' | 'application' = 'chat';
      
      if (session.documentType) {
        type = 'document';
        const docTypeLabels: Record<string, string> = {
          sop: 'SOP',
          lor: 'LOR',
          cv: 'CV',
          resume: 'Resume'
        };
        title = `${docTypeLabels[session.documentType] || session.documentType.toUpperCase()} ${session.title?.includes('generated') ? 'generated' : 'created'}`;
      }

      return {
        id: session.sessionId,
        title,
        time: session.updatedAt,
        type,
        documentType: session.documentType || null,
      };
    });

    // Add recent applications to activity
    const recentApplications = applications
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
      .map(app => ({
        id: app._id?.toString() || '',
        title: `Application ${app.status === 'submitted' ? 'submitted' : 'updated'} for ${app.universityName}`,
        time: app.updatedAt,
        type: 'application' as const,
        documentType: null,
      }));

    // Merge and sort all activities
    const allActivity = [...recentActivity, ...recentApplications]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 8);

    // Get roadmap/next steps from user profile
    const roadmapPlan = await db.collection('roadmap_plans').findOne({
      $or: [{ userId }, { user_id: userId }]
    });

    let nextSteps: Array<{
      id: string;
      title: string;
      description: string;
      priority: 'high' | 'medium' | 'low';
      stageId?: string;
      status: string;
    }> = [];

    if (roadmapPlan && roadmapPlan.stages) {
      // Find stages that are not completed and get their tasks
      const pendingStages = roadmapPlan.stages
        .filter((stage: any) => stage.status !== 'completed')
        .slice(0, 3);

      nextSteps = pendingStages.map((stage: any, index: number) => ({
        id: stage.id || `stage-${index}`,
        title: stage.title || stage.name || `Stage ${index + 1}`,
        description: stage.description || stage.tips?.[0] || 'Continue your journey',
        priority: index === 0 ? 'high' : index === 1 ? 'medium' : 'low',
        stageId: stage.id,
        status: stage.status || 'not_started',
      }));
    }

    // Default next steps if no roadmap
    if (nextSteps.length === 0) {
      nextSteps = [
        {
          id: 'complete-profile',
          title: 'Complete your profile',
          description: 'Add your education, experience, and test scores',
          priority: 'high',
          status: uploadProgress >= 100 ? 'completed' : 'in_progress',
        },
        {
          id: 'upload-documents',
          title: 'Upload supporting documents',
          description: 'Add transcripts, certificates, and other documents',
          priority: 'medium',
          status: documentsCount > 0 ? 'in_progress' : 'not_started',
        },
        {
          id: 'start-applications',
          title: 'Start tracking applications',
          description: 'Add universities you want to apply to',
          priority: 'low',
          status: applicationsCount > 0 ? 'in_progress' : 'not_started',
        },
      ];
    }

    return NextResponse.json({
      success: true,
      stats: {
        documentsCreated: generatedDocsCount + documentsCount,
        applicationsTracked: applicationsCount,
        chatSessions: chatSessionsCount,
        uploadProgress,
      },
      recentActivity: allActivity,
      nextSteps,
      roadmap: roadmapPlan ? {
        totalStages: roadmapPlan.stages?.length || 0,
        completedStages: roadmapPlan.stages?.filter((s: any) => s.status === 'completed').length || 0,
        currentStage: roadmapPlan.stages?.find((s: any) => s.status === 'in_progress'),
      } : null,
    });
  } catch (error) {
    console.error('[Dashboard Stats API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
