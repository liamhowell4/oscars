function stripMarkdown(text) {
  return text
    .replace(/^#{1,6}\s+/gm, '')       // headers
    .replace(/\*\*(.+?)\*\*/g, '$1')   // bold
    .replace(/\*(.+?)\*/g, '$1')       // italic
    .replace(/^[-*]\s+/gm, '')         // bullet lists
    .replace(/^\d+\.\s+/gm, '')        // numbered lists
    .replace(/`(.+?)`/g, '$1');        // inline code
}

export default function ChatBubble({ role, content }) {
  const isUser = role === 'user';
  const displayContent = isUser ? content : stripMarkdown(content);

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`text-sm font-body px-4 py-2.5 max-w-[85%] rounded-2xl whitespace-pre-wrap break-words ${
          isUser
            ? 'bg-gold/15 text-cream rounded-br-sm'
            : 'bg-white/[0.04] text-cream/90 rounded-bl-sm'
        }`}
      >
        {displayContent}
      </div>
    </div>
  );
}
