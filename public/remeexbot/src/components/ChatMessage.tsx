import React, { useMemo } from 'react';
import type { Message } from '../types';
import { Sender } from '../types';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface ChatMessageProps {
  message: Message;
  isLastInGroup: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLastInGroup }) => {
  const isBot = message.sender === Sender.Bot;

  const messageClasses = [
    'message',
    isBot ? 'bot' : 'user',
    isLastInGroup ? 'is-last-in-group' : '',
  ].join(' ');

  const parsedHtml = useMemo(() => {
    // For user messages, just escape HTML to prevent XSS.
    if (!isBot) {
      const escapeHtml = (unsafe: string) => {
        return unsafe
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
      }
      return escapeHtml(message.text).replace(/\n/g, '<br />');
    }
    
    // For bot messages, parse Markdown then sanitize to prevent XSS.
    const rawHtml = marked.parse(message.text, { gfm: true, breaks: true }) as string;
    return DOMPurify.sanitize(rawHtml);
  }, [message.text, isBot]);

  return (
    <div className={messageClasses}>
       {isBot && (
        <div className="bot-avatar-container">
            {isLastInGroup && <div className="bot-avatar"></div>}
        </div>
      )}
      <div className="message-bubble">
        <div
          className="message-content"
          dangerouslySetInnerHTML={{ __html: parsedHtml }}
        />
      </div>
    </div>
  );
};

export default ChatMessage;