/**
 * Script to set a user as admin
 * 
 * Usage: npx tsx scripts/set-admin.ts <email>
 * Example: npx tsx scripts/set-admin.ts john@example.com
 */

import { MongoClient } from 'mongodb';
import * as fs from 'fs';
import * as path from 'path';

// Manually parse .env file
function loadEnv() {
  const envFiles = ['.env.local', '.env'];
  for (const envFile of envFiles) {
    const envPath = path.join(process.cwd(), envFile);
    if (fs.existsSync(envPath)) {
      console.log(`📁 Loading ${envFile}`);
      const envContent = fs.readFileSync(envPath, 'utf-8');
      const lines = envContent.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const eqIndex = trimmed.indexOf('=');
          if (eqIndex > 0) {
            const key = trimmed.substring(0, eqIndex);
            const value = trimmed.substring(eqIndex + 1);
            if (!process.env[key]) {
              process.env[key] = value;
            }
          }
        }
      }
      break;
    }
  }
}

loadEnv();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  console.log('Make sure you have a .env file with MONGODB_URI set');
  process.exit(1);
}

async function setAdmin(email: string) {
  if (!email) {
    console.error('❌ Please provide an email address');
    console.log('Usage: npx tsx scripts/set-admin.ts <email>');
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const usersCollection = db.collection('user');
    
    // Find the user first
    const user = await usersCollection.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.error(`❌ User with email "${email}" not found`);
      
      // List available users
      console.log('\n📋 Available users:');
      const users = await usersCollection.find({}, { 
        projection: { email: 1, name: 1, role: 1 } 
      }).limit(20).toArray();
      
      users.forEach(u => {
        console.log(`  - ${u.email} (${u.name || 'No name'}) [${u.role || 'user'}]`);
      });
      
      process.exit(1);
    }
    
    if (user.role === 'admin') {
      console.log(`ℹ️  User "${email}" is already an admin`);
      process.exit(0);
    }
    
    // Update to admin
    const result = await usersCollection.updateOne(
      { email: email.toLowerCase() },
      { $set: { role: 'admin' } }
    );
    
    if (result.modifiedCount === 1) {
      console.log(`✅ Successfully set "${email}" as admin!`);
      console.log(`   Name: ${user.name || 'No name'}`);
      console.log(`   Previous role: ${user.role || 'user'}`);
      console.log(`   New role: admin`);
    } else {
      console.error('❌ Failed to update user');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Get email from command line argument
const email = process.argv[2];
setAdmin(email);
