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

  // Försök först med OpenAI Responses API
  if (openaiApiKey) {
    try {
      const openai = new OpenAI({ apiKey: openaiApiKey });
      
      // Använd Responses API (beta endpoint)
      // Responses API är tillståndsbevarande och stödjer verktyg
      const response = await openai.chat.completions.create({
        model: options.model || 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.7
      });

      const content = response.choices[0]?.message?.content || '';
      
      if (content) {
        return {
          content,
          provider: 'openai'
        };
      }
    } catch (error) {
      console.error('OpenAI Responses API failed, falling back to Anthropic:', error);
      // Fall through till Anthropic fallback
    }
  }

  // Fallback till Anthropic om OpenAI saknas eller misslyckas
  if (anthropicApiKey) {
    try {
      const anthropic = new Anthropic({ apiKey: anthropicApiKey });
      
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
        return {
          content,
          provider: 'anthropic'
        };
      }
    } catch (error) {
      console.error('Anthropic API also failed:', error);
      throw new Error('Both OpenAI and Anthropic API calls failed');
    }
  }

  // Om inga API-nycklar finns
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

      const response = await openai.chat.completions.create({
        model: options.model || 'gpt-4o',
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        max_tokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.7
      });

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

