// Storage Initialization Script
// Run this once to set up Supabase Storage buckets
// Usage: node scripts/initStorage.js (or run from browser console)

import { initializeStorageBuckets } from '../services/fileStorageService';

async function main() {
  console.log('🚀 Initializing Supabase Storage buckets...');
  
  try {
    await initializeStorageBuckets();
    console.log('✅ Storage buckets initialized successfully!');
    console.log('\nBuckets created:');
    console.log('  - videos (500MB limit)');
    console.log('  - audio (100MB limit)');
    console.log('  - transcripts (10MB limit)');
    console.log('  - documents (50MB limit)');
    console.log('  - images (10MB limit)');
  } catch (error) {
    console.error('❌ Failed to initialize storage:', error);
    process.exit(1);
  }
}

main();
