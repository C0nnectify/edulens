#!/usr/bin/env tsx

/**
 * Database Initialization Script for Document AI System
 *
 * This script initializes the MongoDB database with required collections,
 * indexes, and configurations for the document AI system.
 *
 * Usage: npx tsx scripts/init-document-db.ts
 */

import { initializeDatabase, getDocumentsCollection } from '@/lib/db/document-db';

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   Document AI System - Database Initialization            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log();

  try {
    // Step 1: Initialize collections and indexes
    console.log('📦 Step 1: Creating collections and indexes...');
    await initializeDatabase();
    console.log('✓ Collections and indexes created successfully');
    console.log();

    // Step 2: Verify collections
    console.log('🔍 Step 2: Verifying collections...');
    const documentsCollection = await getDocumentsCollection();
    const indexes = await documentsCollection.indexes();

    console.log('✓ Documents metadata collection verified');
    console.log(`  - Total indexes: ${indexes.length}`);
    indexes.forEach(index => {
      console.log(`    • ${index.name}`);
    });
    console.log();

    // Step 3: Display next steps
    console.log('✅ Database initialization complete!');
    console.log();
    console.log('📋 Next Steps:');
    console.log();
    console.log('1. Set up vector search indexes in MongoDB Atlas:');
    console.log('   - Navigate to your cluster → Search → Create Search Index');
    console.log('   - Name: "vector_index"');
    console.log('   - Type: "vectorSearch"');
    console.log('   - Apply to collections: vectors_<userId> (as they are created)');
    console.log();
    console.log('2. Configure environment variables:');
    console.log('   - OPENAI_API_KEY for embeddings');
    console.log('   - Optional: COHERE_API_KEY, GOOGLE_CLOUD_API_KEY');
    console.log();
    console.log('3. Start development server:');
    console.log('   npm run dev');
    console.log();
    console.log('4. Test the API endpoints:');
    console.log('   - POST /api/document/upload');
    console.log('   - POST /api/document/search');
    console.log('   - GET  /api/document/list');
    console.log();
    console.log('📚 Documentation:');
    console.log('   - DOCUMENT_AI_ARCHITECTURE.md - Full architecture');
    console.log('   - DOCUMENT_AI_QUICK_START.md - Quick start guide');
    console.log();

  } catch (error: any) {
    console.error('❌ Database initialization failed:');
    console.error();
    console.error(error.message);
    console.error();
    console.error('Stack trace:');
    console.error(error.stack);
    console.error();
    console.error('Please check:');
    console.error('1. MongoDB connection string in .env.local');
    console.error('2. MongoDB server is running');
    console.error('3. Database permissions are correct');
    process.exit(1);
  }

  process.exit(0);
}

// Run the initialization
main();
