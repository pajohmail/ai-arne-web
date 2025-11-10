import { config } from 'dotenv';
import { createResponse } from './services/responses.js';
import { rewriteNewsWithAI } from './agents/generalNewsAgent.js';
import { createOrUpdateTutorial } from './agents/tutorialAgent.js';
import type { ProviderRelease } from './agents/providers.js';

// Ladda miljövariabler
config();

/**
 * Test Responses API implementation
 */
async function testResponsesAPI() {
  console.log('🧪 Testar Responses API-implementation...\n');
  console.log('📅 Tidsstämpel:', new Date().toISOString());
  console.log('');

  // Kontrollera miljövariabler
  console.log('🔧 Konfiguration:');
  console.log(`   OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '✅ Satt' : '❌ Saknas'}`);
  console.log(`   ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? '✅ Satt' : '❌ Saknas'}`);
  console.log('');

  // Test 1: Enkel Responses API-anrop
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📝 Test 1: Enkel Responses API-anrop');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  try {
    const testPrompt = 'Skriv en kort mening på svenska om AI-utveckling.';
    console.log(`Prompt: "${testPrompt}"`);
    
    const response = await createResponse(testPrompt, {
      model: 'gpt-4o',
      maxTokens: 100,
      temperature: 0.7
    });
    
    console.log(`✅ Svar från ${response.provider.toUpperCase()} API:`);
    console.log(`   ${response.content}`);
    console.log('');
  } catch (error: any) {
    console.error(`❌ Fel i Test 1:`, error.message);
    console.log('');
  }

  // Test 2: generalNewsAgent rewriteNewsWithAI
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📰 Test 2: generalNewsAgent - rewriteNewsWithAI');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  try {
    const testNewsItem = {
      title: 'OpenAI releases new GPT-4 model',
      summary: 'OpenAI has released a new version of GPT-4 with improved capabilities for developers. The new model includes better code generation and natural language understanding, making it more useful for software development tasks.',
      sourceUrl: 'https://example.com/news',
      sourceName: 'TechCrunch'
    };
    
    console.log(`Testar nyhetsitem: "${testNewsItem.title}"`);
    
    const result = await rewriteNewsWithAI(testNewsItem);
    
    if (result) {
      console.log('✅ Sammanfattning omarbetad:');
      console.log(`   Titel: ${result.title}`);
      console.log(`   Excerpt: ${result.excerpt.substring(0, 100)}...`);
      console.log(`   Content length: ${result.content.length} tecken`);
      console.log('');
    } else {
      console.log('⚠️  Resultatet var null');
      console.log('');
    }
  } catch (error: any) {
    console.error(`❌ Fel i Test 2:`, error.message);
    console.log('');
  }

  // Test 3: tutorialAgent createOrUpdateTutorial
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📚 Test 3: tutorialAgent - createOrUpdateTutorial');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  try {
    const testRelease: ProviderRelease = {
      provider: 'openai',
      name: 'OpenAI SDK v6.8.0',
      version: 'v6.8.0',
      kind: 'sdk',
      publishedAt: new Date().toISOString(),
      url: 'https://github.com/openai/openai-node/releases/tag/v6.8.0',
      summary: 'New version of OpenAI SDK with improved features for developers.'
    };
    
    console.log(`Testar tutorial-generering för: ${testRelease.name}`);
    console.log('⚠️  OBS: Detta testar INTE sparande till Firestore');
    console.log('   (behöver postId och Firestore-anslutning)');
    console.log('');
    
    // Vi kan inte testa createOrUpdateTutorial utan Firestore, men vi kan testa Responses API-anropet
    const tutorialPrompt = `Du är en teknisk skribent. Skapa en kort tutorial-introduktion (2-3 meningar) på svenska för ${testRelease.name}.`;
    
    const tutorialResponse = await createResponse(tutorialPrompt, {
      model: 'gpt-4o',
      maxTokens: 200,
      temperature: 0.7
    });
    
    console.log('✅ Tutorial-innehåll genererat:');
    console.log(`   Provider: ${tutorialResponse.provider.toUpperCase()}`);
    console.log(`   Innehåll: ${tutorialResponse.content.substring(0, 150)}...`);
    console.log('');
  } catch (error: any) {
    console.error(`❌ Fel i Test 3:`, error.message);
    console.log('');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Test av Responses API slutförd');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

// Kör testet
testResponsesAPI().catch(console.error);

