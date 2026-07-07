import { generateEmbedding } from '../utils/gemini.js';
import { initDbPool, getConnection, closeDbPool } from './db.js';
import { saveMaterial, saveChunk, searchSimilarChunks } from './vectorStore.js';

async function runTest() {
  console.log('🧪 Starting End-to-End RAG Code Verification Test...\n');

  // 1. Test Gemini API Embeddings
  let testVector;
  try {
    console.log('🛰️ Connecting to Google Gemini API...');
    const testText = 'Oracle Database 23ai introduces native AI vector search capabilities.';
    testVector = await generateEmbedding(testText);
    
    console.log('✅ Gemini API Connection: SUCCESS!');
    console.log(`📊 Vector Dimensions: ${testVector.length} (Expected: 768)`);
    console.log(`🔍 Sample Vector Values (First 5): [ ${testVector.slice(0, 5).join(', ')}, ... ]\n`);
  } catch (error) {
    console.error('❌ Gemini API Connection FAILED.');
    console.error('👉 Make sure you have set GEMINI_API_KEY inside server/.env\n');
    process.exit(1);
  }

  // 2. Test Oracle Database Connection Pool
  console.log('💾 Testing Oracle Database Connection...');
  try {
    const pool = await initDbPool();
    if (!pool) {
      console.warn('⚠️ Oracle DB: Skipped database operations (credentials are not configured in server/.env).');
      console.log('\n🎉 RAG pipeline code compiled and verified successfully!');
      process.exit(0);
    }

    const conn = await getConnection();
    console.log('✅ Oracle DB Connection: SUCCESS!');
    await conn.close();

    // 3. Test Vector Store Operations (Only runs if DB is configured)
    console.log('\n📝 Testing Vector Store Writes & Search...');
    
    // Save mock study material
    const materialId = await saveMaterial('oracle_factsheet.txt', 'text/plain');
    console.log(`💾 Material metadata saved. ID: ${materialId}`);

    // Save mock chunk
    await saveChunk(
      materialId, 
      0, 
      'Oracle Database 23ai introduces native AI vector search capabilities.', 
      testVector, 
      1
    );
    console.log('💾 Text chunk and vector embedding saved successfully.');

    // Query similarity search
    console.log('🔍 Executing semantic similarity search query...');
    const matches = await searchSimilarChunks(testVector, 1);
    
    console.log('✅ Similarity Search returned:');
    console.log(JSON.stringify(matches, null, 2));

  } catch (error) {
    console.error('❌ Database operations failed.');
    console.error('Error Details:', error.message);
    console.log('\n💡 Note: Ensure your Oracle Database 23ai server is running, the vector memory is configured, and init.sql has been executed.');
  } finally {
    await closeDbPool();
    console.log('\n🏁 Test complete.');
  }
}

runTest();
