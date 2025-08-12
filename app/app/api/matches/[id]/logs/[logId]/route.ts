import { NextResponse } from "next/server";
import { getLogById, deleteMatchLog } from "@/utils/matches";

export async function GET(_: Request, { params }: { params: { id: string; logId: string } }) {
  try {
    const log = await getLogById(params.id, params.logId);
    return NextResponse.json(log);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: (err as Error).message }, { status: 404 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string; logId: string } }) {
  try {
    await deleteMatchLog(params.id, params.logId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
