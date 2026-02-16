import React, { useState, useEffect } from 'react';
import type { CombatState, CombatAction, InventoryItem } from '../types';
import '../styles/CombatOverlay.css';

interface CombatOverlayProps {
  combat: CombatState;
  playerHealth: number;
  playerMaxHealth: number;
  inventory: InventoryItem[];
  onAction: (action: CombatAction) => void;
  onUseItem: (itemId: string) => void;
}

export const CombatOverlay: React.FC<CombatOverlayProps> = ({
  combat,
  playerHealth,
  playerMaxHealth,
  inventory,
  onAction,
  onUseItem,
}) => {
  const [isRolling, setIsRolling] = useState(false);
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [shake, setShake] = useState(false);
  const [flash, setFlash] = useState(false);
  const [showItemMenu, setShowItemMenu] = useState(false);

  const playerHealthPercent = (playerHealth / playerMaxHealth) * 100;
  const enemyHealthPercent = (combat.enemyCurrentHealth / combat.enemyMaxHealth) * 100;

  // Healing items from inventory
  const healingItems = inventory.filter(item => item.isHealing);

  const handleAction = (action: CombatAction) => {
    if (action === 'attack') {
      // Animate dice roll
      setIsRolling(true);
      setDiceValue(null);

      // Simulate rolling animation
      let rollCount = 0;
      const rollInterval = setInterval(() => {
        setDiceValue(Math.floor(Math.random() * 20) + 1);
        rollCount++;
        
        if (rollCount >= 10) {
          clearInterval(rollInterval);
          setIsRolling(false);
          
          // Trigger actual action after animation
          setTimeout(() => {
            onAction(action);
            triggerShake();
          }, 300);
        }
      }, 100);
    } else {
      onAction(action);
      if (action === 'defend') {
        // Visual feedback for defend
        setFlash(true);
        setTimeout(() => setFlash(false), 300);
      }
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const triggerFlash = () => {
    setFlash(true);
    setTimeout(() => setFlash(false), 300);
  };

  // Trigger effects when player or enemy takes damage
  useEffect(() => {
    // Screen shake on damage
    if (combat.turn > 1) {
      triggerShake();
    }
  }, [combat.enemyCurrentHealth, playerHealth]);

  // Flash on critical events
  useEffect(() => {
    const lastLog = combat.log[combat.log.length - 1];
    if (lastLog && (lastLog.includes('קריטית') || lastLog.includes('מת'))) {
      triggerFlash();
    }
  }, [combat.log]);

  return (
    <div className={`combat-overlay ${shake ? 'shake' : ''}`}>
      {flash && <div className="flash-effect" />}
      
      <div className="combat-container">
        {/* Header */}
        <div className="combat-header">
          <h2>⚔️ קרב!</h2>
          <div className="turn-counter">סיבוב {combat.turn}</div>
        </div>

        {/* Health Bars */}
        <div className="health-bars">
          {/* Player Health */}
          <div className="health-bar-container player-health">
            <div className="health-label">
              <span className="health-name">🧙 {playerHealth > 0 ? 'אתה' : '💀 הפסדת'}</span>
              <span className="health-numbers">{playerHealth}/{playerMaxHealth}</span>
            </div>
            <div className="health-bar-bg">
              <div
                className={`health-bar-fill player ${playerHealthPercent <= 25 ? 'critical' : ''}`}
                style={{ width: `${playerHealthPercent}%` }}
              />
            </div>
          </div>

          {/* VS Divider */}
          <div className="vs-divider">VS</div>

          {/* Enemy Health */}
          <div className="health-bar-container enemy-health">
            <div className="health-label">
              <span className="health-name">
                {combat.enemyEmoji} {combat.enemyName}
                {combat.enemyCurrentHealth === 0 && ' 💀'}
              </span>
              <span className="health-numbers">
                {combat.enemyCurrentHealth}/{combat.enemyMaxHealth}
              </span>
            </div>
            <div className="health-bar-bg">
              <div
                className="health-bar-fill enemy"
                style={{ width: `${enemyHealthPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Dice Display */}
        {(isRolling || diceValue) && (
          <div className="dice-display">
            <div className={`dice ${isRolling ? 'rolling' : ''}`}>
              {diceValue || '🎲'}
            </div>
            {!isRolling && diceValue && (
              <div className="dice-result">גלגלת {diceValue}!</div>
            )}
          </div>
        )}

        {/* Combat Log */}
        <div className="combat-log">
          {combat.log.slice(-3).map((message, index) => (
            <div key={index} className="log-message">
              {message}
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        {playerHealth > 0 && combat.enemyCurrentHealth > 0 && (
          <div className="combat-actions">
            <button
              className="combat-btn attack-btn"
              onClick={() => handleAction('attack')}
              disabled={isRolling}
            >
              ⚔️ תקיפה
            </button>
            <button
              className="combat-btn defend-btn"
              onClick={() => handleAction('defend')}
              disabled={isRolling || combat.playerDefending}
            >
              🛡️ הגנה
            </button>
            <button
              className="combat-btn flee-btn"
              onClick={() => handleAction('flee')}
              disabled={isRolling}
            >
              🏃 בריחה
            </button>
            
            {/* Healing Items Button */}
            {healingItems.length > 0 && (
              <button
                className="combat-btn heal-btn"
                onClick={() => setShowItemMenu(!showItemMenu)}
                disabled={isRolling}
              >
                🧪 שימוש בפריט
              </button>
            )}
          </div>
        )}

        {/* Item Menu */}
        {showItemMenu && healingItems.length > 0 && (
          <div className="item-menu">
            <h3>בחר פריט לשימוש:</h3>
            <div className="item-list">
              {healingItems.map(item => (
                <button
                  key={item.id}
                  className="item-btn"
                  onClick={() => {
                    onUseItem(item.id);
                    setShowItemMenu(false);
                  }}
                >
                  {item.emoji} {item.name}
                  <span className="heal-amount">+{item.healAmount} HP</span>
                </button>
              ))}
            </div>
            <button
              className="close-menu-btn"
              onClick={() => setShowItemMenu(false)}
            >
              ביטול
            </button>
          </div>
        )}

        {/* Status Text */}
        {combat.playerDefending && (
          <div className="status-text defending">
            🛡️ אתה מתגונן - תחסום את המתקפה הבאה!
          </div>
        )}
      </div>
    </div>
  );
};

