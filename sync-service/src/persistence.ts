import { config } from "./config.js";

export async function persistDocument(fileId: string, base64Content: string): Promise<void> {
  try {
    const url = `${config.BACKEND_INTERNAL_URL}/files/${fileId}/content`;

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.SERVICE_JWT_SECRET}`
      },
      body: JSON.stringify({ content: base64Content })
    });

    if (!response.ok) {
      console.error(`Failed to persist file ${fileId}: HTTP ${response.status}`);
    } else {
      console.log(`Successfully persisted file ${fileId}`);
    }
  } catch (error) {
    console.error(`Error persisting file ${fileId}:`, error);
  }
}
