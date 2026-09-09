import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import { UIMessage } from "ai";

interface MessageListProps {
  messages: UIMessage[];
}

export default function MessageList({ messages }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // track whether the user was at (or near) the bottom before last update
  const wasAtButtomRef = useRef(true);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - (el.scrollTop + el.clientHeight);
    wasAtButtomRef.current = distanceFromBottom > 50;
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (wasAtButtomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="message-list empty">
        <p className="placeholder-text">Describe a diagram and the AI will create it for you.</p>
      </div>
    );
  }

  return (
    <div className="message-list" ref={containerRef} onScroll={handleScroll}>
      {messages.map((msg) => {
        return <MessageBubble key={msg.id} message={msg} />;
      })}
    </div>
  );
}
