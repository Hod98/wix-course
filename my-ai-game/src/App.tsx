import { GameProvider, useGame } from './context/GameContext';
import { StartScreen } from './components/StartScreen';
import { GameScreen } from './components/GameScreen';
import './App.css';

function GameRouter() {
  const { gameState } = useGame();

  return gameState.gameStarted ? <GameScreen /> : <StartScreen />;
}

function App() {
  return (
    <GameProvider>
      <div className="app" dir="rtl">
        <GameRouter />
      </div>
    </GameProvider>
  );
}

export default App;
