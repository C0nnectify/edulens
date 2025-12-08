import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

// MongoDB connection
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const client = new MongoClient(uri);

interface WaitlistEntry {
  name: string;
  email: string;
  mobile?: string;
  phone?: string;
  source?: string;
  timestamp?: string;
  createdAt: Date;
}

export async function POST(request: NextRequest) {
  try {
    const body: WaitlistEntry = await request.json();
    
    // Validate required fields
    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await client.connect();
    const database = client.db('edulens');
    const waitlistCollection = database.collection('waitlist');

    // Check if email already exists
    const existingEntry = await waitlistCollection.findOne({ email: body.email });
    if (existingEntry) {
      return NextResponse.json(
        { error: 'Email already registered on waitlist' },
        { status: 409 }
      );
    }

    // Create waitlist entry
    const waitlistEntry = {
      name: body.name,
      email: body.email,
      mobile: body.mobile ?? body.phone,
      source: body.source ?? 'general',
      timestamp: body.timestamp ?? new Date().toISOString(),
      createdAt: new Date(),
    } satisfies Omit<WaitlistEntry, 'createdAt'> & { createdAt: Date };

    // Insert into database
    const result = await waitlistCollection.insertOne(waitlistEntry);

    // Log the submission (optional)
    console.log(`New waitlist entry: ${body.email} from ${waitlistEntry.source}`);

    return NextResponse.json(
      { 
        success: true, 
        message: 'Successfully joined waitlist',
        id: result.insertedId 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Waitlist API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}

export async function GET() {
  try {
    // Connect to MongoDB
    await client.connect();
    const database = client.db('edulens');
    const waitlistCollection = database.collection('waitlist');

    // Get waitlist count (for admin purposes)
    const count = await waitlistCollection.countDocuments();

    return NextResponse.json(
      { 
        success: true, 
        count,
        message: 'Waitlist count retrieved successfully'
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Waitlist GET API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
} 