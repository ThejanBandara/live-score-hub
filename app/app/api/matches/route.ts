import { NextResponse } from "next/server";
import { listMatches, createMatch } from "@/utils/matches";
import { MatchDoc, MatchStateDoc } from "@/types/RugbyMatch";

export async function GET() {
  try {
    const matches = await listMatches();
    return NextResponse.json(matches);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { match, state }: { match: MatchDoc; state: MatchStateDoc } = await req.json();
    if (!match || !state) {
      return NextResponse.json({ error: "Missing match or state data" }, { status: 400 });
    }

    const matchId = await createMatch(match, state);
    return NextResponse.json({ matchId }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
