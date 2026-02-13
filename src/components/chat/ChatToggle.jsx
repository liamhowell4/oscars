import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';

const COLLAPSE_DURATION = 200;

export default function ChatToggle() {
  const { user } = useAuth();
  const { isOpen, toggleChat, sendMessage, isLoading } = useChat();
  const [expanded, setExpanded] = useState(false);
  const [closing, setClosing] = useState(false);
  const [text, setText] = useState('');
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  const collapse = useCallback(() => {
    if (closing) return;
    setClosing(true);
    setText('');
    setTimeout(() => {
      setClosing(false);
      setExpanded(false);
    }, COLLAPSE_DURATION);
  }, [closing]);

  // Focus input when expanded
  useEffect(() => {
    if (expanded && !closing) {
      inputRef.current?.focus();
    }
  }, [expanded, closing]);

  // Click outside to collapse
  useEffect(() => {
    if (!expanded || closing) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        collapse();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [expanded, closing, collapse]);

  // Collapse when full panel opens
  useEffect(() => {
    if (isOpen) {
      setClosing(false);
      setExpanded(false);
      setText('');
    }
  }, [isOpen]);

  if (!user || isOpen) return null;

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    toggleChat();
    sendMessage(trimmed);
    setText('');
    setClosing(false);
    setExpanded(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      collapse();
    }
  };

  return createPortal(
    <div
      ref={containerRef}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
    >
      {expanded ? (
        <div
          className="flex items-center gap-2 rounded-full bg-black/90 border border-gold/40 backdrop-blur-md px-4 py-2.5 overflow-hidden"
          style={{
            maxWidth: 'calc(100vw - 2rem)',
            boxShadow: '0 0 30px rgba(212,175,55,0.1)',
            animation: `${closing ? 'collapseInput' : 'expandInput'} ${COLLAPSE_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1) both`,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gold/50 shrink-0">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            className="flex-1 bg-transparent text-cream text-sm font-body placeholder:text-cream/25 min-w-0"
            style={{ outline: 'none' }}
            disabled={closing}
          />
          <button
            onClick={handleSubmit}
            disabled={!text.trim() || closing}
            className="text-gold/60 hover:text-gold disabled:text-cream/15 disabled:cursor-not-allowed transition-colors shrink-0"
            aria-label="Send message"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      ) : (
        <button
          onClick={() => setExpanded(true)}
          className="rounded-full px-4 py-2.5 bg-black/90 border border-gold/40 backdrop-blur-md text-sm font-body text-gold/80 hover:text-gold hover:border-gold/60 hover:scale-105 hover:shadow-[0_0_20px_rgba(212,175,55,0.15)] transition-all flex items-center gap-2"
          aria-label="Open chat assistant"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          Ask
        </button>
      )}
    </div>,
    document.body
  );
}
