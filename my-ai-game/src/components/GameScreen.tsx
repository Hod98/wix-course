import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { MessageBubble } from './MessageBubble';
import { Inventory } from './Inventory';
import { CombatOverlay } from './CombatOverlay';
import { playWhooshSound, startTypingLoop, playMagicalChime } from '../services/sounds';
import '../styles/GameScreen.css';

export const GameScreen: React.FC = () => {
  const { 
    gameState, 
    sendMessage, 
    resetGame, 
    saveAndExit, 
    handleCombatAction, 
    useHealingItem,
  } = useGame();
  const [inputValue, setInputValue] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [tempInput, setTempInput] = useState(''); // Store current input when navigating history
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const stopTypingSoundRef = useRef<(() => void) | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [gameState.messages, gameState.isNarratorTyping]);

  // Keep input focused
  useEffect(() => {
    if (!gameState.isNarratorTyping) {
      inputRef.current?.focus();
    }
  }, [gameState.isNarratorTyping]);

  // Play typing sound loop while narrator is typing
  useEffect(() => {
    if (gameState.isNarratorTyping) {
      // Start typing sound loop
      stopTypingSoundRef.current = startTypingLoop();
    } else {
      // Stop typing sound loop
      if (stopTypingSoundRef.current) {
        stopTypingSoundRef.current();
        stopTypingSoundRef.current = null;
      }
    }

    // Cleanup on unmount
    return () => {
      if (stopTypingSoundRef.current) {
        stopTypingSoundRef.current();
      }
    };
  }, [gameState.isNarratorTyping]);

  const handleSend = () => {
    if (inputValue.trim() && !gameState.isNarratorTyping) {
      const command = inputValue.trim();
      
      playWhooshSound(); // Play whoosh when sending message
      sendMessage(command);
      
      // Add to command history (avoid duplicates of the last command)
      setCommandHistory(prev => {
        if (prev[prev.length - 1] !== command) {
          return [...prev, command];
        }
        return prev;
      });
      
      // Reset history navigation
      setHistoryIndex(-1);
      setTempInput('');
      setInputValue('');
    }
  };

  const handleNewGame = () => {
    playMagicalChime(); // Play chime when starting new game
    resetGame();
  };

  const handleSaveAndExit = () => {
    saveAndExit();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle Enter key
    if (e.key === 'Enter') {
      handleSend();
      return;
    }

    // Handle arrow up/down for command history navigation
    if (e.key === 'ArrowUp') {
      e.preventDefault(); // Prevent cursor movement
      
      if (commandHistory.length === 0) return;

      // Save current input when starting to navigate history
      if (historyIndex === -1) {
        setTempInput(inputValue);
      }

      // Move back in history
      const newIndex = historyIndex + 1;
      if (newIndex < commandHistory.length) {
        setHistoryIndex(newIndex);
        setInputValue(commandHistory[commandHistory.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault(); // Prevent cursor movement

      if (historyIndex === -1) return;

      // Move forward in history
      const newIndex = historyIndex - 1;
      if (newIndex >= 0) {
        setHistoryIndex(newIndex);
        setInputValue(commandHistory[commandHistory.length - 1 - newIndex]);
      } else {
        // Reached the end, restore the temp input
        setHistoryIndex(-1);
        setInputValue(tempInput);
      }
    }
  };

  return (
    <div className="game-screen">
      <header className="game-header">
        <div className="header-content">
          <div className="header-left">
            <span className="scenario-emoji">{gameState.selectedScenario?.emoji}</span>
            <div className="header-info">
              <h2 className="scenario-title">{gameState.selectedScenario?.name}</h2>
              <p className="player-info">
                שחקן: <span className="player-name">{gameState.playerName}</span>
                {' • '}
                תור: <span className="turn-count">{gameState.turnCount}</span>
                {' • '}
                בריאות: <span className="health-display">❤️ {gameState.playerHealth}/{gameState.playerMaxHealth}</span>
              </p>
            </div>
          </div>
          <div className="header-buttons">
            <button className="save-exit-button" onClick={handleSaveAndExit}>
              💾 שמור וצא
            </button>
            <button className="new-game-button" onClick={handleNewGame}>
              🔄 משחק חדש
            </button>
          </div>
        </div>
      </header>

      <div className="game-body">
        <div className="messages-container">
          <div className="messages-list">
            {gameState.messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {gameState.isNarratorTyping && <MessageBubble isTyping />}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <Inventory items={gameState.inventory} />
      </div>

      <div className="input-container">
        <div className="input-wrapper">
          <span className="input-prompt">{'>'}</span>
          <input
            ref={inputRef}
            type="text"
            className="game-input"
            placeholder="הקלד את הפעולה שלך... (↑↓ לעבור בין פקודות קודמות)"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              // Reset history navigation when typing
              if (historyIndex !== -1) {
                setHistoryIndex(-1);
                setTempInput('');
              }
            }}
            onKeyDown={handleKeyDown}
            disabled={gameState.isNarratorTyping}
          />
          <button
            className="send-button"
            onClick={handleSend}
            disabled={!inputValue.trim() || gameState.isNarratorTyping}
          >
            שלח
          </button>
        </div>
      </div>

      {/* Combat Overlay - shows when combat is active */}
      {gameState.combat && (
        <CombatOverlay
          combat={gameState.combat}
          playerHealth={gameState.playerHealth}
          playerMaxHealth={gameState.playerMaxHealth}
          inventory={gameState.inventory}
          onAction={handleCombatAction}
          onUseItem={useHealingItem}
        />
      )}
    </div>
  );
};

