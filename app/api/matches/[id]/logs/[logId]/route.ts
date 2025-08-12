import { NextRequest, NextResponse } from "next/server";
import { getLogById, deleteMatchLog } from "@/utils/matches";
import { verifyAuth } from "@/utils/verifyAuth";

export async function GET(_: NextRequest, { params }: { params: { id: string; logId: string } }) {
  try {
    const log = await getLogById(params.id, params.logId);
    if (!log) {
      return NextResponse.json({ error: "Log not found" }, { status: 404 });
    }
    return NextResponse.json(log);
  } catch (err) {
    console.error(`[GET /matches/${params.id}/logs/${params.logId}] Error:`, err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string; logId: string } }) {
  try {
    await verifyAuth(req);
    await deleteMatchLog(params.id, params.logId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(`[DELETE /matches/${params.id}/logs/${params.logId}] Error:`, err);

    if (err.name === "AuthError") {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }

    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
