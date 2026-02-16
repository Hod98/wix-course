import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

// CORS headers for development
const corsHeaders = {
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
  'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
};

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  scenarioContext?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ body: 'OK' });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, scenarioContext }: ChatRequest = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid request: messages required' });
    }

    // Get API key from environment
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OPENAI_API_KEY not found in environment');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Initialize OpenAI client (server-side, secure)
    const client = new OpenAI({
      apiKey,
      baseURL: process.env.OPENAI_BASE_URL || 'https://www.wixapis.com/openai/v1',
    });

    // Build the full message array with system prompt if scenario context is provided
    const fullMessages: ChatMessage[] = scenarioContext
      ? [
          {
            role: 'system',
            content: `אתה מנהל משחק הרפתקאות טקסט. ${scenarioContext}

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
3. אזכור קרבות (אם יש) בפורמט [COMBAT: שם:emoji:בריאות]
4. שורה ריקה
5. "מה תרצה לעשות?" או "אפשרויות:"
6. 2-3 פעולות מוצעות כנקודות עם אמוג'י רלוונטי

דוגמה:
אתה נכנס לחדר גדול. קירות האבן מכוסים בטחב ירוק זוהר. על השולחן מוצא אתה ספר עתיק.
[קיבלת: 📖 ספר_הקסמים]

מה תרצה לעשות?
📚 לקרוא בספר
🚪 לחפש דלת יציאה
🔍 לבדוק את הקירות הזוהרים`,
          },
          ...messages,
        ]
      : messages;

    // Call OpenAI API with streaming
    const stream = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: fullMessages,
      temperature: 0.8,
      max_tokens: 400,
      stream: true,
    });

    // Set headers for SSE (Server-Sent Events)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    Object.entries(corsHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    // Stream the response
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        // Send as SSE format
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
        // Flush immediately for Vercel streaming
        if (typeof (res as any).flush === 'function') {
          (res as any).flush();
        }
      }
    }

    // Send done signal
    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error: any) {
    console.error('API Error:', error);
    
    // Send error in SSE format
    res.write(`data: ${JSON.stringify({ 
      error: true, 
      message: error.message || 'שגיאה בשרת' 
    })}\n\n`);
    res.end();
  }
}

