import type { NextApiRequest, NextApiResponse } from "next";

export type ApiHandler<T = any> = (
  req: NextApiRequest,
  res: NextApiResponse<T | { error: string }>
) => Promise<void>;

export function handleApiError(res: NextApiResponse, error: any) {
  console.error("API Error:", error);
  res.status(500).json({ error: error.message || "Internal server error" });
}
