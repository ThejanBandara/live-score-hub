import { NextRequest, NextResponse } from "next/server";
import { getLogById, deleteMatchLog } from "@/utils/matches";
import { verifyAuth } from "@/utils/verifyAuth";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string; logId: string }> }) {
  try {
    const { id, logId } = await params;
    const log = await getLogById(id, logId);
    if (!log) {
      return NextResponse.json({ error: "Log not found" }, { status: 404 });
    }
    return NextResponse.json(log);
  } catch (err) {
    const { id, logId } = await params;
    console.error(`[GET /matches/${id}/logs/${logId}] Error:`, err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; logId: string }> }) {
  try {
    const { id, logId } = await params;
    await verifyAuth(req);
    await deleteMatchLog(id, logId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    const { id, logId } = await params;
    console.error(`[DELETE /matches/${id}/logs/${logId}] Error:`, err);

    if (err.name === "AuthError") {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }

    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}