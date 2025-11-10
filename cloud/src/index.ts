import { runApiNewsManager } from './agents/manager.js';
import { runGeneralNewsManager } from './agents/generalNewsManager.js';
import { createResponse } from './services/responses.js';
import { saveUserQuestion } from './services/upsert.js';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

export async function apiNewsHandler(req: any, res: any) {
  try {
    const force = req.query?.force === '1' || req.body?.force === true;
    const result = await runApiNewsManager({ force });
    return res.status(200).json({ ok: true, ...result });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ ok: false, error: err?.message || 'unknown error' });
  }
}

export async function generalNewsHandler(req: any, res: any) {
  try {
    const force = req.query?.force === '1' || req.body?.force === true;
    const result = await runGeneralNewsManager({ force });
    return res.status(200).json({ ok: true, ...result });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ ok: false, error: err?.message || 'unknown error' });
  }
}

// Behåll för bakåtkompatibilitet - kör både API-nyheter och generella nyheter
export async function managerHandler(req: any, res: any) {
  try {
    const force = req.query?.force === '1' || req.body?.force === true;
    
    // Kör både API-nyheter och generella nyheter
    const [apiResult, generalResult] = await Promise.allSettled([
      runApiNewsManager({ force }),
      runGeneralNewsManager({ force })
    ]);
    
    const apiNews = apiResult.status === 'fulfilled' ? apiResult.value : { processed: 0, error: apiResult.reason?.message };
    const generalNews = generalResult.status === 'fulfilled' ? generalResult.value : { processed: 0, error: generalResult.reason?.message };
    
    return res.status(200).json({ 
      ok: true, 
      apiNews: apiNews,
      generalNews: generalNews,
      totalProcessed: (apiNews.processed || 0) + (generalNews.processed || 0)
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ ok: false, error: err?.message || 'unknown error' });
  }
}

/**
 * Chat handler för att hantera användarfrågor om AI-nyheter
 * Använder Responses API för att generera underhållande svar med ironi
 */
export async function chatHandler(req: any, res: any) {
  const startTime = Date.now();
  console.log(`🚀 Chat handler started at ${new Date().toISOString()}`);
  
  try {
    const { question, sessionId } = req.body || {};
    
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Frågan saknas eller är ogiltig' 
      });
    }

    const trimmedQuestion = question.trim();
    console.log(`📝 Received question: "${trimmedQuestion.substring(0, 100)}..."`);
    
    // Validera att frågan är AI-relaterad genom att fråga AI själv
    const validateWithAI = async (q: string): Promise<boolean> => {
      const validationPrompt = `Är följande fråga relaterad till AI (artificiell intelligens), maskininlärning, teknologi, tech-företag eller AI-utveckling?

Fråga: "${q}"

Svara ENDAST med "JA" eller "NEJ" utan någon förklaring.`;

      try {
        const validationResponse = await createResponse(validationPrompt, {
          model: 'gpt-5-mini',
          maxTokens: 10,
          temperature: 0.1
        });
        
        console.log(`   Validation API call successful using ${validationResponse.provider} API`);

        const answer = validationResponse.content.trim().toLowerCase();
        // Acceptera "ja", "yes", "j", "y" eller varianter
        return answer.startsWith('ja') || answer.startsWith('yes') || answer === 'j' || answer === 'y';
      } catch (err: any) {
        console.error('❌ Validation error:', err);
        console.error(`   Error details: ${err?.message || 'Unknown error'}`);
        // Vid fel, tillåt frågan (fail-open för bättre användarupplevelse)
        return true;
      }
    };

    // Validera frågan med AI
    console.log(`💬 Validating question: "${trimmedQuestion.substring(0, 50)}..."`);
    const isAiRelated = await validateWithAI(trimmedQuestion);
    console.log(`   Validation result: ${isAiRelated ? '✅ AI-related' : '❌ Not AI-related'}`);
    
    if (!isAiRelated) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Frågan måste vara relaterad till AI, teknologi eller tech-företag. Försök igen med en relevant fråga.' 
      });
    }

    // Skapa prompt med underhållande ton och ironi
    console.log(`🤖 Generating chat response for question: "${trimmedQuestion.substring(0, 50)}..."`);
    const currentDate = new Date().toLocaleDateString('sv-SE', { year: 'numeric', month: 'long', day: 'numeric' });
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    
    const prompt = `Du är en AI-nyhetsexpert som svarar på frågor om AI-nyheter och utveckling på ett underhållande sätt med en tydlig touch av ironi och svenska humor. Använd ironi och svenska humor flitigt genom hela svaret.

VIKTIGT - DAGENS DATUM: ${currentDate} (${currentYear}-${String(currentMonth).padStart(2, '0')})

Frågan: ${trimmedQuestion}

KRITISKA INSTRUKTIONER - LÄS NOGA:
1. Du HAR tillgång till websökningar - använd dem för att hitta de SENASTE nyheterna från ${currentYear}
2. Gör websökningar för att hitta aktuell information om ämnet
3. Prioritera information från de senaste 3 månaderna (${currentYear})
4. Inkludera länkar och källor från dina websökningar
5. Om informationen är äldre än 6 månader, markera det tydligt
6. Din träningsdata slutar typ april 2024 - använd websökningar för aktuell information

VIKTIGT: Skriv MINST 500 ord. Var inte kortfattad. Undvik korta svar. Var detaljerad och utförlig.

STEG-FÖR-STEG PROCESS:
1. Gör först en websökning om ämnet för att hitta de senaste nyheterna från ${currentYear}
2. Hitta minst 3-5 aktuella källor från de senaste 3 månaderna
3. Basera ditt svar PRIMÄRT på dessa websökningar
4. Inkludera länkar till källorna du hittar
5. Om informationen är äldre än 6 månader, markera det tydligt

Svara på svenska med:
- Ett engagerande och underhållande svar med en tydlig ironisk touch genom hela texten
- En detaljerad och informativ förklaring baserat på AKTUELL information från websökningar (MINST 500 ord)
- Specifika länkar och källor från dina websökningar
- Datum för när informationen är från (prioritera senaste 3 månaderna från ${currentYear})
- Om informationen är äldre, markera det tydligt
- Relevant information om AI-utveckling och nyheter, inklusive kontext och historik när det är lämpligt

Kom ihåg: Använd websökningar för att hitta aktuell information från ${currentYear}. Prioritera information från de senaste 3 månaderna och inkludera länkar till källorna.

Skriv en längre, mer detaljerad artikel (MINST 500 ord, gärna 600-800 ord) som är både informativ och underhållande. Var inte rädd för att vara långrandig - läsaren vill ha djupgående information. Inkludera exempel, jämförelser och relevanta sammanhang. Använd ironi och svenska humor flitigt för att göra läsningen mer engagerande.`;

    // Prioritera OpenAI med web search för att generera svar
    // OpenAI har web_search_preview tool som fungerar bättre än Anthropic
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    let response;
    
    console.log(`🔍 API keys check - OpenAI: ${openaiApiKey ? '✅' : '❌'}, Anthropic: ${anthropicApiKey ? '✅' : '❌'}`);
    
    if (openaiApiKey) {
      console.log(`🌐 Using OpenAI API with web search enabled`);
      const openai = new OpenAI({ apiKey: openaiApiKey });
      
      try {
        // Använd Responses API med web_search_preview tool för web search
        // Responses API kräver gpt-5 modeller, inte gpt-4o
        console.log(`   Making OpenAI Responses API call with web_search_preview tool...`);
        const requestOptions: any = {
          model: 'gpt-5', // Responses API kräver gpt-5 modeller
          input: prompt,
          max_output_tokens: 2000,
          tools: [{ type: 'web_search_preview' }]
        };
        
        const apiStartTime = Date.now();
        let responseAPI = await (openai as any).responses.create(requestOptions);
        console.log(`   Initial response status: ${responseAPI?.status || 'unknown'}`);
        
        // Responses API är asynkront - polla tills status är "complete"
        let pollCount = 0;
        const maxPolls = 60; // Max 60 polls (5 minuter med 5 sekunders intervall)
        const pollInterval = 5000; // 5 sekunder mellan polls
        
        while (responseAPI?.status === 'incomplete' && pollCount < maxPolls) {
          pollCount++;
          console.log(`   Polling response (attempt ${pollCount}/${maxPolls}), status: ${responseAPI.status}`);
          
          // Vänta innan nästa poll
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          
          // Hämta uppdaterad response med response ID
          if (responseAPI?.id) {
            try {
              responseAPI = await (openai as any).responses.retrieve(responseAPI.id);
            } catch (pollError: any) {
              console.error(`   Poll error:`, pollError?.message);
              break;
            }
          } else {
            console.warn(`   No response ID found, cannot poll`);
            break;
          }
        }
        
        const apiTime = Date.now() - apiStartTime;
        console.log(`   Responses API call completed in ${apiTime}ms after ${pollCount} polls`);
        console.log(`   Final response status: ${responseAPI?.status || 'unknown'}`);
        
        // Hämta content från response
        const content = responseAPI?.output_text || responseAPI?.output?.text || '';
        
        if (content && responseAPI?.status === 'complete') {
          console.log(`✅ OpenAI Responses API call successful with web search, content length: ${content.length}`);
          response = {
            content,
            provider: 'openai' as const
          };
        } else {
          console.warn(`⚠️  OpenAI API call returned empty content or incomplete status. Status: ${responseAPI?.status}, Content length: ${content.length}`);
          if (responseAPI?.error) {
            console.warn(`   Response error:`, responseAPI.error);
          }
          throw new Error(`OpenAI Responses API returned incomplete status: ${responseAPI?.status || 'unknown'}`);
        }
      } catch (error: any) {
        console.error('❌ OpenAI API failed:', error?.message || error);
        console.error('   Error details:', JSON.stringify({
          message: error?.message,
          status: error?.status,
          statusCode: error?.statusCode,
          type: error?.type,
          code: error?.code
        }, null, 2));
        
        // Fallback till Anthropic om OpenAI misslyckas
        if (anthropicApiKey) {
          console.log(`🔄 Falling back to Anthropic...`);
          const anthropic = new Anthropic({ apiKey: anthropicApiKey });
          try {
            const message = await anthropic.messages.create({
              model: 'claude-3-5-sonnet-20241022',
              max_tokens: 2000,
              messages: [{
                role: 'user',
                content: prompt
              }]
            });
            const anthropicContent = message.content[0]?.type === 'text' ? message.content[0].text : '';
            if (anthropicContent) {
              response = {
                content: anthropicContent,
                provider: 'anthropic' as const
              };
            } else {
              throw new Error('No content in Anthropic response');
            }
          } catch (anthropicError: any) {
            console.error('❌ Anthropic fallback also failed:', anthropicError?.message);
            throw error; // Throw original OpenAI error
          }
        } else {
          throw error;
        }
      }
    } else if (anthropicApiKey) {
      console.log(`⚠️  OpenAI API key not found, using Anthropic`);
      // Använd Anthropic om OpenAI inte är tillgänglig
      const anthropic = new Anthropic({ apiKey: anthropicApiKey });
      try {
        const message = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 2000,
          messages: [{
            role: 'user',
            content: prompt
          }]
        });
        const content = message.content[0]?.type === 'text' ? message.content[0].text : '';
        if (content) {
          response = {
            content,
            provider: 'anthropic' as const
          };
        } else {
          throw new Error('No content in Anthropic response');
        }
      } catch (error: any) {
        console.error('❌ Anthropic API failed:', error?.message);
        throw error;
      }
    } else {
      throw new Error('No API keys available');
    }
    
    const contentLength = response.content.length;
    const wordCount = response.content.split(/\s+/).length;
    
    console.log(`✅ Chat response generated using ${response.provider.toUpperCase()} API`);
    console.log(`   Content length: ${contentLength} chars, ~${wordCount} words`);
    
    if (wordCount < 400) {
      console.warn(`⚠️  WARNING: Generated response is shorter than expected (${wordCount} words, expected 500+)`);
    }

    // Spara frågan i Firestore (inte svaret)
    try {
      await saveUserQuestion(trimmedQuestion, sessionId);
    } catch (saveError) {
      console.error('Failed to save question to Firestore:', saveError);
      // Fortsätt ändå, sparandet är inte kritiskt
    }

    const totalTime = Date.now() - startTime;
    console.log(`✅ Chat handler completed successfully in ${totalTime}ms`);
    
    return res.status(200).json({ 
      ok: true, 
      answer: response.content,
      provider: response.provider
    });
  } catch (err: any) {
    const totalTime = Date.now() - startTime;
    console.error(`❌ Chat handler error after ${totalTime}ms:`, err);
    
    // Hantera abort-signaler specifikt
    if (err?.name === 'AbortError' || err?.message?.includes('aborted') || err?.message?.includes('signal')) {
      console.error('⚠️  Request was aborted - likely timeout or client disconnect');
      return res.status(504).json({ 
        ok: false, 
        error: 'Request timeout - API-anropet tog för lång tid. Försök igen med en kortare fråga.',
        timeout: true
      });
    }
    
    const errorMessage = err?.message || 'Ett fel uppstod vid generering av svar';
    const errorDetails = {
      message: errorMessage,
      stack: err?.stack,
      name: err?.name,
      code: err?.code,
      fullError: JSON.stringify(err, Object.getOwnPropertyNames(err))
    };
    console.error('Chat handler error details:', errorDetails);
    
    return res.status(500).json({ 
      ok: false, 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
    });
  }
}
