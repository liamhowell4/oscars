import { createContext, useContext, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useBallot } from './BallotContext';
import { sendChatMessage, resumeChat } from '../lib/chatApi';
import { executeClientTools } from '../lib/clientTools';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const { userData } = useAuth();
  const {
    completedCategories,
    totalCategories,
    score,
    isLocked,
    config,
    winners,
    categories,
    savePick,
  } = useBallot();
  const location = useLocation();
  const navigate = useNavigate();

  const toggleChat = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const sendMessage = useCallback(
    async (text) => {
      const userMessage = { role: 'user', content: text };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      try {
        const allMessages = [...messages, userMessage];

        const userContext = {
          displayName: userData?.displayName,
          picksCount: completedCategories,
          totalCategories,
          score,
          currentPath: location.pathname,
          isLocked,
          ceremonyStarted: config.ceremonyStarted,
          winnersCount: Object.keys(winners).length,
        };

        let response = await sendChatMessage(allMessages, userContext);

        if (response.status === 'tool_call_pending') {
          const toolResults = await executeClientTools(response.toolCalls, {
            savePick,
            navigate,
            categories,
          });
          response = await resumeChat(response.conversationState, toolResults);
        }

        if (response.message) {
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: response.message },
          ]);
        }
      } catch (err) {
        console.error('Chat error:', err);
        setError(err.message || 'Something went wrong. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [
      messages,
      userData,
      completedCategories,
      totalCategories,
      score,
      location.pathname,
      isLocked,
      config.ceremonyStarted,
      winners,
      savePick,
      navigate,
      categories,
    ],
  );

  const value = {
    isOpen,
    messages,
    isLoading,
    error,
    toggleChat,
    closeChat,
    sendMessage,
    clearChat,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
