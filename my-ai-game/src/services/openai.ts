import OpenAI from 'openai';

// Error messages in Hebrew
export const ERROR_MESSAGES = {
  INVALID_KEY: 'מפתח API לא תקין. אנא בדוק את המפתח ב-.env',
  RATE_LIMIT: 'חרגת ממכסת הבקשות. נסה שוב בעוד כמה רגעים.',
  NETWORK_ERROR: 'שגיאת רשת. בדוק את החיבור לאינטרנט.',
  GENERIC_ERROR: 'אירעה שגיאה בשרת הבינה המלאכותית. נסה שוב.',
  MISSING_KEY: 'מפתח API חסר. הוסף את OPENAI_API_KEY ל-.env',
} as const;

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface SendMessageOptions {
  messages: ChatMessage[];
  scenarioContext?: string;
  onChunk?: (chunk: string) => void; // Callback for streaming chunks
}

/**
 * Check if we're in development mode
 * In development, we call OpenAI directly (for testing)
 * In production (Vercel), we use the secure API route
 */
const isDevelopment = import.meta.env.DEV;

/**
 * Create OpenAI client for development mode only
 */
function createDevOpenAIClient(): OpenAI {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.OPENAI_API_KEY;
  
  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    throw new Error(ERROR_MESSAGES.MISSING_KEY);
  }
  
  const baseURL = import.meta.env.VITE_OPENAI_BASE_URL || '/wix-openai/v1';
  
  // Convert relative URL to absolute
  const absoluteBaseURL = baseURL.startsWith('http') 
    ? baseURL 
    : new URL(baseURL, window.location.origin).toString();
  
  return new OpenAI({
    apiKey,
    baseURL: absoluteBaseURL,
    dangerouslyAllowBrowser: true, // Only for development!
  });
}

/**
 * Build system prompt for the AI
 */
function buildSystemPrompt(scenarioContext: string): string {
  return `אתה מנהל משחק הרפתקאות טקסט. ${scenarioContext}

תפקידך:
• כתוב תמיד בעברית בלבד
• תן תשובות יצירתיות ומעניינות שממשיכות את העלילה
• שמור על אווירת המשחק והתרחיש הספציפי
• היה תמציתי - 2-4 משפטים תיאוריים

ניהול פריטים:
כאשר השחקן מוצא, מקבל או אוסף פריט, ציין זאת בפורמט זה:
[קיבלת: emoji שם_פריט]

דוגמאות לפריטים:
[קיבלת: 🗝️ מפתח_זהב]
[קיבלת: 🍞 לחם_טרי]
[קיבלת: ⚔️ חרב_קסומה]
[קיבלת: 🧪 שיקוי_ריפוי] (פריט מרפא)

ניהול קרבות:
כאשר השחקן נתקל באויב או מצב של קרב, השתמש בפורמט זה:
[COMBAT: שם_האויב:emoji:בריאות]

דוגמאות לקרבות:
[COMBAT: זומבי רעב:🧟:20]
[COMBAT: שומר מכושף:⚔️:30]
[COMBAT: דרקון שחור:🐉:50]

הערות חשובות:
- השתמש בסמן COMBAT רק כאשר מדובר בקרב פיזי אמיתי
- לא כל עימות צריך להיות קרב - השתמש בשיקול דעת
- הקרב יהיה אינטראקטיבי, אז אל תתאר את תוצאת הקרב
- לאחר קרב, השחקן יספר לך מה קרה והמשך את הסיפור בהתאם

פורמט חובה לכל תשובה:
1. תיאור המצב/תגובה (2-4 משפטים)
2. אזכור פריטים חדשים (אם יש) בפורמט [קיבלת: emoji שם]
3. שורה ריקה
4. "מה תרצה לעשות?" או "אפשרויות:"
5. 2-3 פעולות מוצעות כנקודות עם אמוג'י רלוונטי

דוגמה:
אתה נכנס לחדר גדול. קירות האבן מכוסים בטחב ירוק זוהר. על השולחן מוצא אתה ספר עתיק.
[קיבלת: 📖 ספר_הקסמים]

מה תרצה לעשות?
📚 לקרוא בספר
🚪 לחפש דלת יציאה
🔍 לבדוק את הקירות הזוהרים`;
}

/**
 * Send message using direct OpenAI client (development only)
 */
async function sendMessageDirect(options: SendMessageOptions): Promise<string> {
  const { messages, scenarioContext, onChunk } = options;
  
  try {
    const client = createDevOpenAIClient();
    
    // Build full messages with system prompt
    const fullMessages: ChatMessage[] = scenarioContext
      ? [{ role: 'system', content: buildSystemPrompt(scenarioContext) }, ...messages]
      : messages;
    
    // Use streaming API
    const stream = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: fullMessages,
      temperature: 0.8,
      max_tokens: 400,
      stream: true,
    });
    
    let fullContent = '';
    
    // Process the stream chunk by chunk
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      
      if (delta) {
        fullContent += delta;
        
        if (onChunk) {
          onChunk(delta);
        }
      }
    }
    
    if (!fullContent) {
      throw new Error(ERROR_MESSAGES.GENERIC_ERROR);
    }
    
    return fullContent.trim();
    
  } catch (error: any) {
    if (error.message === ERROR_MESSAGES.MISSING_KEY) {
      throw error;
    }
    
    if (error.status === 401 || error.message?.includes('Incorrect API key')) {
      throw new Error(ERROR_MESSAGES.INVALID_KEY);
    }
    
    if (error.status === 429) {
      throw new Error(ERROR_MESSAGES.RATE_LIMIT);
    }
    
    if (error.message?.includes('fetch') || error.message?.includes('network')) {
      throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
    }
    
    if (import.meta.env.DEV) {
      console.error('OpenAI API Error:', error);
    }
    
    throw new Error(ERROR_MESSAGES.GENERIC_ERROR);
  }
}

/**
 * Send message via API route (production only)
 */
async function sendMessageViaAPI(options: SendMessageOptions): Promise<string> {
  const { messages, scenarioContext, onChunk } = options;
  
  try {
    // Call our secure API route
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        scenarioContext,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Handle SSE (Server-Sent Events) stream
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let fullContent = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;

      // Decode the chunk
      buffer += decoder.decode(value, { stream: true });
      
      // Split by newlines to process complete SSE messages
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6); // Remove 'data: ' prefix
          
          if (data === '[DONE]') {
            // Stream complete
            return fullContent.trim();
          }

          try {
            const parsed = JSON.parse(data);
            
            if (parsed.error) {
              throw new Error(parsed.message || ERROR_MESSAGES.GENERIC_ERROR);
            }

            if (parsed.content) {
              fullContent += parsed.content;
              
              // Call the chunk callback if provided
              if (onChunk) {
                onChunk(parsed.content);
              }
            }
          } catch (e) {
            // Skip invalid JSON
            if (import.meta.env.DEV) {
              console.warn('Failed to parse SSE data:', data);
            }
          }
        }
      }
    }
    
    return fullContent.trim();
    
  } catch (error: any) {
    // Log the actual error for debugging (in dev mode)
    if (import.meta.env.DEV) {
      console.error('API Error:', error);
    }

    if (error.message?.includes('fetch') || error.message?.includes('network')) {
      throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
    }
    
    if (error.status === 429) {
      throw new Error(ERROR_MESSAGES.RATE_LIMIT);
    }
    
    if (error.status === 401) {
      throw new Error(ERROR_MESSAGES.INVALID_KEY);
    }
    
    throw new Error(ERROR_MESSAGES.GENERIC_ERROR);
  }
}

/**
 * Send a message to the AI and get a streaming response
 * Automatically uses the right method based on environment:
 * - Development: Direct OpenAI client (for testing)
 * - Production: Secure API route (Vercel)
 * 
 * @param options - Contains message history, optional scenario context, and streaming callback
 * @returns The complete AI response text
 * @throws Error with Hebrew message for various failure cases
 */
export async function sendMessage(options: SendMessageOptions): Promise<string> {
  if (isDevelopment) {
    console.log('🔧 Development mode: Using direct OpenAI client');
    return sendMessageDirect(options);
  } else {
    console.log('🚀 Production mode: Using secure API route');
    return sendMessageViaAPI(options);
  }
}

