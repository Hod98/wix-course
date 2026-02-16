import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { SCENARIOS } from '../data/scenarios';
import type { Scenario } from '../types';
import { playMagicalChime, initializeAudio } from '../services/sounds';
import { hasSavedGame, getSaveInfo } from '../utils/saveGame';
import '../styles/StartScreen.css';

export const StartScreen: React.FC = () => {
  const { startGame, loadGame } = useGame();
  const [playerName, setPlayerName] = useState('');
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [error, setError] = useState('');
  const [savedGameExists, setSavedGameExists] = useState(false);
  const [saveInfo, setSaveInfo] = useState<ReturnType<typeof getSaveInfo>>(null);

  useEffect(() => {
    setSavedGameExists(hasSavedGame());
    setSaveInfo(getSaveInfo());
  }, []);

  const handleStartGame = () => {
    if (!playerName.trim()) {
      setError('אנא הזן את שמך');
      return;
    }
    if (!selectedScenario) {
      setError('אנא בחר תרחיש');
      return;
    }
    
    // Initialize audio and play magical chime
    initializeAudio();
    playMagicalChime();
    
    startGame(playerName.trim(), selectedScenario);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlayerName(e.target.value);
    setError('');
  };

  const handleScenarioSelect = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setError('');
  };

  const handleContinueGame = () => {
    initializeAudio();
    playMagicalChime();
    loadGame();
  };

  return (
    <div className="start-screen">
      <div className="start-container">
        <h1 className="game-title">
          <span className="title-glow">משחק הרפתקאות טקסט</span>
        </h1>
        <p className="game-subtitle">ברוכים הבאים למסע האפי שלכם</p>

        <div className="input-section">
          <label htmlFor="player-name" className="input-label">
            מה שמך, הרפתקן?
          </label>
          <input
            id="player-name"
            type="text"
            className="name-input"
            placeholder="הזן את שמך כאן..."
            value={playerName}
            onChange={handleNameChange}
            onKeyPress={(e) => e.key === 'Enter' && handleStartGame()}
            autoFocus
          />
        </div>

        <div className="scenarios-section">
          <label className="input-label">בחר את ההרפתקה שלך:</label>
          <div className="scenarios-grid">
            {SCENARIOS.map((scenario) => (
              <div
                key={scenario.id}
                className={`scenario-card ${
                  selectedScenario?.id === scenario.id ? 'selected' : ''
                }`}
                onClick={() => handleScenarioSelect(scenario)}
              >
                <div className="scenario-emoji">{scenario.emoji}</div>
                <h3 className="scenario-name">{scenario.name}</h3>
                <p className="scenario-description">{scenario.description}</p>
              </div>
            ))}
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {savedGameExists && saveInfo && (
          <div className="saved-game-section">
            <div className="saved-game-info">
              <p className="saved-game-title">💾 משחק שמור נמצא!</p>
              <p className="saved-game-details">
                שחקן: <strong>{saveInfo.playerName}</strong> • 
                תרחיש: <strong>{saveInfo.scenario}</strong>
              </p>
              <p className="saved-game-time">נשמר ב: {saveInfo.savedAt}</p>
            </div>
            <button 
              className="continue-button"
              onClick={handleContinueGame}
            >
              <span>המשך הרפתקה</span>
            </button>
          </div>
        )}

        <button 
          className="start-button"
          onClick={handleStartGame}
          disabled={!playerName.trim() || !selectedScenario}
        >
          <span>התחל משחק חדש</span>
        </button>
      </div>
    </div>
  );
};

