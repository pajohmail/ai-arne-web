/**
 * Service för AI-responses med OpenAI Responses API
 * 
 * Denna modul tillhandahåller en enhetlig interface för att generera AI-responses
 * med OpenAI. Använder OpenAI Responses API (beta) för GPT-5 modeller och
 * Chat Completions API för äldre modeller.
 * 
 * Responses API stödjer synkrona och asynkrona svar, med automatisk polling för
 * asynkrona svar. Web search kan aktiveras för GPT-5 modeller.
 * 
 * @module responses
 */

import OpenAI from 'openai';

/**
 * Konfigurationsalternativ för AI-responses
 */
export interface ResponsesAPIOptions {
  /** Modell att använda (default: 'gpt-5-mini') */
  model?: string;
  /** Max antal tokens i responsen */
  maxTokens?: number;
  /** Temperatur för kreativitet (0-1, stöds inte för Responses API) */
  temperature?: number;
  /** Aktivera web search för GPT-5 modeller */
  enableWebSearch?: boolean;
}

/**
 * Response från AI-API:et
 */
export interface ResponsesAPIResponse {
  /** Genererat innehåll från AI */
  content: string;
  /** Provider (alltid 'openai') */
  provider: 'openai';
}

/**
 * Helper-funktion för att extrahera textinnehåll från Responses API response
 * 
 * @param response - Response-objekt från Responses API
 * @returns Extraherad text eller tom sträng
 */
function extractContent(response: any): string {
  return (
    response?.output_text ||
    response?.output?.[0]?.content?.[0]?.text ||
    response?.output?.text ||
    ''
  );
}

/**
 * Skapar en response med OpenAI Responses API eller Chat Completions API
 * 
 * Funktionen använder OpenAI Responses API för GPT-5 modeller eller
 * Chat Completions API för äldre modeller.
 * 
 * För GPT-5 modeller:
 * - Använder Responses API med synkrona svar (läser output_text direkt)
 * - Stödjer polling för asynkrona svar (status: 'incomplete')
 * - Web search kan aktiveras via enableWebSearch-flaggan
 * - Temperature stöds INTE för Responses API
 * 
 * För äldre modeller (gpt-4.1, etc.):
 * - Använder standard Chat Completions API
 * - Stödjer temperature-parameter
 * 
 * @param prompt - Prompt att skicka till AI:et
 * @param options - Konfigurationsalternativ
 * @returns Promise som resolverar till response med innehåll och provider
 * @throws Error om OpenAI misslyckas eller om API-nyckel saknas
 * 
 * @example
 * // Enkel användning med default-inställningar
 * const response = await createResponse('Skriv en kort artikel om AI');
 * console.log(response.content);
 * 
 * @example
 * // Med web search aktiverat
 * const response = await createResponse('Vad är senaste nytt om GPT-5?', {
 *   model: 'gpt-5',
 *   maxTokens: 2000,
 *   enableWebSearch: true
 * });
 */
export async function createResponse(
  prompt: string,
  options: ResponsesAPIOptions = {}
): Promise<ResponsesAPIResponse> {
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY is not set. Please configure OpenAI API key.');
  }

  try {
    console.log(`🔑 Attempting OpenAI API call (model: ${options.model || 'gpt-5-mini'})`);
    const openai = new OpenAI({ apiKey: openaiApiKey });
    
    const model = options.model || 'gpt-5-mini';
    const isGpt5Model = model === 'gpt-5' || model === 'gpt-5-mini';
    
    // Använd Responses API för gpt-5 modeller, annars chat.completions
    if (isGpt5Model) {
      // Responses API syntax för gpt-5/gpt-5-mini (enligt OpenAI dokumentation)
      const requestOptions: any = {
        model,
        input: prompt
      };
      
      // Responses API använder max_output_tokens
      if (options.maxTokens) {
        requestOptions.max_output_tokens = options.maxTokens;
      }
      
      // Temperature stöds INTE med Responses API - kommenterat ut
      // if (options.temperature !== undefined) {
      //   requestOptions.temperature = options.temperature;
      // }
      
      // Lägg till reasoning och text parametrar enligt OpenAI dokumentation
      requestOptions.reasoning = { effort: 'low' }; // Snabbare svar
      requestOptions.text = { verbosity: 'low' }; // Kortare svar
      
      // Web search aktiveras via tools-parameter enligt OpenAI dokumentation
      // https://platform.openai.com/docs/guides/responses#web-search
      if (options.enableWebSearch) {
        requestOptions.tools = [{ type: 'web_search_preview' }];
        console.log(`   Making Responses API call with web search enabled (tools: web_search_preview)`);
      } else {
        console.log(`   Making Responses API call`);
      }
      
      const apiStartTime = Date.now();
      let response: any;
      
      try {
        // Skapa initial response - Responses API är synkront i standardläget
        response = await (openai as any).responses.create(requestOptions);
        console.log(`   Initial response received, status: ${response?.status || 'unknown'}, id: ${response?.id || 'none'}`);
        
        // Validera att response finns
        if (!response) {
          throw new Error('No response received from Responses API');
        }
      } catch (createError: any) {
        const errorDetails = {
          message: createError?.message || String(createError),
          status: createError?.status,
          statusCode: createError?.statusCode,
          code: createError?.code,
          type: createError?.type,
          response: createError?.response?.data || createError?.error || null
        };
        console.error(`   ❌ Failed to create Responses API request:`, errorDetails.message);
        console.error(`   Error details:`, JSON.stringify(errorDetails, null, 2));
        if (errorDetails.response) {
          console.error(`   API Response:`, JSON.stringify(errorDetails.response, null, 2));
        }
        throw createError; // Kasta vidare för fallback
      }
      
      // Kontrollera om svaret redan är komplett direkt (synkront svar)
      // Om status är 'incomplete', polla tills det blir 'completed'
      // Med web search kan det ta längre tid, så vi ökar max polls
      let pollCount = 0;
      const maxPolls = options.enableWebSearch ? 120 : 40; // 6 minuter med web search, 2 minuter utan
      const pollInterval = 3000; // 3 sekunder mellan polls
      
      // Om status redan är 'completed', läs ut svaret direkt
      if (response?.status === 'completed') {
        const content = extractContent(response);
        if (content) {
          const apiTime = Date.now() - apiStartTime;
          console.log(`✅ OpenAI API call successful (model: ${model}${options.enableWebSearch ? ' with web search' : ''}), content length: ${content.length}, completed in ${apiTime}ms (synkront)`);
          return {
            content,
            provider: 'openai'
          };
        }
      }
      
      // Om status är 'incomplete', polla tills det blir 'completed'
      while (response && response.status === 'incomplete' && pollCount < maxPolls) {
        pollCount++;
        console.log(`   Polling response (attempt ${pollCount}/${maxPolls}), status: ${response.status}`);
        
        // Vänta innan nästa poll
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        
        // Hämta uppdaterad response med response ID
        if (response?.id) {
          try {
            response = await (openai as any).responses.retrieve(response.id);
            console.log(`   Poll ${pollCount} result: status=${response?.status || 'unknown'}`);
            
            const content = extractContent(response);
            
            // 1) Om nu completed → klart, returnera direkt
            if (response?.status === 'completed' && content) {
              const apiTime = Date.now() - apiStartTime;
              console.log(`✅ OpenAI API call successful (model: ${model}${options.enableWebSearch ? ' with web search' : ''}), content length: ${content.length}, completed in ${apiTime}ms after ${pollCount} polls`);
              return {
                content,
                provider: 'openai'
              };
            }
            
            // 2) Om incomplete pga max_output_tokens → använd det som finns
            if (response?.status === 'incomplete' && response?.incomplete_details?.reason === 'max_output_tokens') {
              // Logga mer information för debugging
              console.warn(`⚠️  max_output_tokens reached after ${pollCount} polls. Checking for content...`);
              console.warn(`   Content length: ${content.length}, has output_text: ${!!response?.output_text}, has output: ${!!response?.output}`);
              if (response?.output) {
                console.warn(`   Output structure:`, JSON.stringify({
                  type: typeof response.output,
                  isArray: Array.isArray(response.output),
                  keys: response.output && typeof response.output === 'object' ? Object.keys(response.output) : 'N/A',
                  length: Array.isArray(response.output) ? response.output.length : 'N/A'
                }, null, 2));
              }
              
              if (content && content.length > 0) {
                console.warn(`⚠️  max_output_tokens reached after ${pollCount} polls, using partial content (${content.length} chars)`);
                const apiTime = Date.now() - apiStartTime;
                return {
                  content,
                  provider: 'openai'
                };
              } else {
                // Här har modellen bokstavligen inte hunnit producera text innan taket – inget att jobba med
                // Men logga mer information för debugging
                console.error(`❌ max_output_tokens reached but no content found. Response structure:`, JSON.stringify({
                  status: response?.status,
                  hasOutputText: !!response?.output_text,
                  hasOutput: !!response?.output,
                  outputType: typeof response?.output,
                  incompleteDetails: response?.incomplete_details
                }, null, 2));
                throw new Error(`Responses API hit max_output_tokens before any output was produced.`);
              }
            }
            
            // 3) Partial content fallback efter 20 polls (för andra orsaker till incomplete)
            if (response?.status === 'incomplete') {
              if (content && content.length > 100 && pollCount >= 20) {
                console.warn(`⚠️  Using partial content from incomplete response after ${pollCount} polls (${content.length} chars)`);
                const apiTime = Date.now() - apiStartTime;
                return {
                  content,
                  provider: 'openai'
                };
              }
            }
          } catch (pollError: any) {
            console.error(`   Poll error on attempt ${pollCount}:`, pollError?.message);
            console.error(`   Poll error details:`, {
              message: pollError?.message,
              status: pollError?.status,
              statusCode: pollError?.statusCode
            });
            break;
          }
        } else {
          console.warn(`   No response ID found, cannot poll further`);
          break;
        }
      }
      
      const apiTime = Date.now() - apiStartTime;
      console.log(`   Responses API call completed in ${apiTime}ms after ${pollCount} polls`);
      console.log(`   Final response status: ${response?.status || 'unknown'}`);
      console.log(`   Response keys: ${response ? Object.keys(response).join(', ') : 'none'}`);
      
      // Hämta content från response
      const content = extractContent(response);
      
      // Om completed – använd
      if (content && response?.status === 'completed') {
        console.log(`✅ OpenAI API call successful (model: ${model}${options.enableWebSearch ? ' with web search' : ''}), content length: ${content.length}`);
        return {
          content,
          provider: 'openai'
        };
      }
      
      // Om vi inte har content, kolla om det finns ett fel
      if (response?.status === 'failed') {
        const failError = response.error?.message || JSON.stringify(response.error) || 'Unknown error';
        console.error(`   Response failed:`, failError);
        throw new Error(`Responses API failed: ${failError}`);
      }
      
      // Om incomplete + max_output_tokens – sista chans att använda innehåll
      if (response?.status === 'incomplete' && response?.incomplete_details) {
        const incompleteReason = response.incomplete_details?.reason || 'unknown';
        console.error(`❌ Response incomplete after ${pollCount} polls. Details:`, JSON.stringify(response.incomplete_details, null, 2));
        
        if (incompleteReason === 'max_output_tokens' && content && content.length > 0) {
          console.warn(`⚠️  max_output_tokens reached, but using partial content (${content.length} chars) instead of failing`);
          return {
            content,
            provider: 'openai'
          };
        }
        
        // Annars, kasta fel
        const errorMsg = `OpenAI API call timed out or incomplete. Status: incomplete after ${pollCount} polls (${Math.round((Date.now() - apiStartTime) / 1000)}s). Incomplete details: ${JSON.stringify(response.incomplete_details)}`;
        throw new Error(errorMsg);
      }
      
      // Annars, generellt fel
      const errorMsg = `OpenAI API call returned empty content or incomplete status. Status: ${response?.status || 'unknown'}, Content length: ${content.length}, Polls: ${pollCount}`;
      console.error(`❌ ${errorMsg}`);
      console.error(`   Full response structure:`, JSON.stringify({
        status: response?.status,
        hasOutputText: !!response?.output_text,
        hasOutput: !!response?.output,
        outputKeys: response?.output ? Object.keys(response.output) : [],
        error: response?.error,
        incompleteDetails: response?.incomplete_details
      }, null, 2));
      if (response?.error) {
        console.error(`   Response error:`, JSON.stringify(response.error, null, 2));
      }
      throw new Error(errorMsg);
    } else {
      // Chat completions API för äldre modeller
      const requestOptions: any = {
        model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.7
      };
      
      const response = await openai.chat.completions.create(requestOptions);
      const content = response.choices[0]?.message?.content || '';
      
      if (content) {
        console.log(`✅ OpenAI API call successful (model: ${model})`);
        return {
          content,
          provider: 'openai'
        };
      } else {
        throw new Error('OpenAI Chat Completions API returned empty content');
      }
    }
  } catch (error: any) {
    const errorDetails = {
      message: error?.message || 'Unknown error',
      status: error?.status,
      statusCode: error?.statusCode,
      response: error?.response?.data || error?.error,
      code: error?.code,
      type: error?.type,
      fullError: JSON.stringify(error, Object.getOwnPropertyNames(error))
    };
    console.error('❌ OpenAI API call failed:', errorDetails);
    throw new Error(`OpenAI API call failed: ${errorDetails.message || 'Unknown error'}`);
  }
}


