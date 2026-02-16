import type { InventoryItem } from '../types';

/**
 * Parse AI response for items using the format: [קיבלת: emoji item_name]
 * Returns array of detected items
 */
export function parseItemsFromResponse(response: string): InventoryItem[] {
  const items: InventoryItem[] = [];
  
  // Regex to match: [קיבלת: emoji item_name]
  // Captures: emoji and item_name
  const itemRegex = /\[קיבלת:\s*([^\s]+)\s+([^\]]+)\]/g;
  
  let match;
  while ((match = itemRegex.exec(response)) !== null) {
    const emoji = match[1];
    const name = match[2].replace(/_/g, ' '); // Replace underscores with spaces
    
    // Check if this is a healing item
    const healingInfo = getHealingInfo(name);
    
    const item: InventoryItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      emoji,
      name,
      description: generateItemDescription(name, emoji),
      acquiredAt: new Date(),
      isHealing: healingInfo.isHealing,
      healAmount: healingInfo.healAmount,
    };
    
    items.push(item);
  }
  
  return items;
}

/**
 * Determine if an item is a healing item and how much it heals
 */
function getHealingInfo(name: string): { isHealing: boolean; healAmount?: number } {
  const healingItems: Record<string, number> = {
    'שיקוי ריפוי': 30,
    'שיקוי': 30,
    'לחם': 15,
    'מזון': 15,
    'פרי': 10,
    'מים': 10,
    'שיקוי גדול': 50,
    'תרופה': 25,
    'עלה רפואי': 20,
    'צמח מרפא': 20,
  };
  
  // Check for exact matches or partial matches
  for (const [itemName, healAmount] of Object.entries(healingItems)) {
    if (name.includes(itemName) || itemName.includes(name)) {
      return { isHealing: true, healAmount };
    }
  }
  
  return { isHealing: false };
}

/**
 * Generate a description for an item based on its name
 * This creates a rich description for display when item is clicked
 */
function generateItemDescription(name: string, emoji: string): string {
  const descriptions: Record<string, string> = {
    // Healing items
    'שיקוי ריפוי': 'שיקוי קסום אדום-זוהר. מרפא פצעים ומחזיר חיים. (מרפא 30 HP)',
    'שיקוי': 'שיקוי קסום אדום-זוהר. מרפא פצעים ומחזיר חיים. (מרפא 30 HP)',
    'שיקוי גדול': 'שיקוי ריפוי חזק במיוחד! זוהר באור זהוב. (מרפא 50 HP)',
    'לחם': 'לחם טרי ומזין. יחזיר לך כוח ואנרגיה. (מרפא 15 HP)',
    'מזון': 'מזון מזין שמחזיר כוחות. (מרפא 15 HP)',
    'פרי': 'פרי טרי ועסיסי. מרענן ומחיה. (מרפא 10 HP)',
    'מים': 'בקבוק מים נקיים. חיוני להישרדות. (מרפא 10 HP)',
    'תרופה': 'תרופה רפואית יעילה. מרפאת מחלות ופצעים. (מרפא 25 HP)',
    'עלה רפואי': 'עלה צמח מרפא נדיר. יש לו תכונות ריפוי. (מרפא 20 HP)',
    'צמח מרפא': 'צמח בעל תכונות מרפאות מופלאות. (מרפא 20 HP)',
    
    // Common items
    'מפתח': 'מפתח מתכת עתיק. נראה שהוא עשוי לפתוח דלת חשובה.',
    'חרב': 'חרב חדה ומבריקה. תגן עליך מפני סכנות.',
    'ספר': 'ספר עתיק מלא בידע. עשוי להכיל מידע חשוב.',
    'נר': 'נר דולק שמאיר בחושך. יעזור לך למצוא את דרכך.',
    'פנס': 'פנס חזק. מאיר את הדרך בחושך.',
    'פנסוט': 'פנסוט קסום שמקרין אור רך. מאיר את דרכך בחושך.',
    'שקית': 'שקית קטנה המכילה משהו מעניין.',
    'אבן': 'אבן מיוחדת הקורנת אור עדין. אולי קסומה?',
    'כלי': 'כלי שימושי שיכול לעזור בפתרון בעיות.',
    
    // Default description
  };
  
  // Find matching key in name
  for (const [key, desc] of Object.entries(descriptions)) {
    if (name.includes(key)) {
      return `${emoji} ${desc}`;
    }
  }
  
  // Generic description
  return `${emoji} ${name} - פריט שנאסף במהלך ההרפתקה.`;
}

/**
 * Remove item markers from response text for display
 * Converts [קיבלת: emoji item] to just "קיבלת emoji item"
 */
export function cleanItemMarkersFromResponse(response: string): string {
  return response.replace(/\[קיבלת:\s*([^\s]+)\s+([^\]]+)\]/g, '✨ קיבלת: $1 $2');
}

/**
 * Add new items to inventory, preventing duplicates
 * Checks if item with same emoji+name already exists
 */
export function addItemsToInventory(
  currentInventory: InventoryItem[],
  newItems: InventoryItem[]
): InventoryItem[] {
  const updatedInventory = [...currentInventory];
  
  for (const newItem of newItems) {
    // Check if item with same emoji and name already exists
    const isDuplicate = currentInventory.some(
      (existing) =>
        existing.emoji === newItem.emoji && existing.name === newItem.name
    );
    
    if (!isDuplicate) {
      updatedInventory.push(newItem);
    }
  }
  
  return updatedInventory;
}

