import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import Navbar from "../components/Navbar";
import { FaPaperclip } from "react-icons/fa";
import { IoMdSend } from "react-icons/io";
import { IoClose } from "react-icons/io5";

const ChatContainer = () => {
  const { friendId } = useParams();
  const { user, token } = useSelector((state) => state.auth);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [friend, setFriend] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);

    newSocket.on("connect", () => {
      if (user?._id) newSocket.emit("addUser", user._id);
    });

    return () => newSocket.disconnect();
  }, [user?._id]);

  useEffect(() => {
    if (!socket) return;

    socket.on("getMessage", (data) => {
      if (data.sender === friendId) {
        setMessages((prev) => [...prev, data]);
      }
    });

    return () => socket.off("getMessage");
  }, [socket, friendId]);

  useEffect(() => {
    const fetchFriend = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/users/${friendId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setFriend(res.data);
      } catch (err) {}
    };
    if (friendId) fetchFriend();
  }, [friendId, token]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!user?._id || !friendId) return;
      try {
        const res = await axios.get(
          `http://localhost:5000/api/chat/${user._id}/${friendId}`
        );
        setMessages(res.data);
      } catch (err) {}
    };
    fetchMessages();
  }, [user, friendId]);

  const handleSend = async () => {
    if (!newMsg.trim() && !selectedFile) return;

    try {
      let res;
      if (selectedFile) {
        const formData = new FormData();
        formData.append("receiver", friendId);
        formData.append("file", selectedFile);

        res = await axios.post("http://localhost:5000/api/chat/add/file", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        });
      } else {
        res = await axios.post(
          "http://localhost:5000/api/chat/add",
          { receiver: friendId, content: newMsg },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      setMessages((prev) => [...prev, res.data]);

      if (socket) {
        socket.emit("sendMessage", {
          sender: user._id,
          receiver: friendId,
          content: res.data.content,
          fileUrl: res.data.fileUrl,
          _id: res.data._id,
          createdAt: res.data.createdAt,
        });
      }

      setNewMsg("");
      setSelectedFile(null);
    } catch (err) {}
  };

  const detectLinks = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, index) =>
      urlRegex.test(part) ? (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="underline text-blue-600"
        >
          {part}
        </a>
      ) : (
        part
      )
    );
  };

  const renderMessageContent = (msg) => {
    if (msg.fileUrl) {
      const fullPath = `http://localhost:5000/uploads/${msg.fileUrl}`;
      if (msg.fileUrl.toLowerCase().endsWith(".pdf")) {
        const fileName = msg.fileUrl.split("/").pop();
        return (
          <a
            href={fullPath}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            📄 {fileName}
          </a>
        );
      } else {
        return (
          <img
            src={fullPath}
            alt="Shared"
            className="max-w-[200px] rounded-lg border cursor-pointer hover:opacity-90 transition"
            onClick={() => setPreviewImage(fullPath)}
          />
        );
      }
    } else {
      return <span>{detectLinks(msg.content)}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-white to-red-100 flex flex-col relative">
      <Navbar />
      <div className="flex-grow flex flex-col items-center py-8 px-4 mt-20">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-6 flex flex-col">
          {friend && (
            <div className="flex items-center mb-4 border-b pb-2">
              <img
                src={
                  friend?.profileImage?.startsWith("http")
                    ? friend.profileImage
                    : `http://localhost:5000/uploads/${friend.profileImage}`
                }
                alt={friend.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-rose-300 mr-3"
              />
              <h2 className="text-xl font-semibold text-gray-800">
                Chat with {friend.name}
              </h2>
            </div>
          )}

          <div className="flex-1 overflow-y-auto mb-4 space-y-3 bg-gray-50 p-4 rounded-lg">
            {messages.map((msg) => (
              <div
                key={msg._id}
                className={`flex ${msg.sender === user._id ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`px-4 py-2 rounded-lg max-w-xs ${
                    msg.sender === user._id
                      ? "bg-rose-500 text-white"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  {renderMessageContent(msg)}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center border-t pt-2">
            <label className="cursor-pointer mr-3">
              <FaPaperclip className="text-2xl text-gray-600 hover:text-rose-500" />
              <input
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => setSelectedFile(e.target.files[0])}
              />
            </label>

            <input
              type="text"
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              placeholder={
                selectedFile ? `Selected: ${selectedFile.name}` : "Type a message..."
              }
              className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400"
            />

            <button
              onClick={handleSend}
              className="ml-3 px-5 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full shadow-md transition flex items-center"
            >
              <IoMdSend className="text-lg mr-1" /> Send
            </button>
          </div>
        </div>
      </div>

      {previewImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-5 right-5 text-white text-3xl hover:text-gray-300"
          >
            <IoClose />
          </button>
          <img
            src={previewImage}
            alt="Preview"
            className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-lg"
          />
        </div>
      )}
    </div>
  );
};

export default ChatContainer;
