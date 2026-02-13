import { useEffect, useRef } from 'react';
import ChatBubble from './ChatBubble';

export default function ChatMessages({ messages, isLoading, error }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="overflow-y-auto flex-1 px-4 py-3 space-y-3">
      {messages.length === 0 && !isLoading && (
        <p className="text-cream/30 text-xs text-center pt-6 font-body">
          Ask about nominees, make picks, or check scores.
        </p>
      )}

      {messages.map((msg, i) => (
        <ChatBubble key={i} role={msg.role} content={msg.content} />
      ))}

      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-white/[0.04] rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-gold/60" style={{ animation: 'subtlePulse 1.2s ease-in-out infinite' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-gold/60" style={{ animation: 'subtlePulse 1.2s ease-in-out 0.2s infinite' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-gold/60" style={{ animation: 'subtlePulse 1.2s ease-in-out 0.4s infinite' }} />
          </div>
        </div>
      )}

      {error && (
        <p className="text-red-400/80 text-xs text-center px-2 font-body">
          {error}
        </p>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
