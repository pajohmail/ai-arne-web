import { config } from 'dotenv';
import { createResponse } from './services/responses.js';

// Ladda miljövariabler
config();

/**
 * Diagnostikverktyg för att kontrollera API-nycklar och AI-koppling
 */
async function checkAPIKeys() {
  console.log('🔍 Kontrollerar API-nycklar och AI-koppling...\n');
  console.log('📅 Tidsstämpel:', new Date().toISOString());
  console.log('');

  // Kontrollera miljövariabler
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔧 API-nyckelkonfiguration:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  
  const openaiConfigured = openaiKey && openaiKey.length > 0 && !openaiKey.includes('...') && !openaiKey.includes('sk-...');
  const anthropicConfigured = anthropicKey && anthropicKey.length > 0 && !anthropicKey.includes('...') && !anthropicKey.includes('sk-ant-...');
  
  console.log(`   OPENAI_API_KEY: ${openaiConfigured ? '✅ Konfigurerad' : '❌ Saknas eller ogiltig'}`);
  if (openaiKey) {
    console.log(`      Längd: ${openaiKey.length} tecken`);
    console.log(`      Prefix: ${openaiKey.substring(0, 7)}...`);
  }
  
  console.log(`   ANTHROPIC_API_KEY: ${anthropicConfigured ? '✅ Konfigurerad' : '❌ Saknas eller ogiltig'}`);
  if (anthropicKey) {
    console.log(`      Längd: ${anthropicKey.length} tecken`);
    console.log(`      Prefix: ${anthropicKey.substring(0, 10)}...`);
  }
  console.log('');

  if (!openaiConfigured && !anthropicConfigured) {
    console.error('❌ INGA API-NYCKLAR KONFIGURERADE!');
    console.error('   Systemet kommer att misslyckas vid AI-anrop.');
    console.error('   Konfigurera minst en av OPENAI_API_KEY eller ANTHROPIC_API_KEY i .env-filen.');
    process.exit(1);
  }

  // Testa API-anrop
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 Testar API-anrop:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    const testPrompt = 'Skriv en kort mening på svenska om AI-utveckling.';
    console.log(`Prompt: "${testPrompt}"`);
    console.log('');
    
    const response = await createResponse(testPrompt, {
      model: 'gpt-5-mini',
      maxTokens: 100,
      temperature: 0.7
    });
    
    console.log(`✅ API-anrop lyckades!`);
    console.log(`   Provider: ${response.provider.toUpperCase()}`);
    console.log(`   Svar: ${response.content.substring(0, 100)}${response.content.length > 100 ? '...' : ''}`);
    console.log('');
    
    if (response.provider === 'anthropic') {
      console.log('⚠️  OBS: Systemet använder Anthropic API (fallback-läge)');
      console.log('   Detta betyder att OpenAI API-nyckeln saknas eller misslyckades.');
      if (openaiConfigured) {
        console.log('   OpenAI-nyckeln är konfigurerad men misslyckades - kontrollera att den är giltig.');
      } else {
        console.log('   Konfigurera OPENAI_API_KEY för att använda primär provider.');
      }
    } else {
      console.log('✅ Systemet använder OpenAI API (primär provider)');
    }
    console.log('');
    
  } catch (error: any) {
    console.error('❌ API-anrop misslyckades!');
    console.error(`   Fel: ${error.message}`);
    console.error('');
    console.error('   Detaljer:');
    console.error(`   - OpenAI konfigurerad: ${openaiConfigured ? 'Ja' : 'Nej'}`);
    console.error(`   - Anthropic konfigurerad: ${anthropicConfigured ? 'Ja' : 'Nej'}`);
    console.error('');
    process.exit(1);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Diagnostik slutförd');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

// Kör diagnostiken
checkAPIKeys().catch((error) => {
  console.error('❌ Oväntat fel:', error);
  process.exit(1);
});

