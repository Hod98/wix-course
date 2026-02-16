import type { CombatState } from '../types';

/**
 * Parse combat marker from AI response
 * Format: [COMBAT: enemy_name:emoji:health]
 * Example: [COMBAT: זומבי רעב:🧟:20]
 */
export function parseCombatMarker(text: string): {
  enemyName: string;
  enemyEmoji: string;
  enemyHealth: number;
} | null {
  const combatRegex = /\[COMBAT:\s*([^:]+):([^:]+):(\d+)\]/;
  const match = text.match(combatRegex);
  
  if (match) {
    return {
      enemyName: match[1].trim(),
      enemyEmoji: match[2].trim(),
      enemyHealth: parseInt(match[3], 10),
    };
  }
  
  return null;
}

/**
 * Remove combat markers from displayed text
 */
export function cleanCombatMarkers(text: string): string {
  return text.replace(/\[COMBAT:[^\]]+\]/g, '').trim();
}

/**
 * Roll a d20 dice (returns 1-20)
 */
export function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

/**
 * Calculate damage based on dice roll
 * 1-10: Miss (0 damage)
 * 11-15: Light hit (5 damage)
 * 16-19: Heavy hit (10 damage)
 * 20: Critical hit (15 damage)
 */
export function calculateDamage(roll: number): {
  damage: number;
  isCritical: boolean;
  isHit: boolean;
} {
  if (roll >= 20) {
    return { damage: 15, isCritical: true, isHit: true };
  } else if (roll >= 16) {
    return { damage: 10, isCritical: false, isHit: true };
  } else if (roll >= 11) {
    return { damage: 5, isCritical: false, isHit: true };
  } else {
    return { damage: 0, isCritical: false, isHit: false };
  }
}

/**
 * Process player attack action
 */
export function processAttack(combat: CombatState): {
  roll: number;
  damage: number;
  isCritical: boolean;
  isHit: boolean;
  message: string;
  newEnemyHealth: number;
} {
  const roll = rollD20();
  const { damage, isCritical, isHit } = calculateDamage(roll);
  const newEnemyHealth = Math.max(0, combat.enemyCurrentHealth - damage);
  
  let message = '';
  if (isCritical) {
    message = `🎯 מכה קריטית! גלגלת ${roll} וגרמת ${damage} נזק!`;
  } else if (isHit) {
    message = `⚔️ פגעת! גלגלת ${roll} וגרמת ${damage} נזק.`;
  } else {
    message = `❌ החטאת! גלגלת ${roll}.`;
  }
  
  return { roll, damage, isCritical, isHit, message, newEnemyHealth };
}

/**
 * Process player defend action
 * Sets defending flag for next turn
 */
export function processDefend(): {
  message: string;
} {
  return {
    message: '🛡️ אתה מתגונן! תחסום את המתקפה הבאה ותבצע נגד-מתקפה.',
  };
}

/**
 * Process flee attempt
 * 70% success rate, 30% failure with 10 damage
 */
export function processFlee(playerHealth: number): {
  success: boolean;
  damage: number;
  message: string;
  newPlayerHealth: number;
} {
  const success = Math.random() < 0.7;
  
  if (success) {
    return {
      success: true,
      damage: 0,
      message: '🏃 ברחת בהצלחה מהקרב!',
      newPlayerHealth: playerHealth,
    };
  } else {
    const damage = 10;
    const newPlayerHealth = Math.max(0, playerHealth - damage);
    return {
      success: false,
      damage,
      message: `😰 ניסית לברוח אך האויב תפס אותך! ספגת ${damage} נזק!`,
      newPlayerHealth,
    };
  }
}

/**
 * Process enemy attack
 * If player is defending, block and counter
 * Otherwise, enemy deals 8-12 damage
 */
export function processEnemyAttack(
  combat: CombatState,
  playerHealth: number
): {
  damage: number;
  counterDamage: number;
  message: string;
  newPlayerHealth: number;
  newEnemyHealth: number;
} {
  if (combat.playerDefending) {
    // Player blocks and counters
    const counterDamage = 5;
    const newEnemyHealth = Math.max(0, combat.enemyCurrentHealth - counterDamage);
    
    return {
      damage: 0,
      counterDamage,
      message: `🛡️ חסמת את המתקפה וביצעת נגד-מתקפה! גרמת ${counterDamage} נזק!`,
      newPlayerHealth: playerHealth,
      newEnemyHealth,
    };
  } else {
    // Normal enemy attack
    const damage = Math.floor(Math.random() * 5) + 8; // 8-12 damage
    const newPlayerHealth = Math.max(0, playerHealth - damage);
    
    return {
      damage,
      counterDamage: 0,
      message: `💥 ${combat.enemyEmoji} ${combat.enemyName} תקף אותך! ספגת ${damage} נזק!`,
      newPlayerHealth,
      newEnemyHealth: combat.enemyCurrentHealth,
    };
  }
}

/**
 * Generate combat summary for AI
 */
export function generateCombatSummary(
  playerWon: boolean,
  enemyName: string,
  playerHealth: number,
  fled: boolean = false
): string {
  if (fled) {
    return `השחקן ברח מהקרב עם ${enemyName}. נותרו לו ${playerHealth} נקודות בריאות.`;
  }
  
  if (playerWon) {
    return `השחקן ניצח בקרב נגד ${enemyName}! נותרו לו ${playerHealth} נקודות בריאות.`;
  } else {
    return `השחקן הובס בקרב נגד ${enemyName} ומת. המשחק הסתיים.`;
  }
}

/**
 * Create initial combat state
 */
export function createCombatState(
  enemyName: string,
  enemyEmoji: string,
  enemyHealth: number
): CombatState {
  return {
    active: true,
    enemyName,
    enemyEmoji,
    enemyMaxHealth: enemyHealth,
    enemyCurrentHealth: enemyHealth,
    playerDefending: false,
    turn: 1,
    log: [`⚔️ קרב התחיל! ${enemyEmoji} ${enemyName} מופיע!`],
  };
}

