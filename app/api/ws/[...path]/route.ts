import { NextRequest } from "next/server";
import { proxyRequest } from "../../../../lib/proxy";

export const runtime = "nodejs";

const WS_BACKEND_URL =
  process.env.WS_BACKEND_URL || "https://automated-written-submission-tool.onrender.com";

async function handler(request: NextRequest, context: unknown) {
  return proxyRequest(request, context, WS_BACKEND_URL);
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE, handler as OPTIONS, handler as HEAD };
