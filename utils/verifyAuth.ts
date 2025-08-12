import { adminAuth } from "@/utils/firebaseAdmin";
import { NextRequest } from "next/server";

export async function verifyAuth(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }
  
  const token = authHeader.split("Bearer ")[1];
  return adminAuth.verifyIdToken(token);
}
