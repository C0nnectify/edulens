import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { randomUUID } from 'crypto';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mentorshipId } = body;

    if (!mentorshipId) {
      return NextResponse.json(
        { error: 'Mentorship ID is required' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db();
    const mentorshipCollection = db.collection('root_edulen');
    const paymentCollection = db.collection('payments');

    // Find the mentorship submission
    const mentorship = await mentorshipCollection.findOne({ _id: new ObjectId(mentorshipId) });
    
    if (!mentorship) {
      return NextResponse.json(
        { error: 'Mentorship submission not found' },
        { status: 404 }
      );
    }

    // Generate unique payment URL
    const paymentId = randomUUID();
    const paymentUrl = `/payment/${paymentId}`;

    // Create payment record
    const paymentRecord = {
      paymentId,
      mentorshipId,
      amount: 1000, // 1000 BDT
      currency: 'BDT',
      status: 'pending',
      paymentMethod: null,
      transactionId: null,
      accountNumber: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await paymentCollection.insertOne(paymentRecord);

    // Update mentorship status
    await mentorshipCollection.updateOne(
      { _id: new ObjectId(mentorshipId) },
      { 
        $set: { 
          status: 'payment_pending',
          paymentId,
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json({
      success: true,
      paymentUrl,
      paymentId,
      amount: paymentRecord.amount,
      currency: paymentRecord.currency
    });

  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentId, paymentMethod, transactionId, accountNumber } = body;

    if (!paymentId || !paymentMethod || !transactionId || !accountNumber) {
      return NextResponse.json(
        { error: 'All payment fields are required' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db();
    const paymentCollection = db.collection('payments');
    const mentorshipCollection = db.collection('root_edulen');

    // Update payment record
    const result = await paymentCollection.updateOne(
      { paymentId },
      {
        $set: {
          paymentMethod,
          transactionId,
          accountNumber,
          status: 'completed',
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Get payment record to find mentorship ID
    const payment = await paymentCollection.findOne({ paymentId });
    
    if (payment) {
      // Update mentorship status
      await mentorshipCollection.updateOne(
        { _id: new ObjectId(payment.mentorshipId) },
        { 
          $set: { 
            status: 'paid',
            updatedAt: new Date()
          }
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payment submitted successfully'
    });

  } catch (error) {
    console.error('Error updating payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 