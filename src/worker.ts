import { routeAgentRequest } from "agents";
import { DesignAgent } from "./agents";

export { DesignAgent };

interface Env {
  DesignAgent: DurableObjectNamespace;
  OPENROUTER_API_KEY: string;
}

export default {
  async fetch(request: Request, env: Env) {
    const response = await routeAgentRequest(request, env);
    return response || new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
