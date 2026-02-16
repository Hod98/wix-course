import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { GameState, Message, Scenario, CombatAction } from '../types';
import { sendMessage as sendAIMessage } from '../services/openai';
import type { ChatMessage } from '../services/openai';
import { parseItemsFromResponse, cleanItemMarkersFromResponse, addItemsToInventory } from '../utils/inventory';
import { saveGame as saveGameToStorage, loadGame as loadGameFromStorage } from '../utils/saveGame';
import {
  parseCombatMarker,
  cleanCombatMarkers,
  createCombatState,
  processAttack,
  processDefend,
  processFlee,
  processEnemyAttack,
  generateCombatSummary,
} from '../utils/combat';

interface GameContextType {
  gameState: GameState;
  startGame: (playerName: string, scenario: Scenario) => void;
  sendMessage: (content: string) => Promise<void>;
  resetGame: () => void;
  loadGame: () => void;
  saveAndExit: () => void;
  handleCombatAction: (action: CombatAction) => void;
  useHealingItem: (itemId: string) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const initialState: GameState = {
  playerName: '',
  selectedScenario: null,
  messages: [],
  turnCount: 0,
  isNarratorTyping: false,
  gameStarted: false,
  inventory: [],
  playerHealth: 100,
  playerMaxHealth: 100,
  combat: null,
};

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState>(initialState);

  const startGame = (playerName: string, scenario: Scenario) => {
    // Add the narrator's intro message
    const introMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'narrator',
      content: scenario.intro,
      timestamp: new Date(),
    };

    setGameState({
      playerName,
      selectedScenario: scenario,
      messages: [introMessage],
      turnCount: 0,
      isNarratorTyping: false,
      gameStarted: true,
      inventory: [],
      playerHealth: 100,
      playerMaxHealth: 100,
      combat: null,
    });
  };

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    // Add player message immediately
    const playerMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'player',
      content: content.trim(),
      timestamp: new Date(),
    };

    // Create a streaming narrator message that will be updated in real-time
    const narratorMessageId = `msg-${Date.now()}-narrator`;
    const streamingMessage: Message = {
      id: narratorMessageId,
      role: 'narrator',
      content: '', // Start empty, will be filled by streaming
      timestamp: new Date(),
    };

    // Update state with player message and empty narrator message
    setGameState(prev => ({
      ...prev,
      messages: [...prev.messages, playerMessage, streamingMessage],
      turnCount: prev.turnCount + 1,
      isNarratorTyping: true,
    }));

    try {
      // Build conversation history for the AI
      // Convert game messages to OpenAI chat format
      const conversationHistory: ChatMessage[] = [];
      
      // Get current messages including the new player message
      const currentMessages = [...gameState.messages, playerMessage];
      
      // Convert messages to OpenAI format (skip intro message, start from player actions)
      currentMessages.forEach((msg, index) => {
        // Skip the first message (intro) from conversation history
        if (index === 0) return;
        
        conversationHistory.push({
          role: msg.role === 'player' ? 'user' : 'assistant',
          content: msg.content,
        });
      });

      // Call the AI service with streaming callback
      const scenarioContext = gameState.selectedScenario?.description || '';
      let fullResponse = '';
      
      await sendAIMessage({
        messages: conversationHistory,
        scenarioContext,
        // Update the streaming message with each chunk
        onChunk: (chunk: string) => {
          fullResponse += chunk;
          setGameState(prev => ({
            ...prev,
            messages: prev.messages.map(msg =>
              msg.id === narratorMessageId
                ? { ...msg, content: msg.content + chunk }
                : msg
            ),
          }));
        },
      });

      // Parse items from the complete response
      const newItems = parseItemsFromResponse(fullResponse);
      
      // Parse combat markers
      const combatData = parseCombatMarker(fullResponse);
      
      // Clean item and combat markers from displayed message
      let cleanedResponse = cleanItemMarkersFromResponse(fullResponse);
      cleanedResponse = cleanCombatMarkers(cleanedResponse);

      // Update state with cleaned message, add items to inventory (preventing duplicates), mark typing as done
      setGameState(prev => ({
        ...prev,
        messages: prev.messages.map(msg =>
          msg.id === narratorMessageId
            ? { ...msg, content: cleanedResponse }
            : msg
        ),
        inventory: addItemsToInventory(prev.inventory, newItems),
        isNarratorTyping: false,
        // Initialize combat if combat marker found
        combat: combatData
          ? createCombatState(combatData.enemyName, combatData.enemyEmoji, combatData.enemyHealth)
          : prev.combat,
      }));

    } catch (error: any) {
      // Handle errors - replace streaming message with error
      const errorContent = `❌ שגיאה: ${error.message || 'אירעה שגיאה לא צפויה'}`;

      setGameState(prev => ({
        ...prev,
        messages: prev.messages.map(msg =>
          msg.id === narratorMessageId
            ? { ...msg, content: errorContent }
            : msg
        ),
        isNarratorTyping: false,
      }));

      // Log error in dev mode for debugging
      if (import.meta.env.DEV) {
        console.error('Error sending message to AI:', error);
      }
    }
  };

  const resetGame = () => {
    setGameState(initialState);
  };

  const loadGame = () => {
    const savedState = loadGameFromStorage();
    if (savedState) {
      setGameState(savedState);
    }
  };

  const saveAndExit = () => {
    saveGameToStorage(gameState);
    // Return to start screen
    setGameState(initialState);
  };

  /**
   * Handle player combat actions
   */
  const handleCombatAction = (action: CombatAction) => {
    if (!gameState.combat) return;

    const combat = gameState.combat;
    const newLog = [...combat.log];

    if (action === 'attack') {
      // Process player attack
      const attackResult = processAttack(combat);
      newLog.push(attackResult.message);

      // Check if enemy is defeated
      if (attackResult.newEnemyHealth === 0) {
        newLog.push(`🎉 ניצחת! ${combat.enemyEmoji} ${combat.enemyName} הובס!`);
        
        // End combat and send result to AI
        const summary = generateCombatSummary(true, combat.enemyName, gameState.playerHealth, false);
        
        setGameState(prev => ({
          ...prev,
          combat: null,
        }));

        // Send combat result to AI
        setTimeout(() => {
          sendMessage(summary);
        }, 1000);
        return;
      }

      // Enemy turn
      const enemyResult = processEnemyAttack(combat, gameState.playerHealth);
      newLog.push(enemyResult.message);

      // Check if player is defeated
      if (enemyResult.newPlayerHealth === 0) {
        newLog.push('💀 הפסדת בקרב! המשחק הסתיים.');
        
        setGameState(prev => ({
          ...prev,
          playerHealth: 0,
          combat: {
            ...combat,
            log: newLog,
            turn: combat.turn + 1,
            playerDefending: false,
          },
        }));

        // Send game over to AI
        const summary = generateCombatSummary(false, combat.enemyName, 0, false);
        setTimeout(() => {
          sendMessage(summary);
        }, 1000);
        return;
      }

      // Continue combat
      setGameState(prev => ({
        ...prev,
        playerHealth: enemyResult.newPlayerHealth,
        combat: {
          ...combat,
          enemyCurrentHealth: attackResult.newEnemyHealth,
          log: newLog,
          turn: combat.turn + 1,
          playerDefending: false,
        },
      }));

    } else if (action === 'defend') {
      // Process defend
      const defendResult = processDefend();
      newLog.push(defendResult.message);

      setGameState(prev => ({
        ...prev,
        combat: {
          ...combat,
          log: newLog,
          playerDefending: true,
        },
      }));

    } else if (action === 'flee') {
      // Process flee attempt
      const fleeResult = processFlee(gameState.playerHealth);
      newLog.push(fleeResult.message);

      if (fleeResult.success) {
        // Successfully fled
        const summary = generateCombatSummary(false, combat.enemyName, fleeResult.newPlayerHealth, true);
        
        setGameState(prev => ({
          ...prev,
          playerHealth: fleeResult.newPlayerHealth,
          combat: null,
        }));

        // Send flee result to AI
        setTimeout(() => {
          sendMessage(summary);
        }, 1000);
      } else {
        // Failed to flee, enemy attacks
        const enemyResult = processEnemyAttack(combat, fleeResult.newPlayerHealth);
        newLog.push(enemyResult.message);

        // Check if player died
        if (enemyResult.newPlayerHealth === 0) {
          newLog.push('💀 הפסדת בקרב! המשחק הסתיים.');
          
          setGameState(prev => ({
            ...prev,
            playerHealth: 0,
            combat: {
              ...combat,
              log: newLog,
              turn: combat.turn + 1,
              playerDefending: false,
            },
          }));

          const summary = generateCombatSummary(false, combat.enemyName, 0, false);
          setTimeout(() => {
            sendMessage(summary);
          }, 1000);
          return;
        }

        setGameState(prev => ({
          ...prev,
          playerHealth: enemyResult.newPlayerHealth,
          combat: {
            ...combat,
            log: newLog,
            turn: combat.turn + 1,
            playerDefending: false,
          },
        }));
      }
    }
  };

  /**
   * Use healing item from inventory
   */
  const useHealingItem = (itemId: string) => {
    const item = gameState.inventory.find(i => i.id === itemId);
    if (!item || !item.isHealing || !item.healAmount) return;

    const newHealth = Math.min(gameState.playerMaxHealth, gameState.playerHealth + item.healAmount);
    const healedAmount = newHealth - gameState.playerHealth;

    // Remove item from inventory
    const newInventory = gameState.inventory.filter(i => i.id !== itemId);

    // Add to combat log if in combat
    if (gameState.combat) {
      const newLog = [...gameState.combat.log];
      newLog.push(`✨ השתמשת ב${item.emoji} ${item.name}! החזרת ${healedAmount} נקודות בריאות!`);

      setGameState(prev => ({
        ...prev,
        playerHealth: newHealth,
        inventory: newInventory,
        combat: prev.combat ? { ...prev.combat, log: newLog } : null,
      }));
    } else {
      setGameState(prev => ({
        ...prev,
        playerHealth: newHealth,
        inventory: newInventory,
      }));
    }
  };

  // Auto-save after each turn (when messages change and game is active)
  useEffect(() => {
    if (gameState.gameStarted && gameState.turnCount > 0) {
      saveGameToStorage(gameState);
    }
  }, [gameState.messages, gameState.inventory]); // Save when messages or inventory changes

  return (
    <GameContext.Provider 
      value={{ 
        gameState, 
        startGame, 
        sendMessage, 
        resetGame, 
        loadGame, 
        saveAndExit,
        handleCombatAction,
        useHealingItem,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

