import { NextRequest, NextResponse } from "next/server";
import { PUT as updateHandler } from "../route";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = await req.json();
  const modifiedReq = new NextRequest(req.url, {
    method: "PUT",
    headers: req.headers,
    body: JSON.stringify({ ...body, id }),
  });
  return updateHandler(modifiedReq);
}
