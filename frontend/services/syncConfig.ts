export const syncConfig = {
  getWsUrl: () => {
    return process.env.NEXT_PUBLIC_SYNC_WS_URL || "ws://localhost:1234";
  }
};
