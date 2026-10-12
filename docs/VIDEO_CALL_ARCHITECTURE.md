# Video Call Feature – Architecture & Guide

One-to-one video calling between **connected users only**, using **WebRTC** and **Socket.io** for signaling. No paid services; uses a free public STUN server.

---

## 1. Simple Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  Browser (Caller)              Browser (Callee)                   │
│  - getUserMedia (camera/mic)   - getUserMedia                     │
│  - RTCPeerConnection           - RTCPeerConnection                │
│  - createOffer → send offer    - receive offer → createAnswer      │
│  - exchange ICE candidates     - exchange ICE candidates          │
│  - Media flows P2P (WebRTC)    - Media flows P2P                  │
└──────────────────────────────────────────────────────────────────┘
         │                                    │
         │  Socket.io (signaling only)        │
         └──────────────┬─────────────────────┘
                        ▼
              ┌─────────────────────┐
              │  Node + Socket.io   │
              │  - call-user        │
              │  - accept / reject  │
              │  - offer / answer   │
              │  - ice-candidate    │
              │  - end-call         │
              │  - Check Connection │
              └─────────────────────┘
                        │
                        ▼
              ┌─────────────────────┐
              │  MongoDB            │
              │  - CallHistory      │
              └─────────────────────┘
```

- **Signaling**: Socket.io (offer, answer, ICE, call-user, accept-call, reject-call, end-call).
- **Media**: Direct peer-to-peer via WebRTC; no media through the server.
- **STUN**: Free public STUN (e.g. `stun:stun.l.google.com:19302`) for NAT traversal.

---

## 2. MongoDB Schema – Call History

**Collection:** `callhistories`  
**Model:** `backend/models/CallHistory.js`

| Field            | Type     | Description                    |
|------------------|----------|--------------------------------|
| `caller`         | ObjectId | ref User                       |
| `receiver`       | ObjectId | ref User                       |
| `startTime`      | Date     | When call started              |
| `endTime`        | Date     | When call ended                |
| `durationSeconds`| Number   | Optional, computed             |
| `status`         | String   | calling / ringing / connected / ended / missed / rejected |

Calls are logged when a call ends via `POST /api/calls/log` (protected). List via `GET /api/calls/history`.

---

## 3. Socket.io Events

| Event (client → server) | Payload              | Server action                          |
|-------------------------|----------------------|----------------------------------------|
| `call-user`             | `{ to, from?, fromName?, fromProfileImage? }` | Check Connection; emit `incoming-call` to `to`, `call-status` to caller |
| `accept-call`           | `{ from, to }`       | Emit `call-accepted` to `from`         |
| `reject-call`           | `{ from, to }`       | Emit `call-rejected` to `from`         |
| `offer`                 | `{ to, offer }`      | Forward to `to`                         |
| `answer`                | `{ to, answer }`     | Forward to `to`                         |
| `ice-candidate`         | `{ to, candidate }`  | Forward to `to`                         |
| `end-call`              | `{ to }`             | Emit `call-ended` to `to`               |

| Event (server → client) | When / purpose                         |
|--------------------------|----------------------------------------|
| `incoming-call`          | Callee: show Accept/Reject UI          |
| `call-status`            | Caller: e.g. `{ status: "calling" }`   |
| `call-accepted`          | Caller: start creating offer           |
| `call-rejected`          | Caller: show declined / offline        |
| `offer`                  | Callee: set remote description, send answer |
| `answer`                 | Caller: set remote description         |
| `ice-candidate`          | Both: add ICE candidate                |
| `call-ended`             | Other peer: hang up UI and cleanup     |

---

## 4. Backend Signaling (server.js)

- **Connection check**: On `call-user`, server loads `Connection` and only allows signaling if there is an **accepted** connection between caller and receiver.
- **Maps**: `onlineUsers` (userId → socketId), `socketToUserId` (socketId → userId) for routing.
- **Forwarding**: All signaling events are forwarded by `to` (receiver userId); no media is stored or relayed.

See `backend/server.js` for the exact handlers.

---

## 5. Frontend WebRTC Flow

1. **Caller**: Clicks “Start video call” → `call-user` → wait for `call-accepted` → `getUserMedia` → create `RTCPeerConnection` → add tracks → `createOffer` → `setLocalDescription` → emit `offer` → on `answer` → `setRemoteDescription` → ICE handling.
2. **Callee**: Gets `incoming-call` (e.g. in modal) → Accept → navigate to `/video-call/:friendId` and emit `accept-call` → on `offer` → `getUserMedia` → create `RTCPeerConnection` → add tracks → `setRemoteDescription(offer)` → `createAnswer` → `setLocalDescription` → emit `answer` → ICE handling.
3. **ICE**: Both sides emit `ice-candidate` with `{ to, candidate }`; the other side adds the candidate to its `RTCPeerConnection`.

STUN config used: `{ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] }`.

---

## 6. Camera Toggle

- Keep the same `MediaStream`; get the video track and set `track.enabled = false` (off) or `true` (on).
- No need to re-create the peer connection; the existing senders continue with the same or disabled track.

---

## 7. Mute / Unmute

- Same idea: get the audio track from the local stream and set `track.enabled = false` (mute) or `true` (unmute).

---

## 8. Screen Sharing

- Use `navigator.mediaDevices.getDisplayMedia({ video: true })` to get a screen stream.
- Replace the **video** track on the existing peer connection: find the sender with `track.kind === "video"` and call `sender.replaceTrack(screenVideoTrack)`.
- To stop: replace again with the original camera track (from `getUserMedia`), then stop the screen stream tracks.

---

## 9. Security Practices

- **Only connected users**: Server checks `Connection` with `status: "accepted"` before forwarding `call-user` and only between the two users.
- **No media on server**: Only signaling goes through Socket.io; media is P2P (WebRTC).
- **HTTPS in production**: Required for `getUserMedia` (and preferably for the whole site).
- **Validate IDs**: All `to` / `from` are validated via the connection check; no arbitrary user IDs for signaling.
- **Token**: REST routes (e.g. `/api/calls/log`, `/api/calls/history`) use JWT `protect` middleware; Socket.io uses the same `addUser` mapping so only logged-in users are targeted.

---

## 10. Folder Structure (additions)

```
backend/
  models/
    CallHistory.js      # NEW
  routes/
    callRoutes.js       # NEW – GET /history, POST /log
  server.js             # UPDATED – call routes + video signaling on default namespace

frontend/
  context/
    VideoSocketContext.jsx   # NEW – socket + incoming-call modal
  pages/
    VideoCallPage.jsx        # NEW – WebRTC UI, toggles, status
  App.jsx                    # UPDATED – VideoSocketProvider, route /video-call/:friendId
  ViewConnections.jsx         # UPDATED – “Video call” button next to Chat
```

---

## Quick Test

1. Two users, both accepted in Connections.
2. User A: Connections → “Video call” for User B.
3. User B: Incoming call modal → Accept.
4. Both see local and remote video; use camera, mic, and screen share toggles; End call logs the call and redirects.
