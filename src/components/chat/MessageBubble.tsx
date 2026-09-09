import { UIMessage } from "ai";
import MarkdownRenderer from "./MarkdownRenderer";
import ToolStatus from "../streaming/ToolStatus";

interface MessageBubbleProps {
  message: UIMessage;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  console.log("Message is", message);
  return (
    <div className={`message-bubble ${message.role}`}>
      <div className="message-role">{message.role === "user" ? "You" : "Assistant"}</div>
      <div className="message-content">
        {message.parts?.map((part, idx) => {
          // plain text part
          if (part.type == "text") {
            if (message.role === "assistant") {
              return <MarkdownRenderer key={idx} content={part.text} />;
            } else {
              return <p key={idx}>{part.text}</p>;
            }
          }

          // tool call part starts with tool-<toolName>
          if (part.type.startsWith("tool-")) {
            const toolName = part.type.replace("tool-", "");
            const toolPart = part as { state?: string };

            const status =
              toolPart.state == "output-available"
                ? "complete"
                : toolPart.state == "output-error"
                  ? "error"
                  : "running";

            return <ToolStatus name={toolName} status={status} />;
          }

          return null;
        })}
        <div>pondering...</div>
      </div>
    </div>
  );
}
