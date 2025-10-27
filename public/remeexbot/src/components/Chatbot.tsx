import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Message, ChatbotResponse } from '../types';
import { Sender } from '../types';
import { getChatbotResponse } from '../services/geminiService';
import ChatMessage from './ChatMessage';
import SuggestionChips from './SuggestionChips';
import ChatInput from './ChatInput';
import QuickActions from './QuickActions';
import TicketFlow from './TicketFlow';

const INACTIVITY_TIMEOUT = 30000; // 30 seconds

const initialBotMessage: Message = {
    id: 'initial-welcome',
    sender: Sender.Bot,
    text: "¡Hola! Soy Ana, tu asesora de Remeex. Para empezar, ¿me dices tu nombre?",
    suggestions: ["¿Qué es Remeex Visa?", "Ver las tarifas", "Háblame de la seguridad"]
};

const TypingIndicator: React.FC = () => (
    <div className="message bot">
         <div className="bot-avatar-container">
            <div className="bot-avatar"></div>
        </div>
        <div className="typing-indicator">
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
        </div>
    </div>
);


const Chatbot: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([initialBotMessage]);
    const [isLoading, setIsLoading] = useState(false);
    const [mode, setMode] = useState<'chat' | 'ticket'>('chat');
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const inactivityTimerRef = useRef<number | null>(null);

    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    };
    
    useEffect(scrollToBottom, [messages, isLoading, mode]);
    
    const sendInactivityPrompt = useCallback(() => {
        const inactivityMessage: Message = {
            id: `inactivity-${Date.now()}`,
            sender: Sender.Bot,
            text: "¿Sigues ahí? ¿Hay algo más en lo que pueda ayudar?",
            suggestions: ["Sí, tengo otra pregunta", "No, gracias", "Recuérdame qué puedes hacer"]
        };
        setMessages(prev => [...prev, inactivityMessage]);
    }, []);

    const resetInactivityTimer = useCallback(() => {
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        if (messages.length > 1 && !isLoading && !document.hidden && mode === 'chat') {
             inactivityTimerRef.current = window.setTimeout(sendInactivityPrompt, INACTIVITY_TIMEOUT);
        }
    }, [sendInactivityPrompt, messages.length, isLoading, mode]);

    useEffect(() => {
        resetInactivityTimer();
        const handleVisibilityChange = () => resetInactivityTimer();
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        };
    }, [resetInactivityTimer]);
    
    const handleTicketCreated = useCallback((confirmationText: string) => {
        const confirmationMessage: Message = {
            id: `ticket-confirm-${Date.now()}`,
            sender: Sender.Bot,
            text: confirmationText,
            suggestions: ["Ver estado de mi ticket", "¿Qué más puedes hacer?", "Gracias"]
        };
        setMessages(prev => [...prev, confirmationMessage]);
        setMode('chat');
    }, []);

    const handleSendMessage = useCallback(async (text: string, file?: File) => {
        if ((!text.trim() && !file) || isLoading) return;
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);

        const userMessage: Message = {
            id: Date.now().toString(),
            sender: Sender.User,
            text,
        };
        const currentMessages: Message[] = [...messages, userMessage];
        
        if (file) {
            const fileConfirmMessage: Message = {
                id: `file-confirm-${Date.now()}`,
                sender: Sender.Bot,
                text: "Perfecto, he recibido tu archivo. Lo guardaré de forma segura."
            };
            currentMessages.push(fileConfirmMessage);
        }
        
        setMessages(currentMessages);
        setIsLoading(true);

        try {
            const botResponse = await getChatbotResponse(currentMessages);
            
            if (botResponse.action === 'CREATE_TICKET') {
                setMode('ticket');
                // Optional: Add a message indicating the switch
                const ticketIntro: Message = { id: `ticket-intro-${Date.now()}`, sender: Sender.Bot, text: botResponse.responseText };
                setMessages(prev => [...prev, ticketIntro]);
            } else if (botResponse.action === 'SHOW_TICKET_STATUS' && botResponse.ticketId) {
                 const statusText = `
**📊 ESTADO DE TU TICKET**
━━━━━━━━━━━━━━━━━━━━
**🎫 TICKET:** ${botResponse.ticketId}
**📈 PROGRESO:** 70% COMPLETADO (EN PROCESO: Análisis de soluciones)
Para más detalles, contacta al especialista asignado.
`;
                const statusMessage: Message = { id: `status-${Date.now()}`, sender: Sender.Bot, text: statusText, suggestions: ["Contactar especialista", "Volver"]};
                setMessages(prev => [...prev, statusMessage]);

            } else {
                 const botMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    sender: Sender.Bot,
                    text: botResponse.responseText,
                    suggestions: botResponse.suggestions,
                };
                setMessages(prev => [...prev, botMessage]);
            }
        } catch (error) {
            console.error(error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                sender: Sender.Bot,
                text: "Lo siento, estoy teniendo un problema para conectar. Por favor, intenta de nuevo en un momento.",
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, messages]);

    const lastMessage = messages[messages.length - 1];
    const lastBotSuggestions = lastMessage?.sender === Sender.Bot && !isLoading && mode === 'chat'
        ? lastMessage.suggestions
        : [];

    return (
        <div className="chat-view">
            <div ref={chatContainerRef} className="messages-area">
              {mode === 'chat' ? (
                <>
                    {messages.map((msg, index) => {
                        const nextMsg = messages[index + 1];
                        const isLastInGroup = !nextMsg || nextMsg.sender !== msg.sender;
                        return <ChatMessage key={msg.id} message={msg} isLastInGroup={isLastInGroup} />;
                    })}
                    {isLoading && <TypingIndicator />}
                </>
              ) : (
                <TicketFlow onTicketCreated={handleTicketCreated} onCancel={() => setMode('chat')} />
              )}
            </div>
            {mode === 'chat' && (
                 <div className="chat-input-section">
                    {lastBotSuggestions && lastBotSuggestions.length > 0 && (
                         <SuggestionChips suggestions={lastBotSuggestions} onSelect={(suggestion) => handleSendMessage(suggestion)} />
                    )}
                    <ChatInput onSend={handleSendMessage} disabled={isLoading} />
                    <QuickActions />
                </div>
            )}
        </div>
    );
};

export default Chatbot;