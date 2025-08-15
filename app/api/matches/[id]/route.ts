import { NextRequest, NextResponse } from "next/server";
import { getMatchById, updateMatch, deleteMatch } from "@/utils/matches";
import { MatchDoc } from "@/types/RugbyMatch";
import { verifyAuth } from "@/utils/verifyAuth";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const match = await getMatchById(id);
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }
    return NextResponse.json(match);
  } catch (err) {
    const { id } = await params;
    console.error(`[GET /matches/${id}] Error:`, err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await verifyAuth(req);

    const { data }: { data: Partial<MatchDoc> } = await req.json();
    if (!data) {
      return NextResponse.json({ error: "Missing update data" }, { status: 400 });
    }

    await updateMatch(id, data);
    return NextResponse.json({ success: true });

  } catch (err: any) {
    const { id } = await params;
    console.error(`[PATCH /matches/${id}] Error:`, err);

    if (err.name === "AuthError") {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }

    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await verifyAuth(req);
    await deleteMatch(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    const { id } = await params;
    console.error(`[DELETE /matches/${id}] Error:`, err);

    if (err.name === "AuthError") {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }

    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}