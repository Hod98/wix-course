import React, { useState } from 'react';
import type { InventoryItem } from '../types';
import '../styles/Inventory.css';

interface InventoryProps {
  items: InventoryItem[];
}

export const Inventory: React.FC<InventoryProps> = ({ items }) => {
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const handleItemClick = (item: InventoryItem) => {
    setSelectedItem(selectedItem?.id === item.id ? null : item);
  };

  const handleClose = () => {
    setSelectedItem(null);
  };

  return (
    <div className="inventory-panel">
      <div className="inventory-header">
        <h3 className="inventory-title">
          🎒 תיק פריטים
        </h3>
        <span className="inventory-count">{items.length}</span>
      </div>

      <div className="inventory-items">
        {items.length === 0 ? (
          <div className="inventory-empty">
            <p className="empty-text">התיק ריק</p>
            <p className="empty-hint">אסוף פריטים במהלך המשחק</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className={`inventory-item ${
                selectedItem?.id === item.id ? 'selected' : ''
              }`}
              onClick={() => handleItemClick(item)}
              title={item.name}
            >
              <span className="item-emoji">{item.emoji}</span>
              <span className="item-name">{item.name}</span>
            </div>
          ))
        )}
      </div>

      {/* Item Details Modal */}
      {selectedItem && (
        <div className="item-modal-overlay" onClick={handleClose}>
          <div className="item-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={handleClose}>
              ✕
            </button>
            <div className="modal-emoji">{selectedItem.emoji}</div>
            <h2 className="modal-title">{selectedItem.name}</h2>
            <p className="modal-description">{selectedItem.description}</p>
            <div className="modal-meta">
              <span className="meta-label">נאסף ב:</span>
              <span className="meta-value">
                {selectedItem.acquiredAt.toLocaleTimeString('he-IL', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

