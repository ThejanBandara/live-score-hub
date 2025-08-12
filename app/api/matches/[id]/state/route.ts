import { NextRequest, NextResponse } from "next/server";
import { updateMatchState } from "@/utils/matches";
import { MatchStateDoc } from "@/types/RugbyMatch";
import { verifyAuth } from "@/utils/verifyAuth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await verifyAuth(req);

    const { data }: { data: Partial<MatchStateDoc> } = await req.json();
    if (!data) {
      return NextResponse.json({ error: "Missing state data" }, { status: 400 });
    }

    await updateMatchState(params.id, data);
    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error(`[PATCH /matches/${params.id}/state] Error:`, err);

    if (err.name === "AuthError") {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }

    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
