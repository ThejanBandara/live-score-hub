import { NextResponse } from "next/server";
import { updateMatchState } from "@/utils/matches";
import { MatchStateDoc } from "@/types/RugbyMatch";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { data }: { data: Partial<MatchStateDoc> } = await req.json();
    if (!data) {
      return NextResponse.json({ error: "Missing state data" }, { status: 400 });
    }

    await updateMatchState(params.id, data);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
