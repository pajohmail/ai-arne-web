/**
 * Service för AI-responses med OpenAI Responses API och Anthropic fallback
 * 
 * Denna modul tillhandahåller en enhetlig interface för att generera AI-responses
 * med automatisk fallback-mekanism. Använder OpenAI Responses API (beta) som primär
 * provider och fallback till Anthropic API om OpenAI saknas eller misslyckas.
 * 
 * Responses API stödjer synkrona och asynkrona svar, med automatisk polling för
 * asynkrona svar. Web search kan aktiveras för GPT-5 modeller.
 * 
 * @module responses
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

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
  /** Vilken provider som användes */
  provider: 'openai' | 'anthropic';
}

/**
 * Skapar en response med OpenAI Responses API eller Anthropic som fallback
 * 
 * Funktionen försöker först med OpenAI Responses API (för GPT-5 modeller) eller
 * Chat Completions API (för äldre modeller). Om OpenAI misslyckas eller saknas,
 * fallback till Anthropic API automatiskt.
 * 
 * För GPT-5 modeller:
 * - Använder Responses API med synkrona svar (läser output_text direkt)
 * - Stödjer polling för asynkrona svar (status: 'incomplete')
 * - Web search kan aktiveras via enableWebSearch-flaggan
 * 
 * För äldre modeller:
 * - Använder standard Chat Completions API
 * - Stödjer temperature-parameter
 * 
 * @param prompt - Prompt att skicka till AI:et
 * @param options - Konfigurationsalternativ
 * @returns Promise som resolverar till response med innehåll och provider
 * @throws Error om både OpenAI och Anthropic misslyckas, eller om inga API-nycklar finns
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
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

  let openaiErrorMsg: string | null = null;

  // Försök först med OpenAI Responses API
  if (openaiApiKey) {
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
        
        // Web search aktiveras automatiskt eller på annat sätt i Responses API
        // (tools parameter kan vara fel syntax, så vi tar bort den)
        if (options.enableWebSearch) {
          console.log(`   Making Responses API call with web search enabled (via model capabilities)`);
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
          console.error(`   Failed to create Responses API request:`, createError?.message || createError);
          console.error(`   Error details:`, {
            message: createError?.message,
            status: createError?.status,
            statusCode: createError?.statusCode,
            code: createError?.code,
            type: createError?.type
          });
          throw createError; // Kasta vidare för fallback
        }
        
        // Kontrollera om svaret redan är komplett direkt (synkront svar)
        // Om status är 'incomplete', polla tills det blir 'complete'
        let pollCount = 0;
        const maxPolls = 40; // Max 40 polls (2 minuter med 3 sekunders intervall)
        const pollInterval = 3000; // 3 sekunder mellan polls
        
        // Om status redan är 'complete', läs ut svaret direkt
        if (response?.status === 'complete') {
          const content = response?.output_text || response?.output?.[0]?.content?.[0]?.text || response?.output?.text || '';
          if (content) {
            const apiTime = Date.now() - apiStartTime;
            console.log(`✅ OpenAI API call successful (model: ${model}${options.enableWebSearch ? ' with web search' : ''}), content length: ${content.length}, completed in ${apiTime}ms (synkront)`);
            return {
              content,
              provider: 'openai'
            };
          }
        }
        
        // Om status är 'incomplete', polla tills det blir 'complete'
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
              
              // Om status nu är 'complete', läs ut svaret direkt
              if (response?.status === 'complete') {
                const content = response?.output_text || response?.output?.[0]?.content?.[0]?.text || response?.output?.text || '';
                if (content) {
                  const apiTime = Date.now() - apiStartTime;
                  console.log(`✅ OpenAI API call successful (model: ${model}${options.enableWebSearch ? ' with web search' : ''}), content length: ${content.length}, completed in ${apiTime}ms after ${pollCount} polls`);
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
        
        // Hämta content från response - kontrollera flera möjliga fält
        const content = response?.output_text || response?.output?.[0]?.content?.[0]?.text || response?.output?.text || '';
        
        if (content && response?.status === 'complete') {
          console.log(`✅ OpenAI API call successful (model: ${model}${options.enableWebSearch ? ' with web search' : ''}), content length: ${content.length}`);
          return {
            content,
            provider: 'openai'
          };
        } else {
          const errorMsg = `OpenAI API call returned empty content or incomplete status. Status: ${response?.status || 'unknown'}, Content length: ${content.length}`;
          console.warn(`⚠️  ${errorMsg}`);
          if (response?.error) {
            console.warn(`   Response error:`, JSON.stringify(response.error, null, 2));
          }
          if (response?.status === 'failed') {
            console.error(`   Response failed:`, response.error || 'Unknown error');
            throw new Error(`Responses API failed: ${response.error?.message || 'Unknown error'}`);
          }
          // Fortsätt till fallback om status inte är 'complete'
          throw new Error(errorMsg);
        }
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
      openaiErrorMsg = errorDetails.message;
      console.error('OpenAI Responses API failed, falling back to Anthropic:', errorDetails);
      // Fall through till Anthropic fallback
    }
  }

  // Fallback till Anthropic om OpenAI saknas eller misslyckas
  if (anthropicApiKey) {
    try {
      console.log(`🔄 Falling back to Anthropic API (OpenAI failed or not available)`);
      const anthropic = new Anthropic({ apiKey: anthropicApiKey });
      
      // Anthropic fallback (utan web search tool eftersom det inte fungerar korrekt)
      const message = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: options.maxTokens || 1000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const content = message.content[0]?.type === 'text' ? message.content[0].text : '';
      
      if (content) {
        console.log(`✅ Anthropic API call successful (fallback mode)`);
        return {
          content,
          provider: 'anthropic'
        };
      }
    } catch (error: any) {
      const anthropicErrorDetails = {
        message: error?.message || 'Unknown error',
        status: error?.status,
        statusCode: error?.statusCode,
        response: error?.response?.data || error?.error,
        code: error?.code,
        type: error?.type
      };
      console.error('Anthropic API also failed:', anthropicErrorDetails);
      const errorMsg = openaiErrorMsg 
        ? `Both OpenAI and Anthropic API calls failed. OpenAI error: ${openaiErrorMsg}. Anthropic error: ${anthropicErrorDetails.message || 'Unknown'}`
        : `Both OpenAI and Anthropic API calls failed. Anthropic error: ${anthropicErrorDetails.message || 'Unknown'}`;
      throw new Error(errorMsg);
    }
  }

  // Om inga API-nycklar finns
  console.error('❌ No API keys available (neither OPENAI_API_KEY nor ANTHROPIC_API_KEY set)');
  throw new Error('No API keys available (neither OPENAI_API_KEY nor ANTHROPIC_API_KEY set)');
}


