export const serviceConfig = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1",
  syncWebSocketUrl: process.env.NEXT_PUBLIC_SYNC_WS_URL ?? "ws://localhost:1234",
  stompWebSocketUrl: process.env.NEXT_PUBLIC_STOMP_WS_URL ?? "ws://localhost:8080/api/v1/ws",
};
