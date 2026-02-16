// Game Types and Interfaces

export type MessageRole = 'narrator' | 'player';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
}

export interface Scenario {
  id: string;
  name: string;
  emoji: string;
  description: string;
  intro: string; // Opening message from narrator
}

export interface InventoryItem {
  id: string;
  emoji: string;
  name: string; // Item name in Hebrew
  description: string; // Detailed description in Hebrew
  acquiredAt: Date;
  isHealing?: boolean; // Can be used to heal in combat
  healAmount?: number; // HP restored when used
}

export type CombatAction = 'attack' | 'defend' | 'flee';

export interface CombatState {
  active: boolean;
  enemyName: string;
  enemyEmoji: string;
  enemyMaxHealth: number;
  enemyCurrentHealth: number;
  playerDefending: boolean; // True if player used defend last turn
  turn: number;
  log: string[]; // Combat messages in Hebrew
}

export interface GameState {
  playerName: string;
  selectedScenario: Scenario | null;
  messages: Message[];
  turnCount: number;
  isNarratorTyping: boolean;
  gameStarted: boolean;
  inventory: InventoryItem[]; // Player's collected items
  playerHealth: number; // Current health (max 100)
  playerMaxHealth: number; // Maximum health
  combat: CombatState | null; // Active combat state
}

