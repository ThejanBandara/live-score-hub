import { NextRequest, NextResponse } from "next/server";
import { listLogs, addMatchLog } from "@/utils/matches";
import { MatchLogDoc } from "@/types/RugbyMatch";
import { verifyAuth } from "@/utils/verifyAuth";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const logs = await listLogs(params.id);
    return NextResponse.json(logs);
  } catch (err) {
    console.error(`[GET /matches/${params.id}/logs] Error:`, err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await verifyAuth(req);

    const { log }: { log: MatchLogDoc } = await req.json();
    if (!log) {
      return NextResponse.json({ error: "Missing log data" }, { status: 400 });
    }

    await addMatchLog(params.id, log);
    return NextResponse.json({ success: true }, { status: 201 });

  } catch (err: any) {
    console.error(`[POST /matches/${params.id}/logs] Error:`, err);

    if (err.name === "AuthError") {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }

    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
