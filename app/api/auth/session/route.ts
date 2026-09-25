import { NextRequest } from "next/server";
import { GET as getSessionHandler } from "./get/route";
import { POST as setSessionHandler } from "./set/route";
import { POST as destroySessionHandler } from "./destroy/route";

// GET /api/auth/session
export async function GET(req: NextRequest) {
  return getSessionHandler(req);
}

// POST /api/auth/session
export async function POST(req: NextRequest) {
  return setSessionHandler(req);
}

// DELETE /api/auth/session
export async function DELETE() {
  return destroySessionHandler();
}
