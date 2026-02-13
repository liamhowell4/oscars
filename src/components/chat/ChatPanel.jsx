import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useChat } from '../../contexts/ChatContext';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';

const CLOSE_DURATION = 220;

export default function ChatPanel() {
  const { isOpen, messages, isLoading, error, closeChat, sendMessage } = useChat();
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      closeChat();
    }, CLOSE_DURATION);
  }, [closeChat]);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      setClosing(false);
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!visible) return;
    const handleKey = (e) => {
      if (e.key === 'Escape' && !closing) handleClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [visible, closing, handleClose]);

  if (!visible) return null;

  return createPortal(
    <>
      {/* Backdrop — click to close + faint gold glow */}
      <div
        className="fixed inset-0 z-40"
        onClick={() => !closing && handleClose()}
        style={{
          background: 'radial-gradient(ellipse at 50% 100%, rgba(212,175,55,0.06) 0%, transparent 60%)',
          animation: `${closing ? 'fadeOut' : 'fadeIn'} ${closing ? CLOSE_DURATION : 200}ms ease both`,
        }}
      />

      {/* Panel */}
      <div
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[420px] max-w-[calc(100vw-2rem)] max-h-[500px] max-sm:w-[calc(100vw-1rem)] max-sm:max-h-[60vh] rounded-3xl bg-black/80 backdrop-blur-xl border border-gold/25 flex flex-col"
        style={{
          animation: `${closing ? 'slideDown' : 'slideUp'} ${closing ? CLOSE_DURATION : 280}ms cubic-bezier(0.4, 0, 0.2, 1) both`,
          boxShadow: '0 0 80px rgba(212,175,55,0.08), 0 0 30px rgba(212,175,55,0.05)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <span className="text-sm font-display text-gold-gradient">Oscar Assistant</span>
          <button
            onClick={handleClose}
            className="text-cream/40 hover:text-gold transition-colors p-1"
            aria-label="Close chat"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Divider */}
        <div className="h-px bg-gold/15 mx-4" />

        {/* Messages */}
        <ChatMessages messages={messages} isLoading={isLoading} error={error} />

        {/* Input */}
        <ChatInput onSend={sendMessage} isLoading={isLoading} />
      </div>
    </>,
    document.body
  );
}
