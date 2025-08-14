import { NextRequest, NextResponse } from "next/server";
import { getMatchById, updateMatch, deleteMatch } from "@/utils/matches";
import { MatchDoc } from "@/types/RugbyMatch";
import { verifyAuth } from "@/utils/verifyAuth";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const match = await getMatchById(params.id);
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }
    return NextResponse.json(match);
  } catch (err) {
    console.error(`[GET /matches/${params.id}] Error:`, err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await verifyAuth(req);

    // Await params before accessing its properties
    const { id } = await params;

    const { data }: { data: Partial<MatchDoc> } = await req.json();
    if (!data) {
      return NextResponse.json({ error: "Missing update data" }, { status: 400 });
    }

    await updateMatch(id, data);
    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error(`[PATCH /matches] Error:`, err);

    if (err.name === "AuthError") {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }

    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await verifyAuth(req);
    await deleteMatch(params.id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(`[DELETE /matches/${params.id}] Error:`, err);

    if (err.name === "AuthError") {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }

    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
