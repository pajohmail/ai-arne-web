import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

/**
 * Helper för OpenAI Responses API (beta)
 * Använder Responses API för tillståndsbevarande konversationer
 * Fallback till Anthropic om OpenAI API-nyckel saknas eller misslyckas
 */

export interface ResponsesAPIOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  enableWebSearch?: boolean; // Aktivera web search för Responses API
}

export interface ResponsesAPIResponse {
  content: string;
  provider: 'openai' | 'anthropic';
}

/**
 * Skapar en response med OpenAI Responses API eller Anthropic som fallback
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
        // Responses API syntax för gpt-5/gpt-5-mini
        const requestOptions: any = {
          model,
          input: prompt
        };
        
        // Responses API använder max_output_tokens
        if (options.maxTokens) {
          requestOptions.max_output_tokens = options.maxTokens;
        }
        
        // Temperature för kreativitet (om angiven)
        if (options.temperature !== undefined) {
          requestOptions.temperature = options.temperature;
        }
        
        // Aktivera web search om det är begärt
        if (options.enableWebSearch) {
          requestOptions.tools = [{ type: 'web_search_preview' }];
          console.log(`   Making Responses API call with web_search_preview tool enabled`);
        } else {
          console.log(`   Making Responses API call`);
        }
        
        const apiStartTime = Date.now();
        let response: any;
        
        try {
          // Skapa initial response
          response = await (openai as any).responses.create(requestOptions);
          console.log(`   Initial response received, status: ${response?.status || 'unknown'}, id: ${response?.id || 'none'}`);
          
          // Validera att response finns och har id
          if (!response) {
            throw new Error('No response received from Responses API');
          }
          
          if (!response.id) {
            console.warn(`   Warning: Response missing ID, may not be able to poll`);
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
        
        // Responses API är asynkront - polla tills status är "complete"
        let pollCount = 0;
        const maxPolls = 60; // Max 60 polls (5 minuter med 5 sekunders intervall)
        const pollInterval = 5000; // 5 sekunder mellan polls
        
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
        const content = response?.output_text || response?.output?.text || response?.output_text || '';
        
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

/**
 * Skapar en response med Responses API för tillståndsbevarande konversationer
 * Använder conversation_id för att hålla state mellan anrop
 */
export async function createResponseWithContext(
  prompt: string,
  conversationId: string | null = null,
  previousMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  options: ResponsesAPIOptions = {}
): Promise<ResponsesAPIResponse & { conversationId: string }> {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

  // Försök först med OpenAI Responses API
  if (openaiApiKey) {
    try {
      const openai = new OpenAI({ apiKey: openaiApiKey });
      
      // Bygg message history med tidigare meddelanden
      const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
        ...previousMessages,
        { role: 'user', content: prompt }
      ];

      const model = options.model || 'gpt-5-mini';
      const isGpt5Model = model === 'gpt-5' || model === 'gpt-5-mini';
      
      // Använd Responses API för gpt-5 modeller, annars chat.completions
      if (isGpt5Model) {
        // Responses API syntax för gpt-5/gpt-5-mini
        // Bygg input från message history
        const inputText = messages.map(msg => {
          if (msg.role === 'user') {
            return `User: ${msg.content}`;
          } else {
            return `Assistant: ${msg.content}`;
          }
        }).join('\n\n');
        
        const requestOptions: any = {
          model,
          input: inputText
        };
        
        // Responses API använder max_output_tokens
        if (options.maxTokens) {
          requestOptions.max_output_tokens = options.maxTokens;
        }
        
        const response = await (openai as any).responses.create(requestOptions);
        const content = response.output_text || '';
        
        if (content) {
          // Generera ett nytt conversation ID om det inte finns
          const newConversationId = conversationId || `conv_${Date.now()}_${Math.random().toString(36).substring(7)}`;
          
          return {
            content,
            provider: 'openai',
            conversationId: newConversationId
          };
        }
      } else {
        // Chat completions API för äldre modeller
        const requestOptions: any = {
          model,
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          max_tokens: options.maxTokens || 1000,
          temperature: options.temperature || 0.7
        };
        
        const response = await openai.chat.completions.create(requestOptions);
        const content = response.choices[0]?.message?.content || '';
        
        if (content) {
          // Generera ett nytt conversation ID om det inte finns
          const newConversationId = conversationId || `conv_${Date.now()}_${Math.random().toString(36).substring(7)}`;
          
          return {
            content,
            provider: 'openai',
            conversationId: newConversationId
          };
        }
      }
    } catch (error) {
      console.error('OpenAI Responses API failed, falling back to Anthropic:', error);
      // Fall through till Anthropic fallback
    }
  }

  // Fallback till Anthropic (som inte har conversation_id men kan hantera message history)
  if (anthropicApiKey) {
    try {
      const anthropic = new Anthropic({ apiKey: anthropicApiKey });
      
      // Bygg message history för Anthropic
      const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
        ...previousMessages,
        { role: 'user', content: prompt }
      ];

      const message = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: options.maxTokens || 1000,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      });

      const content = message.content[0]?.type === 'text' ? message.content[0].text : '';
      
      if (content) {
        const newConversationId = conversationId || `conv_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        
        return {
          content,
          provider: 'anthropic',
          conversationId: newConversationId
        };
      }
    } catch (error) {
      console.error('Anthropic API also failed:', error);
      throw new Error('Both OpenAI and Anthropic API calls failed');
    }
  }

  throw new Error('No API keys available');
}

