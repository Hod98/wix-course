import React from 'react';
import type { Message } from '../types';
import { TypingIndicator } from './TypingIndicator';
import '../styles/MessageBubble.css';

interface MessageBubbleProps {
  message?: Message;
  isTyping?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isTyping }) => {
  if (isTyping) {
    return (
      <div className="message-container narrator">
        <div className="message-bubble narrator-bubble">
          <TypingIndicator />
        </div>
      </div>
    );
  }

  if (!message) return null;

  const isNarrator = message.role === 'narrator';

  return (
    <div className={`message-container ${isNarrator ? 'narrator' : 'player'}`}>
      <div className={`message-bubble ${isNarrator ? 'narrator-bubble' : 'player-bubble'}`}>
        <div className="message-content">{message.content}</div>
        <div className="message-timestamp">
          {message.timestamp.toLocaleTimeString('he-IL', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
    </div>
  );
};

