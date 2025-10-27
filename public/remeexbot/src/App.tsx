import React from 'react';
import Chatbot from './components/Chatbot';

const App: React.FC = () => {
  return (
    <div className="full-page-chat-container">
      <header className="chat-header">
        <div className="header-left-cluster">
            <div className="header-avatar"></div>
            <div className="advisor-info">
                <div className="advisor-name">Ana</div>
                <div className="advisor-status">
                  <span className="online-indicator"></span>
                  En línea
                </div>
            </div>
        </div>
      </header>
      <Chatbot />
    </div>
  );
};

export default App;