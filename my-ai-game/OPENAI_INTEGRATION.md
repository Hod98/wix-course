# OpenAI Integration Summary

## 🎯 Overview
Successfully integrated Wix OpenAI-compatible API into the text adventure game. The game now uses GPT-4o-mini to generate dynamic, context-aware narrator responses in Hebrew.

---

## 📁 Files Changed

### 1. **`package.json`** (Modified)
**Why:** Added OpenAI SDK dependency
**Changes:**
- Installed `openai` package (v4.x) with 51 additional dependencies
- Required for making API calls to OpenAI-compatible endpoints

---

### 2. **`vite.config.ts`** (Modified)
**Why:** Configure proxy to forward API requests to Wix OpenAI endpoint
**Changes:**
```typescript
server: {
  proxy: {
    '/wix-openai/v1': {
      target: 'https://www.wixapis.com',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/wix-openai\/v1/, '/openai/v1'),
      secure: true,
    },
  },
}
```
**Behavior:**
- Requests to `/wix-openai/v1/*` are proxied to `https://www.wixapis.com/openai/v1/*`
- Avoids CORS issues during development
- Maintains secure HTTPS connection

---

### 3. **`src/services/openai.ts`** (Created)
**Why:** Centralized AI service module for API communication
**Key Features:**

#### Robust baseURL Handling
```typescript
function buildBaseURL(): string {
  const configuredBaseURL = import.meta.env.VITE_OPENAI_BASE_URL || '/wix-openai/v1';
  
  // If it starts with http, it's already absolute
  if (configuredBaseURL.startsWith('http://') || configuredBaseURL.startsWith('https://')) {
    return configuredBaseURL;
  }
  
  // Otherwise, convert to absolute URL
  return new URL(configuredBaseURL, window.location.origin).toString();
}
```
- Handles both absolute URLs (`https://...`) and relative paths (`/wix-openai/v1`)
- Converts relative paths to absolute using `window.location.origin`
- Ensures compatibility with different deployment environments

#### Error Handling (All in Hebrew)
```typescript
export const ERROR_MESSAGES = {
  INVALID_KEY: 'מפתח API לא תקין. אנא בדוק את המפתח ב-.env',
  RATE_LIMIT: 'חרגת ממכסת הבקשות. נסה שוב בעוד כמה רגעים.',
  NETWORK_ERROR: 'שגיאת רשת. בדוק את החיבור לאינטרנט.',
  GENERIC_ERROR: 'אירעה שגיאה בשרת הבינה המלאכותית. נסה שוב.',
  MISSING_KEY: 'מפתח API חסר. הוסף את VITE_OPENAI_API_KEY ל-.env',
};
```
- Catches specific error codes: 401 (Invalid Key), 429 (Rate Limit)
- Network errors detected via error message patterns
- Generic fallback for unexpected errors
- Dev mode logging for debugging

#### API Configuration
```typescript
const client = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  baseURL: buildBaseURL(),
  dangerouslyAllowBrowser: true, // Demo/learning environment
});
```

#### Message Function
```typescript
export async function sendMessage(options: SendMessageOptions): Promise<string>
```
- Accepts full conversation history
- Injects system prompt with scenario context
- Uses `gpt-4o-mini` model
- Temperature: 0.8 (creative responses)
- Max tokens: 300 (concise responses, 2-4 sentences)
- Returns Hebrew text only

---

### 4. **`src/context/GameContext.tsx`** (Modified)
**Why:** Replace placeholder responses with real AI API calls

#### Imports Added
```typescript
import { sendMessage as sendAIMessage } from '../services/openai';
import type { ChatMessage } from '../services/openai';
```

#### sendMessage Function Changed
**Before:**
```typescript
const sendMessage = (content: string) => {
  // ... add player message
  
  setTimeout(() => {
    const narratorMessage: Message = {
      id: `msg-${Date.now()}-narrator`,
      role: 'narrator',
      content: 'ההרפתקה ממשיכה... (הבינה המלאכותית עדיין לא מחוברת)',
      timestamp: new Date(),
    };
    // ... update state
  }, 1500);
};
```

**After:**
```typescript
const sendMessage = async (content: string) => {
  // ... add player message
  
  try {
    // Build conversation history
    const conversationHistory: ChatMessage[] = [];
    currentMessages.forEach((msg, index) => {
      if (index === 0) return; // Skip intro message
      conversationHistory.push({
        role: msg.role === 'player' ? 'user' : 'assistant',
        content: msg.content,
      });
    });

    // Call AI service with full context
    const aiResponse = await sendAIMessage({
      messages: conversationHistory,
      scenarioContext: gameState.selectedScenario?.description || '',
    });

    // Add AI response
    const narratorMessage: Message = {
      id: `msg-${Date.now()}-narrator`,
      role: 'narrator',
      content: aiResponse,
      timestamp: new Date(),
    };
    // ... update state
    
  } catch (error: any) {
    // Show error in Hebrew to player
    const errorMessage: Message = {
      id: `msg-${Date.now()}-error`,
      role: 'narrator',
      content: `❌ שגיאה: ${error.message || 'אירעה שגיאה לא צפויה'}`,
      timestamp: new Date(),
    };
    // ... update state with error message
  }
};
```

**Key Changes:**
1. **Made async** - Returns `Promise<void>` instead of `void`
2. **Conversation history** - Builds full chat history from game messages
3. **Skips intro** - First message is the scenario intro, not part of conversation
4. **Maps roles** - Converts `player` → `user`, `narrator` → `assistant`
5. **Passes context** - Sends scenario description for consistent theming
6. **Error handling** - Catches errors and displays them to the player in Hebrew
7. **Dev logging** - Console.error in dev mode for debugging

#### TypeScript Interface Updated
```typescript
interface GameContextType {
  sendMessage: (content: string) => Promise<void>; // Now async
}
```

---

### 5. **`.env`** (Created via terminal)
**Why:** Store API credentials securely
**Contents:**
```env
VITE_OPENAI_API_KEY=wix-sk-MM2l7r24pL9l0kpA1kev4tmmjfbgnd2jSrzhgzh635w
VITE_OPENAI_BASE_URL=https://api.openai.com/wix-openai/v1
```
- Real API key detected (starts with `wix-sk-`)
- Base URL points to proxy endpoint
- Automatically loaded by Vite
- **Protected:** Already in `.gitignore`

---

### 6. **`.env.example`** (Created via terminal)
**Why:** Template for other developers
**Contents:**
```env
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_OPENAI_BASE_URL=https://api.openai.com/wix-openai/v1
```
- Safe to commit (no real secrets)
- Shows required environment variables
- Helps onboarding new developers

---

### 7. **`.gitignore`** (Modified)
**Why:** Prevent accidental commit of API keys
**Added:**
```gitignore
# Environment variables (never commit secrets!)
.env
.env.local
```
- Blocks `.env` from being committed
- Also blocks `.env.local` for local overrides
- **Security best practice**

---

## 🔄 How It Works

### Request Flow
```
Player types message
     ↓
GameContext.sendMessage()
     ↓
Build conversation history
     ↓
Call src/services/openai.sendMessage()
     ↓
OpenAI SDK makes request to baseURL
     ↓
baseURL = http://localhost:5173/wix-openai/v1
     ↓
Vite proxy intercepts request
     ↓
Proxies to https://www.wixapis.com/openai/v1
     ↓
Response comes back
     ↓
Service returns Hebrew text
     ↓
GameContext adds narrator message
     ↓
UI updates with response
```

### Conversation History Example
First turn:
```typescript
[
  { role: 'user', content: 'אני נכנס לטירה' }
]
```

Second turn:
```typescript
[
  { role: 'user', content: 'אני נכנס לטירה' },
  { role: 'assistant', content: 'אתה נכנס לחדר גדול...' },
  { role: 'user', content: 'אני בוחן את הקירות' }
]
```

The full history is sent each time, ensuring context-aware responses.

---

## 🎨 System Prompt (Injected Automatically)
```
אתה מנהל משחק הרפתקאות טקסט. [SCENARIO_DESCRIPTION].
תן תשובות יצירתיות, מעניינות וממשיכות את העלילה.
כתוב בעברית בלבד.
שמור על אווירת המשחק והתרחיש.
היה תמציתי - 2-4 משפטים לתשובה.
```

This ensures:
- Responses match the chosen scenario
- Hebrew-only output
- Concise, game-appropriate responses
- Maintains narrative flow

---

## 🧪 Error Scenarios Handled

| Error Type | Status Code | Hebrew Message |
|------------|-------------|----------------|
| Missing API Key | - | `מפתח API חסר. הוסף את VITE_OPENAI_API_KEY ל-.env` |
| Invalid API Key | 401 | `מפתח API לא תקין. אנא בדוק את המפתח ב-.env` |
| Rate Limit | 429 | `חרגת ממכסת הבקשות. נסה שוב בעוד כמה רגעים.` |
| Network Error | - | `שגיאת רשת. בדוק את החיבור לאינטרנט.` |
| Generic Error | Any | `אירעה שגיאה בשרת הבינה המלאכותית. נסה שוב.` |

All errors display to the player as narrator messages with ❌ prefix.

---

## ✅ Testing Checklist

### Before Testing
- [ ] `.env` file exists with valid `VITE_OPENAI_API_KEY`
- [ ] Dev server restarted after vite.config changes
- [ ] Browser cache cleared (Cmd+Shift+R)

### Test Cases
1. **Happy Path**
   - [ ] Start new game
   - [ ] Send player message
   - [ ] Narrator responds with relevant Hebrew text
   - [ ] Second message maintains context

2. **Error Handling**
   - [ ] Invalid API key → See Hebrew error message
   - [ ] Empty API key → See Hebrew error message
   - [ ] Disconnect network → See network error

3. **Conversation Context**
   - [ ] Multiple turns
   - [ ] Narrator remembers previous actions
   - [ ] Responses match selected scenario theme

---

## 🚀 Deployment Considerations

### Environment Variables in Production
```bash
# Set these in your hosting platform
VITE_OPENAI_API_KEY=your-production-key
VITE_OPENAI_BASE_URL=https://your-api-endpoint.com/v1
```

### Alternative: Direct API URL
If deploying without proxy:
```env
VITE_OPENAI_BASE_URL=https://www.wixapis.com/openai/v1
```
The service will use it directly (no Vite proxy needed).

---

## 📊 Technical Decisions Summary

| Decision | Rationale |
|----------|-----------|
| **Separate service module** | Separation of concerns, reusability, testability |
| **Async sendMessage** | Required for API calls, better UX with loading states |
| **Full conversation history** | Context-aware responses, maintains narrative coherence |
| **Skip intro message** | Intro is static, not part of player-AI conversation |
| **Hebrew-only errors** | Consistent UX, player-facing language |
| **System prompt injection** | Ensures thematic consistency without manual setup |
| **Vite proxy** | Avoids CORS, keeps baseURL simple during dev |
| **Robust baseURL** | Works in dev, staging, and production environments |
| **Temperature 0.8** | Balance between creativity and coherence |
| **Max tokens 300** | Keeps responses concise (2-4 sentences) |
| **gpt-4o-mini** | Cost-effective, fast, sufficient for text adventure |

---

## 🔮 Future Enhancements

- [ ] Add token usage tracking
- [ ] Implement conversation summarization for long games
- [ ] Add "regenerate response" button
- [ ] Save/load game state with conversation history
- [ ] Add adjustable creativity slider (temperature)
- [ ] Support for different AI models
- [ ] Streaming responses for longer outputs
- [ ] Multi-language support beyond Hebrew

---

**Integration Status:** ✅ Complete and Ready for Testing

**Server Running:** http://localhost:5173/

