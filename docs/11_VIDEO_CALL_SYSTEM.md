# 11 — Video Call System

This is Gaurav's originally-requested addition, not present in the AI-generated roadmap that the rest of this structure is based on — it's folded in here as a first-class feature.

## Requirements
- **WebRTC** for peer-to-peer audio/video
- Video call
- Voice-only call (audio without video, for lower bandwidth / camera-off scenarios)
- Screen sharing
- Mute / unmute audio toggle
- Camera on/off toggle
- Participants panel (who's currently in the call, their mute/camera state)

## Signaling
WebRTC needs a signaling channel to exchange connection offers/answers/ICE candidates before a direct peer connection is established. This rides on the same WebSocket/STOMP channel already used for room presence and chat (see `05_REALTIME_COLLABORATION.md`) — no separate signaling server needed at this scale.

## Topology
For v1: **mesh** (every participant connects directly to every other participant). This is simple and sufficient for small rooms (2–4 people). If room sizes are expected to regularly exceed that, an SFU (e.g. mediasoup) becomes necessary — flagged as a **(backlog)** item, not required for initial build.

## Permissions and auth
- Joining a call requires the same JWT-validated room membership as the editor itself.
- Browser camera/mic permission prompts must be handled gracefully — denial should not break the rest of the app; the editor and chat must keep working regardless of call state.

## Explicit non-goals for v1
- No call recording
- No SFU/large-room scaling (mesh only, see above)

## Acceptance criteria
- Two-plus users in the same room can start a call, see/hear each other, and continue editing code simultaneously without the call degrading editor responsiveness.
- Leaving the room or ending the call fully tears down all peer connections (no lingering open media streams or "camera on" lights staying lit).