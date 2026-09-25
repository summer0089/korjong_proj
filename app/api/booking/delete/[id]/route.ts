import { NextRequest, NextResponse } from "next/server";
import { DELETE as deleteHandler } from "../route";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const url = new URL(req.url);
  url.searchParams.set("id", id);
  const modifiedReq = new NextRequest(url.toString(), {
    method: "DELETE",
    headers: req.headers,
  });
  return deleteHandler(modifiedReq);
}
