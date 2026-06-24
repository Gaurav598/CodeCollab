import { config } from "./config.js";

export async function checkMembership(roomId: string, userId: string): Promise<boolean> {
  try {
    const url = new URL(`${config.BACKEND_INTERNAL_URL}/validate-membership`);
    url.searchParams.set("roomId", roomId);
    url.searchParams.set("userId", userId);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${config.SERVICE_JWT_SECRET}`
      }
    });

    if (!response.ok) {
      console.warn(`Membership check failed for room ${roomId}, user ${userId}: ${response.status}`);
      return false;
    }

    const data = await response.json();
    return data.allowed === true;
  } catch (error) {
    console.error("Error calling internal membership API:", error);
    return false;
  }
}
