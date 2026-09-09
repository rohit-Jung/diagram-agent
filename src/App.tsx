import { useState, useCallback, useRef, useEffect } from "react";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import Canvas from "./components/Canvas";
import ChatPanel from "./components/chat/ChatPanel";
import "./App.css";
import { useAgent } from "agents/react";
import { useAgentChat } from "@cloudflare/ai-chat/react";
import {
  CaptureUpdateAction,
  convertToExcalidrawElements,
  newElementWith,
} from "@excalidraw/excalidraw";

// one agent instance per page load
// persisting the chat history won't make sense as the canvas
// resets its state every reload. Generated at module label so that
// React.StrictMode double mount wont effect
const sessionId = crypto.randomUUID();

export default function App() {
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // track which tools we have already applied
  const appliedToolCalls = useRef<Set<string>>(new Set());

  const handleApiReady = useCallback((api: ExcalidrawImperativeAPI) => {
    setExcalidrawAPI(api);
  }, []);

  // connect agent to fresh instance on load
  const agent = useAgent({ agent: "design-agent", name: sessionId });

  // useAgentChat : chat protocol built on top of agent connection
  const { messages, sendMessage, status } = useAgentChat({ agent });

  // watch messages for tool outputs and apply them to canvas
  // we handle both tools the agent has (generateDiagram and modifyDiagram)
  useEffect(() => {
    if (!excalidrawAPI) return;

    for (const message of messages) {
      if (message.role !== "assistant") continue;

      for (const part of message.parts) {
        if (part.type !== "tool-generateDiagram" && part.type !== "tool-modifyDiagram") continue;
        if (part.state !== "output-available") continue;

        if (appliedToolCalls.current.has(part.toolCallId)) continue;

        if (part.type === "tool-generateDiagram") {
          appliedToolCalls.current.add(part.toolCallId);
          const output = part.output as { elements?: unknown };
          const skeletonElements = output?.elements;

          if (Array.isArray(skeletonElements) && skeletonElements.length > 0) {
            // generate full element data as per excalidrawAPI
            const elements = convertToExcalidrawElements(skeletonElements as any, {
              regenerateIds: false,
            });

            excalidrawAPI.updateScene({ elements });
            excalidrawAPI.scrollToContent(elements, { fitToContent: true });
          }
        } else if (part.type === "tool-modifyDiagram") {
          appliedToolCalls.current.add(part.toolCallId);
          const output = part.output as {
            elementId: string;
            updates: unknown;
          };

          // use nextElementWith to merge the updates into matching element
          // bumps version + versionNonce + the updated timestamp the way the reconciler expects.
          const current = excalidrawAPI.getSceneElements();
          const next = current.map((el) =>
            el.id === output.elementId ? newElementWith(el, output.updates as any) : el,
          );

          excalidrawAPI.updateScene({
            elements: next,
            // instead of deferring on next tick update IMMEDIATELY
            captureUpdate: CaptureUpdateAction.IMMEDIATELY,
          });
        }
      }
    }
  }, [messages, excalidrawAPI]);

  return (
    <div className={`app ${theme}`}>
      <div className="canvas-container">
        <Canvas onApiReady={handleApiReady} onThemeChange={setTheme} />
      </div>
      <ChatPanel messages={messages} sendMessage={sendMessage} status={status} />
    </div>
  );
}
