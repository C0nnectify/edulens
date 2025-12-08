import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { NotificationPreferencesModel } from '@/lib/db/models/notification';
import type { UpdateNotificationPreferencesDto } from '@/types/notification';

// GET /api/notifications/preferences - Get user's notification preferences
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

    // Get preferences from MongoDB (creates default if not exists)
    let preferences = await NotificationPreferencesModel.findByUserId(userId);

    if (!preferences) {
      // Create default preferences with user's email
      preferences = await NotificationPreferencesModel.upsert(userId, {
        channels: {
          email: {
            enabled: true,
            address: session.user.email,
          },
          sms: {
            enabled: false,
            phone: '',
          },
          push: {
            enabled: false,
            deviceTokens: [],
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    console.error('[Notification Preferences API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/notifications/preferences - Update notification preferences
export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const updates: UpdateNotificationPreferencesDto = await request.json();

    // Get existing preferences
    let preferences = await NotificationPreferencesModel.findByUserId(userId);

    // Prepare merged updates
    const mergedUpdates: any = {};

    if (updates.channels) {
      mergedUpdates.channels = {
        ...(preferences?.channels || {}),
        ...updates.channels,
      };
    }

    if (updates.types) {
      mergedUpdates.types = {
        ...(preferences?.types || {}),
        ...updates.types,
      };
    }

    if (updates.quietHours) {
      mergedUpdates.quietHours = {
        ...(preferences?.quietHours || {}),
        ...updates.quietHours,
      };
    }

    if (updates.timezone) {
      mergedUpdates.timezone = updates.timezone;
    }

    // Upsert preferences in MongoDB
    const updatedPreferences = await NotificationPreferencesModel.upsert(userId, mergedUpdates);

    return NextResponse.json({
      success: true,
      message: 'Notification preferences updated successfully',
      data: updatedPreferences,
    });
  } catch (error) {
    console.error('[Notification Preferences API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
