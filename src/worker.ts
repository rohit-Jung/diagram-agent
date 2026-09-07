import { routeAgentRequest } from "agents";
import { DesignAgent } from "./agents";

export { DesignAgent };

interface Env {
  DesignAgent: DurableObjectNamespace;
  OPENROUTER_API_KEY: string;
}

export default {
  async fetch(request: Request, env: Env) {
    console.log("env.DesignAgent:", env.DesignAgent);
    // inspects request finds durable object and also handles websocket request
    console.log(
      "request received",
      request.method,
      request.url,
      request.headers.get("Upgrade"),
      request.headers.get("Connection"),
    );

    const response = await routeAgentRequest(request, env);
    console.log("Response", response?.body);
    console.log(
      "routeAgentRequest:",
      response ? `${response.status} ${response.statusText}` : "undefined",
    );

    return response || new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
