# 🎮 משחק הרפתקאות טקסט - Text Adventure Game

משחק הרפתקאות טקסט אינטראקטיבי בעברית, עם ממשק דמוי צ'אט ועיצוב gaming מודרני.

## ✨ Features

### 🎯 Core Features
- **שני מסכים ראשיים:**
  - מסך פתיחה - בחירת שם שחקן ותרחיש
  - מסך משחק - ממשק צ'אט אינטראקטיבי
  
- **4 תרחישי משחק:**
  - 🏰 **המבצר המכושף** - טירה קסומה המרחפת מעל העננים
  - 🚀 **תחנת חלל אומגה** - תחנת חלל תקולה עם חייזרים
  - 🌆 **סייבר תל אביב 2099** - גרסת סייברפאנק של תל אביב
  - 🧟 **ירושלים בזומבים** - אפוקליפסת זומבים בעיר העתיקה של ירושלים

### 💬 Chat Interface
- הודעות נרטור (משמאל) והודעות שחקן (מימין)
- אינדיקטור "מקליד" עם אנימציית נקודות קופצות
- גלילה אוטומטית להודעה האחרונה
- שורת קלט בסגנון טרמינל עם סמן ">"

### 🎨 Design & UX
- ערכת צבעים אפלה עם הדגשים סגולים (#7c5cfc)
- תמיכה מלאה ב-RTL לעברית
- פונט Heebo מ-Google Fonts
- אפקטים חזותיים:
  - אנימציות כניסה חלקות
  - אפקטי hover עם זוהר (glow)
  - shadow cards מתקדמים
  - אנימציות של אמוג'י
  - אפקט typing indicator

### 📊 Game State
- ניהול מצב משחק עם React Context
- מעקב אחר:
  - שם שחקן
  - תרחיש נבחר
  - היסטוריית הודעות
  - מספר תורות
  - סטטוס הקלדה

## 🏗️ Architecture

### Component Structure
```
App
├── GameProvider (Context)
└── GameRouter
    ├── StartScreen
    │   ├── NameInput
    │   └── ScenarioPicker (4 cards)
    └── GameScreen
        ├── Header (scenario, player, turns, new game)
        ├── MessageList
        │   ├── MessageBubble (narrator)
        │   ├── MessageBubble (player)
        │   └── TypingIndicator
        └── InputBar (terminal style)
```

### File Structure
```
src/
├── types.ts                    # TypeScript interfaces
├── data/
│   └── scenarios.ts           # Game scenarios data
├── context/
│   └── GameContext.tsx        # State management
├── components/
│   ├── StartScreen.tsx        # Start screen
│   ├── GameScreen.tsx         # Game screen
│   ├── MessageBubble.tsx      # Message component
│   └── TypingIndicator.tsx    # Typing animation
├── styles/
│   ├── StartScreen.css
│   ├── GameScreen.css
│   ├── MessageBubble.css
│   └── TypingIndicator.css
├── App.tsx                     # Main app
├── App.css                     # Global app styles
├── index.css                   # CSS variables & reset
└── main.tsx                    # Entry point
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- npm or yarn

### Installation & Run
```bash
# Install dependencies (if needed)
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The game will run on `http://localhost:5173` (or next available port).

## 🎮 How to Play

1. **Start Screen:**
   - Enter your name
   - Choose one of 3 scenarios
   - Click "התחל משחק" (Start Game)

2. **Game Screen:**
   - Read the narrator's opening message
   - Type your action in the input field (with ">" prompt)
   - Press Enter or click "שלח" (Send)
   - The narrator will respond (currently with placeholder)

3. **Start New Game:**
   - Click "משחק חדש" (New Game) in the header
   - Returns to start screen

## 🔧 Technical Decisions

### State Management
- **React Context** - Clean, built-in solution suitable for this size of app
- Single source of truth for all game state
- Easy to extend for future AI integration

### Routing
- **State-based routing** - No external library needed for 2 screens
- Conditional rendering based on `gameStarted` flag

### Styling
- **CSS Modules approach** - Scoped styles with CSS variables
- Consistent design system with CSS custom properties
- Mobile-responsive with breakpoints

### Key Technical Features
1. **Auto-scroll:** useEffect + ref for smooth scrolling
2. **Typing delay:** setTimeout to simulate AI "thinking"
3. **RTL Support:** `dir="rtl"` on root + careful CSS
4. **Animations:** CSS keyframes for smooth UX
5. **Accessibility:** Proper labels, focus management

## 🔮 Next Steps (Future Enhancements)

Currently, the narrator responds with a placeholder message:
> "ההרפתקה ממשיכה... (הבינה המלאכותית עדיין לא מחוברת)"

### Ready for AI Integration:
1. Add OpenAI API integration in `GameContext`
2. Replace `sendMessage` function's setTimeout with actual API call
3. Pass conversation history for context-aware responses
4. Add API key management (env variables)

### Additional Features:
- Save/load game state (localStorage)
- Sound effects and background music
- Character stats and inventory system
- Multiple endings based on choices
- Achievements and badges
- Multiplayer support

## 🎨 Design System

### Colors
```css
--color-primary: #7c5cfc        /* Purple accent */
--color-bg-dark: #0a0a0f        /* Background */
--color-bg-medium: #151520      /* Cards */
--color-bg-light: #1e1e2e       /* Input fields */
--color-text: #e2e2e8           /* Main text */
--color-text-dim: #a0a0b0       /* Secondary text */
```

### Typography
- **Font:** Heebo (weights: 300, 400, 500, 700, 900)
- **Sizes:** Responsive hierarchy from 0.75rem to 3.5rem

### Effects
- Glow effects on interactive elements
- Smooth transitions (0.2s - 0.5s)
- Shadow cards for depth
- Hover animations for feedback

## 📱 Responsive Design

Fully responsive with breakpoints:
- Desktop: Full experience (1200px max-width content)
- Tablet: Adjusted layouts and spacing
- Mobile: Single column, optimized touch targets

## 🛠️ Tech Stack

- **React 19.2** - UI library
- **TypeScript** - Type safety
- **Vite 7.3** - Build tool & dev server
- **CSS3** - Styling with custom properties
- **Google Fonts** - Heebo font family

## 📄 License

This project is for educational purposes.

---

**Built with ❤️ and ☕ for an awesome gaming experience**
