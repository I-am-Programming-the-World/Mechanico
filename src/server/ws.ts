import { createServer } from "http";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - ws has no types in this project
import { WebSocketServer } from "ws";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - trpc ws adapter types are not installed here
import { createWSSHandler } from "@trpc/server/adapters/ws";
import { appRouter } from "./api/root";
import { createTRPCContext } from "./api/trpc";

const PORT = Number(process.env.WS_PORT ?? 3001);

async function main() {
  const server = createServer();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const wss = new WebSocketServer({ server });

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const handler = createWSSHandler({
    router: appRouter,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    wss,
    // Pass upgrade request headers to tRPC context so NextAuth can resolve the session
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createContext: (opts: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
      const heads = new Headers(opts?.req?.headers ?? {});
      return createTRPCContext({ headers: heads });
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  wss.on("connection", (ws: any, req: any) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    handler(ws, req);
  });

  server.listen(PORT, () => {
    console.log(`tRPC WebSocket server listening on ws://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start ws server", err);
  process.exit(1);
});