import type { GameState } from '../types';

const SAVE_KEY = 'text-adventure-game-save';

/**
 * Save game state to localStorage
 */
export function saveGame(gameState: GameState): void {
  try {
    // Convert dates to ISO strings for serialization
    const saveData = {
      ...gameState,
      messages: gameState.messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toISOString(),
      })),
      inventory: gameState.inventory.map(item => ({
        ...item,
        acquiredAt: item.acquiredAt.toISOString(),
      })),
      savedAt: new Date().toISOString(),
    };

    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    console.log('Game saved successfully!');
  } catch (error) {
    console.error('Failed to save game:', error);
  }
}

/**
 * Load game state from localStorage
 * Returns null if no save exists or if save is invalid
 */
export function loadGame(): GameState | null {
  try {
    const savedData = localStorage.getItem(SAVE_KEY);
    
    if (!savedData) {
      return null;
    }

    const parsed = JSON.parse(savedData);

    // Convert ISO strings back to Date objects
    const gameState: GameState = {
      ...parsed,
      messages: parsed.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      })),
      inventory: parsed.inventory.map((item: any) => ({
        ...item,
        acquiredAt: new Date(item.acquiredAt),
      })),
    };

    console.log('Game loaded successfully!');
    return gameState;
  } catch (error) {
    console.error('Failed to load game:', error);
    return null;
  }
}

/**
 * Check if a save game exists
 */
export function hasSavedGame(): boolean {
  try {
    return localStorage.getItem(SAVE_KEY) !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Delete saved game
 */
export function deleteSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
    console.log('Save deleted successfully!');
  } catch (error) {
    console.error('Failed to delete save:', error);
  }
}

/**
 * Get save game info for display
 */
export function getSaveInfo(): { savedAt: string; playerName: string; scenario: string; turnCount: number } | null {
  try {
    const savedData = localStorage.getItem(SAVE_KEY);
    
    if (!savedData) {
      return null;
    }

    const parsed = JSON.parse(savedData);
    
    return {
      savedAt: new Date(parsed.savedAt).toLocaleString('he-IL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      playerName: parsed.playerName,
      scenario: parsed.selectedScenario?.name || 'לא ידוע',
      turnCount: parsed.turnCount,
    };
  } catch (error) {
    return null;
  }
}

