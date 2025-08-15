import { NextRequest, NextResponse } from "next/server";
import { listLogs, addMatchLog } from "@/utils/matches";
import { MatchLogDoc } from "@/types/RugbyMatch";
import { verifyAuth } from "@/utils/verifyAuth";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const logs = await listLogs(id);
    return NextResponse.json(logs);
  } catch (err) {
    const { id } = await params;
    console.error(`[GET /matches/${id}/logs] Error:`, err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await verifyAuth(req);

    const { log }: { log: MatchLogDoc } = await req.json();
    if (!log) {
      return NextResponse.json({ error: "Missing log data" }, { status: 400 });
    }

    await addMatchLog(id, log);
    return NextResponse.json({ success: true }, { status: 201 });

  } catch (err: any) {
    const { id } = await params;
    console.error(`[POST /matches/${id}/logs] Error:`, err);

    if (err.name === "AuthError") {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }

    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}