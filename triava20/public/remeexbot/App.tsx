import React, { useState, useCallback } from 'react';
import Chatbot from './components/Chatbot';
import { ChevronDown, MessageSquare } from 'lucide-react';

const App: React.FC = () => {
  const [isMinimized, setIsMinimized] = useState(false);

  const handleToggle = useCallback(() => {
    const newMinimizedState = !isMinimized;
    setIsMinimized(newMinimizedState);

    // Communicate state to parent window (for iframe resizing)
    const messageType = newMinimizedState ? 'remeex-chat-minimize' : 'remeex-chat-maximize';
    window.parent.postMessage({ type: messageType }, '*');
    
  }, [isMinimized]);

  return (
    <div className={`chat-widget-container ${isMinimized ? 'is-minimized' : 'is-open'}`}>
      {isMinimized ? (
        <div className="minimized-bubble" onClick={handleToggle} role="button" aria-label="Maximizar chat">
          <MessageSquare size={28} />
        </div>
      ) : (
        <div className="chat-container">
          <header className="chat-header">
            <div className="header-controls">
                <button onClick={handleToggle} className="control-btn" aria-label="Minimizar chat">
                   <ChevronDown size={16} />
                </button>
            </div>
            <div className="advisor-center">
                <div className="advisor-name">Ana de Remeex</div>
                <div className="advisor-status">• En línea</div>
            </div>
          </header>
          <Chatbot isMinimized={isMinimized} />
        </div>
      )}
    </div>
  );
};

export default App;
