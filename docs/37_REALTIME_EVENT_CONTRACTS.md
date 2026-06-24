# 37 — Realtime Event Contracts (STOMP)

This document defines the WebSocket (STOMP) messaging contracts. It resolves the missing realtime contracts blocker, allowing frontend and backend to implement chat, presence, and WebRTC signaling independently. 

*Note: CRDT code synchronization runs over a separate raw WebSocket directly to the Node.js service (Yjs protocol). This document covers the Spring Boot STOMP channels.*

## 1. STOMP Destinations Architecture

- **`/app/*`**: Application destinations. Clients send messages here for server processing.
- **`/topic/*`**: Broadcast destinations. Server broadcasts messages here to multiple subscribers (e.g., all users in a room).
- **`/user/queue/*`**: Private queues. Server sends targeted, point-to-point messages here (e.g., WebRTC signaling, private errors).

---

## 2. Chat Events

### Send Chat Message
* **Destination:** `/app/chat.send`
* **Sender:** Client
* **Receiver:** Server
* **Payload JSON:**
  ```json
  {
    "roomId": "String (UUID)",
    "message": "String"
  }
  ```
* **Example Payload:**
  ```json
  {
    "roomId": "123e4567-e89b-12d3-a456-426614174000",
    "message": "Does anyone know why the build is failing?"
  }
  ```
* **Validation Rules:** `roomId` must be valid and the sender must be an active member of the room. `message` must be <= 2000 characters and non-empty.

### Broadcast Chat Message
* **Destination:** `/topic/room.{roomId}.chat`
* **Sender:** Server
* **Receiver:** All subscribed clients in the room
* **Payload JSON:**
  ```json
  {
    "id": "String (UUID)",
    "senderId": "String (UUID)",
    "senderName": "String",
    "message": "String",
    "createdAt": "String (ISO-8601)"
  }
  ```
* **Example Payload:**
  ```json
  {
    "id": "msg-9876",
    "senderId": "user-uuid",
    "senderName": "johndoe",
    "message": "Does anyone know why the build is failing?",
    "createdAt": "2026-06-24T12:00:00Z"
  }
  ```
* **Validation Rules:** Server must sanitize the `message` for XSS before broadcasting. Persisted to database before broadcast.

---

## 3. Presence & Room Join/Leave Events

### Join Room Presence
* **Destination:** `/app/room.join`
* **Sender:** Client (Triggered after successful STOMP connection)
* **Receiver:** Server
* **Payload JSON:**
  ```json
  {
    "roomId": "String (UUID)"
  }
  ```
* **Example Payload:**
  ```json
  {
    "roomId": "123e4567-e89b-12d3-a456-426614174000"
  }
  ```
* **Validation Rules:** Sender's JWT must authorize them for this room. 

### Broadcast Presence Update (Join/Leave)
* **Destination:** `/topic/room.{roomId}.presence`
* **Sender:** Server
* **Receiver:** All subscribed clients in the room
* **Payload JSON:**
  ```json
  {
    "userId": "String (UUID)",
    "username": "String",
    "status": "String (JOINED | LEFT)",
    "timestamp": "String (ISO-8601)"
  }
  ```
* **Example Payload:**
  ```json
  {
    "userId": "user-uuid",
    "username": "johndoe",
    "status": "JOINED",
    "timestamp": "2026-06-24T12:00:05Z"
  }
  ```
* **Validation Rules:** The server automatically generates a `LEFT` status event if the WebSocket connection drops unexpectedly or on explicit `/app/room.leave`.

---

## 4. WebRTC Signaling Events

WebRTC requires point-to-point messaging. It is strictly routed via `/user/queue/` to prevent broadcasting noisy ICE candidates to the whole room.

### Send WebRTC Signal
* **Destination:** `/app/webrtc.signal`
* **Sender:** Client
* **Receiver:** Server (Routing)
* **Payload JSON:**
  ```json
  {
    "roomId": "String (UUID)",
    "targetUserId": "String (UUID)",
    "type": "String (OFFER | ANSWER | ICE)",
    "payload": "Object (WebRTC Native Payload)"
  }
  ```
* **Example Payload (Offer):**
  ```json
  {
    "roomId": "123e4567-e89b-12d3-a456-426614174000",
    "targetUserId": "target-user-uuid",
    "type": "OFFER",
    "payload": {
      "type": "offer",
      "sdp": "v=0\r\no=- 461173... \r\n..."
    }
  }
  ```
* **Validation Rules:** Both sender and `targetUserId` must be active in the `roomId`. 

### Receive WebRTC Signal
* **Destination:** `/user/queue/webrtc.signal`
* **Sender:** Server (Forwarded from another client)
* **Receiver:** Specific Client
* **Payload JSON:**
  ```json
  {
    "senderId": "String (UUID)",
    "type": "String (OFFER | ANSWER | ICE)",
    "payload": "Object (WebRTC Native Payload)"
  }
  ```
* **Example Payload (ICE Candidate):**
  ```json
  {
    "senderId": "peer-user-uuid",
    "type": "ICE",
    "payload": {
      "candidate": "candidate:842163049 1 udp 1677729535...",
      "sdpMid": "0",
      "sdpMLineIndex": 0
    }
  }
  ```
* **Validation Rules:** Clients must silently ignore signals from users not recognized as room participants.

---

## 5. Notification Events

### Receive Private Notification
* **Destination:** `/user/queue/notifications`
* **Sender:** Server
* **Receiver:** Specific Client
* **Payload JSON:**
  ```json
  {
    "type": "String (MENTION | ROLE_CHANGED)",
    "title": "String",
    "body": "String",
    "timestamp": "String (ISO-8601)"
  }
  ```
* **Example Payload:**
  ```json
  {
    "type": "MENTION",
    "title": "New Mention",
    "body": "janedoe mentioned you in General Chat",
    "timestamp": "2026-06-24T12:05:00Z"
  }
  ```
* **Validation Rules:** Used to alert users of state changes or mentions when they are not actively focused on the chat/room panel.

---

## 6. Error Events

### Receive STOMP Error
* **Destination:** `/user/queue/errors`
* **Sender:** Server
* **Receiver:** Specific Client
* **Payload JSON:**
  ```json
  {
    "code": "String",
    "message": "String"
  }
  ```
* **Example Payload:**
  ```json
  {
    "code": "UNAUTHORIZED_ACTION",
    "message": "You do not have permission to perform this action."
  }
  ```
* **Validation Rules:** Dispatched when a client sends a malformed or unauthorized message to an `/app/*` destination, allowing the frontend to show a toast error without dropping the entire connection.