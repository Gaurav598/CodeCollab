import { config } from "./config.js";

export interface CollaborationAccess {
  allowed: boolean;
  canEdit: boolean;
  role: string;
}

export async function checkCollaborationAccess(
  roomId: string,
  fileId: string,
  userId: string,
): Promise<CollaborationAccess | null> {
  try {
    const url = new URL(`${config.BACKEND_INTERNAL_URL}/validate-collaboration`);
    url.searchParams.set("roomId", roomId);
    url.searchParams.set("fileId", fileId);
    url.searchParams.set("userId", userId);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${config.SERVICE_JWT_SECRET}`
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      console.warn(`Collaboration authorization failed for room ${roomId}, file ${fileId}, user ${userId}: ${response.status}`);
      return null;
    }

    const data = await response.json() as CollaborationAccess;
    return data.allowed === true ? data : null;
  } catch (error) {
    console.error("Error calling internal collaboration authorization API:", error);
    return null;
  }
}
