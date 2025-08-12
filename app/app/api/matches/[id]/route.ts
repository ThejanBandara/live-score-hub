import { NextResponse } from "next/server";
import { getMatchById, updateMatch, deleteMatch } from "@/utils/matches";
import { MatchDoc } from "@/types/RugbyMatch";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const match = await getMatchById(params.id);
    return NextResponse.json(match);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: (err as Error).message }, { status: 404 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { data }: { data: Partial<MatchDoc> } = await req.json();
    if (!data) {
      return NextResponse.json({ error: "Missing update data" }, { status: 400 });
    }

    await updateMatch(params.id, data);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await deleteMatch(params.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
