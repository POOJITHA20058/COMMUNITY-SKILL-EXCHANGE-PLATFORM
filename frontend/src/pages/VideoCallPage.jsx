import React, { useEffect, useRef, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import { toast } from "react-toastify";
import Navbar from "../components/Navbar";
import { useVideoSocket } from "../context/VideoSocketContext";

const getApiBase = () => {
  const env = import.meta.env.VITE_API_URL || "";
  const base = env.replace(/\/api\/?$/, "") || "http://localhost:5000";
  return base.startsWith("http") ? base : "http://localhost:5000";
};
const API_BASE = getApiBase();
const STUN = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

export default function VideoCallPage() {
  const { friendId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, token } = useSelector((state) => state.auth);
  const { socket } = useVideoSocket();

  const isReceiver = location.state?.isReceiver === true;
  const friendName = location.state?.fromName || location.state?.friendName || "User";

  const [callStatus, setCallStatus] = useState(isReceiver ? "ringing" : "idle");
  const [friend, setFriend] = useState(null);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [callStartTime, setCallStartTime] = useState(null);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const hasAcceptedRef = useRef(false);

  useEffect(() => {
    if (isReceiver && socket && user && friendId && !hasAcceptedRef.current) {
      hasAcceptedRef.current = true;
      socket.emit("accept-call", { from: friendId, to: user._id });
    }
  }, [isReceiver, socket, user, friendId]);

  const getFriend = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/users/${friendId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setFriend(res.data);
    } catch (_) {}
  };

  useEffect(() => {
    getFriend();
  }, [friendId, token]);

  const getLocalStream = async (video = true, audio = true) => {
    const stream = await navigator.mediaDevices.getUserMedia({ video, audio });
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    localStreamRef.current = stream;
    return stream;
  };

  const createPeer = () => {
    const pc = new RTCPeerConnection(STUN);
    pc.onicecandidate = (e) => {
      if (e.candidate && socket) socket.emit("ice-candidate", { to: friendId, candidate: e.candidate });
    };
    pc.ontrack = (e) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
    };
    peerRef.current = pc;
    return pc;
  };

  const replaceVideoTrack = (stream) => {
    const pc = peerRef.current;
    if (!pc || !stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      const sender = pc.getSenders().find((s) => s.track?.kind === "video");
      if (sender) sender.replaceTrack(videoTrack);
    }
  };

  const startCall = async () => {
    if (!socket || !user || !friendId) return;
    setCallStatus("calling");
    socket.emit("call-user", {
      to: friendId,
      from: user._id,
      fromName: user.name,
      fromProfileImage: user.profileImage,
    });
  };

  useEffect(() => {
    if (!socket || !user || !friendId) return;

    socket.on("call-status", (d) => setCallStatus(d.status || "calling"));
    
    // Caller receives accepted -> create stream & offer
    socket.on("call-accepted", async () => {
      setCallStatus("connected");
      setCallStartTime(Date.now());
      try {
        const stream = await getLocalStream(true, true);
        const pc = createPeer();
        stream.getTracks().forEach((t) => pc.addTrack(t, stream));
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("offer", { to: friendId, offer });
      } catch (err) {
        toast.error("Failed to access camera/microphone");
      }
    });

    socket.on("call-rejected", (d) => {
      const msg = d?.message || "Call failed";
      toast.error(msg, { autoClose: 5000 });
      setCallStatus("ended");
      setTimeout(() => navigate("/view-connections"), 2000);
    });

    // Receiver receives offer -> create stream & answer
    socket.on("offer", async (payload) => {
      if (!payload.offer) return;
      setCallStatus("connected");
      setCallStartTime(Date.now());
      try {
        const stream = await getLocalStream(true, true);
        const pc = createPeer();
        stream.getTracks().forEach((t) => pc.addTrack(t, stream));
        await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("answer", { to: friendId, answer });
      } catch (err) {
        toast.error("Failed to access camera/microphone");
      }
    });

    socket.on("answer", async (payload) => {
      if (!peerRef.current) return;
      try {
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(payload.answer));
      } catch (err) {
        console.error("Error setting remote description:", err);
      }
    });

    socket.on("ice-candidate", async (payload) => {
      if (!peerRef.current || !payload.candidate) return;
      try {
        await peerRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
      } catch (_) {}
    });

    socket.on("call-ended", () => {
      setCallStatus("ended");
      endCallLocal();
    });

    return () => {
      socket.off("call-status");
      socket.off("call-accepted");
      socket.off("call-rejected");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
      socket.off("call-ended");
    };
  }, [socket, user?._id, friendId, navigate]);

  const endCallLocal = () => {
    peerRef.current?.close();
    peerRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
  };

  const endCall = () => {
    if (socket) socket.emit("end-call", { to: friendId });
    setCallStatus("ended");
    endCallLocal();
    if (callStartTime && user) {
      axios
        .post(
          `${API_BASE}/api/calls/log`,
          {
            receiverId: friendId,
            startTime: new Date(callStartTime).toISOString(),
            endTime: new Date().toISOString(),
            status: "ended",
          },
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        )
        .catch(() => {});
    }
    setTimeout(() => navigate("/view-connections"), 1500);
  };

  const cancelCall = () => {
    if (socket) socket.emit("reject-call", { from: user._id, to: friendId });
    setCallStatus("ended");
    setTimeout(() => navigate("/view-connections"), 500);
  };

  const toggleCamera = async () => {
    if (!localStreamRef.current) return;
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (!videoTrack) return;
    if (cameraOn) {
      videoTrack.enabled = false;
      setCameraOn(false);
    } else {
      videoTrack.enabled = true;
      setCameraOn(true);
    }
  };

  const toggleMic = () => {
    if (!localStreamRef.current) return;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setMicOn(audioTrack.enabled);
    }
  };

  const toggleScreenShare = async () => {
    if (screenSharing) {
      // Stop screen sharing tracks
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      
      // Revert to camera video track
      if (localStreamRef.current) {
        replaceVideoTrack(localStreamRef.current);
        if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
        
        // Update local state and video track enabled status
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.enabled = cameraOn;
        }
      }
      setScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
        screenStreamRef.current = screenStream;
        
        // Replace current video track with screen share track
        replaceVideoTrack(screenStream);
        if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
        
        // When screen share ends via browser UI, toggle back
        screenStream.getVideoTracks()[0].onended = () => {
          setScreenSharing((prev) => {
             if (prev) {
                 if (localStreamRef.current) {
                    replaceVideoTrack(localStreamRef.current);
                    if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
                 }
                 return false;
             }
             return prev;
          });
        };
        setScreenSharing(true);
      } catch (err) {
        toast.error("Could not share screen");
      }
    }
  };

  if (!user) {
    navigate("/signin");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      <div className="container mx-auto px-4 pt-6 pb-24">
        <h2 className="text-white text-xl font-semibold mb-4">
          Video call with {friend?.name || friendName}
        </h2>

        {callStatus === "idle" && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-gray-400">Start a video call with your connection.</p>
            <button
              onClick={startCall}
              className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-full font-medium"
            >
              Start video call
            </button>
            <button onClick={() => navigate("/view-connections")} className="text-gray-400 underline">
              Back to connections
            </button>
          </div>
        )}

        {(callStatus === "calling" || callStatus === "ringing") && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-white text-lg">
              {callStatus === "calling" ? "Calling..." : "Ringing..."}
            </p>
            {callStatus === "calling" && (
              <button onClick={cancelCall} className="px-6 py-2 bg-red-500 text-white rounded-full">
                Cancel
              </button>
            )}
            {callStatus === "ringing" && !isReceiver && (
              <p className="text-gray-400">Waiting for them to accept...</p>
            )}
          </div>
        )}

        {callStatus === "connected" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
              <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
              <span className="absolute bottom-2 left-2 text-white text-sm bg-black/50 px-2 py-1 rounded">You</span>
            </div>
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
              <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <span className="absolute bottom-2 left-2 text-white text-sm bg-black/50 px-2 py-1 rounded">
                {friend?.name || friendName}
              </span>
            </div>
          </div>
        )}

        {callStatus === "connected" && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-3 bg-gray-800/90 rounded-full px-4 py-3">
            <button
              onClick={toggleCamera}
              className={`p-3 rounded-full ${cameraOn ? "bg-gray-600" : "bg-red-600"} text-white`}
              title={cameraOn ? "Turn off camera" : "Turn on camera"}
            >
              {cameraOn ? "📷" : "📵"}
            </button>
            <button
              onClick={toggleMic}
              className={`p-3 rounded-full ${micOn ? "bg-gray-600" : "bg-red-600"} text-white`}
              title={micOn ? "Mute" : "Unmute"}
            >
              {micOn ? "🎤" : "🔇"}
            </button>
            <button
              onClick={toggleScreenShare}
              className={`p-3 rounded-full ${screenSharing ? "bg-blue-600" : "bg-gray-600"} text-white`}
              title={screenSharing ? "Stop sharing" : "Share screen"}
            >
              {screenSharing ? "🖥️ Stop" : "🖥️ Share"}
            </button>
            <button
              onClick={endCall}
              className="p-3 rounded-full bg-red-600 text-white"
              title="End call"
            >
              📞 End
            </button>
          </div>
        )}

        {callStatus === "ended" && (
          <div className="text-center text-gray-400 py-8">
            <p className="text-lg">Call ended.</p>
            <p className="text-sm mt-2">Redirecting to connections...</p>
          </div>
        )}
      </div>
    </div>
  );
}
