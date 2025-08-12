import { NextRequest, NextResponse } from "next/server";
import { listMatches, createMatch } from "@/utils/matches";
import { MatchDoc, MatchStateDoc } from "@/types/RugbyMatch";
import { verifyAuth } from "@/utils/verifyAuth";

export async function GET() {
  try {
    const matches = await listMatches();
    return NextResponse.json(matches);
  } catch (err) {
    console.error("[GET /matches] Error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await verifyAuth(req);

    const { match, state }: { match: MatchDoc; state: MatchStateDoc } = await req.json();
    if (!match || !state) {
      return NextResponse.json({ error: "Missing match or state data" }, { status: 400 });
    }

    const matchId = await createMatch(match, state);
    return NextResponse.json({ matchId }, { status: 201 });

  } catch (err: any) {
    console.error("[POST /matches] Error:", err);

    if (err.name === "AuthError") {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }

    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
