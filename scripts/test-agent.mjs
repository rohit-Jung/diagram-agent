// Quick script to test the agent without the chat UI.
// Make sure `npm run dev` is running first, then:
//   npm run agent "draw a simple flowchart"

const message = process.argv.slice(2).join(" ") || "draw a rectangle";
const url = "ws://localhost:5173/agents/design-agent/test";

const ws = new WebSocket(url);
const requestId = crypto.randomUUID();

ws.addEventListener("open", () => {
  console.log(`Sending message: "${message}"\n`);

  const userMessage = {
    id: crypto.randomUUID(),
    role: "user",
    parts: [{ type: "text", text: message }],
  };

  // AIChatAgent protocol: send a cf_agent_use_chat_request with
  // the messages in the init.body as JSON.
  ws.send(
    JSON.stringify({
      type: "cf_agent_use_chat_request",
      id: requestId,
      init: {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: [userMessage] }),
      },
    }),
  );
});

ws.addEventListener("message", (event) => {
  const data = event.data;
  let parsed;
  try {
    parsed = JSON.parse(data);
  } catch {
    process.stdout.write(data);
    return;
  }

  if (parsed.type !== "cf_agent_use_chat_response" || parsed.id !== requestId) {
    return;
  }

  if (parsed.done) {
    console.log("\n");
    ws.close();
    return;
  }

  if (parsed.error) {
    console.error("\nServer error:", parsed.body);
    ws.close();
    return;
  }

  try {
    const part = JSON.parse(parsed.body);
    if (part.type === "text-delta") process.stdout.write(part.delta ?? part.text ?? "");
    else console.log(`\n[${part.type}]`, JSON.stringify(part, null, 2));
  } catch {
    process.stdout.write(parsed.body);
  }
});

ws.addEventListener("close", () => {
  process.exit(0);
});

ws.addEventListener("error", (err) => {
  console.error("Websocket error: ", err.message);
  console.error("Make sure the server is running first");
  process.exit(1);
});

setTimeout(() => {
  console.log("Timeout \n\n closing::");
  ws.close();
  process.exit(0);
}, 60000);
