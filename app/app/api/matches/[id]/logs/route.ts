import { NextResponse } from "next/server";
import { listLogs, addMatchLog } from "@/utils/matches";
import { MatchLogDoc } from "@/types/RugbyMatch";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const logs = await listLogs(params.id);
    return NextResponse.json(logs);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { log }: { log: MatchLogDoc } = await req.json();
    if (!log) {
      return NextResponse.json({ error: "Missing log data" }, { status: 400 });
    }

    await addMatchLog(params.id, log);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
