import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import { useSelector } from "react-redux";
import { FaHeart, FaRegHeart, FaRegComment, FaTrash } from "react-icons/fa";

const ActivityFeed = () => {
    const { user } = useSelector((state) => state.auth);
    const [activities, setActivities] = useState([]);
    const [newPost, setNewPost] = useState("");
    const [filter, setFilter] = useState("newest");
    const [commentInputs, setCommentInputs] = useState({});
    const [showCommentInput, setShowCommentInput] = useState({});
    const [feedView, setFeedView] = useState("community");

    
    useEffect(() => {
        const fetchActivities = async () => {
            try {
                const res = await axios.get(
                    `http://localhost:5000/api/activities?sortBy=${filter}`
                );
                setActivities(res.data);
            } catch (err) {
                console.error("Error fetching activities:", err);
            }
        };
        fetchActivities();
    }, [filter]);

    
    const handlePost = async () => {
        if (!newPost.trim()) return;
        try {
            const res = await axios.post("http://localhost:5000/api/activities/add", {
                userId: user._id,
                type: "custom",
                content: newPost,
            });
            setActivities((prev) => [res.data, ...prev]);
            setNewPost("");
        } catch (err) {
            console.error("Error adding post:", err);
        }
    };

   
    const handleLike = async (id) => {
        try {
            const res = await axios.put(
                `http://localhost:5000/api/activities/like/${id}`,
                { userId: user._id }
            );
            setActivities((prev) =>
                prev.map((a) => (a._id === id ? res.data : a))
            );
        } catch (err) {
            console.error("Error liking activity:", err);
        }
    };

    const handleCommentSubmit = async (id) => {
        const text = commentInputs[id];
        if (!text || !text.trim()) return;
        try {
            const res = await axios.post(`http://localhost:5000/api/activities/comment/${id}`, {
                userId: user._id,
                text,
            });
            setActivities((prev) =>
                prev.map((a) => (a._id === id ? res.data : a))
            );
            setCommentInputs((prev) => ({ ...prev, [id]: "" }));
        } catch (err) {
            console.error("Error adding comment:", err);
        }
    };

    const handleCommentChange = (id, text) => {
        setCommentInputs((prev) => ({ ...prev, [id]: text }));
    };

    const toggleCommentInput = (id) => {
        setShowCommentInput((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this post?")) return;
        try {
            await axios.delete(`http://localhost:5000/api/activities/delete/${id}`);
            setActivities((prev) => prev.filter((a) => a._id !== id));
        } catch (err) {
            console.error("Error deleting activity:", err);
        }
    };

    return (
        <div>
            <Navbar />


            <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-100">


                <div className="max-w-2xl mx-auto mt-20 p-6 bg-white shadow-lg rounded-xl">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
                        Community Activity Feed
                    </h2>

                    
                    <div className="flex mt-20 mb-6 space-x-2">
                        <input
                            type="text"
                            value={newPost}
                            onChange={(e) => setNewPost(e.target.value)}
                            placeholder="Share something new..."
                            className="flex-1 border rounded-full px-4 py-2 focus:ring-rose-400 focus:outline-none"
                        />
                        <button
                            onClick={handlePost}
                            className="bg-rose-500 text-white px-5 py-2 rounded-full hover:bg-rose-600"
                        >
                            Post
                        </button>
                    </div>

                   
                    {/* Feed Tabs */}
                    <div className="flex border-b mb-6">
                        <button
                            onClick={() => setFeedView("community")}
                            className={`flex-1 py-2 text-center font-semibold ${feedView === "community" ? "border-b-2 border-rose-500 text-rose-500" : "text-gray-500 hover:text-rose-400 transition"}`}
                        >
                            Community Feed
                        </button>
                        <button
                            onClick={() => setFeedView("mine")}
                            className={`flex-1 py-2 text-center font-semibold ${feedView === "mine" ? "border-b-2 border-rose-500 text-rose-500" : "text-gray-500 hover:text-rose-400 transition"}`}
                        >
                            My Posts
                        </button>
                    </div>

                    <div className="flex justify-end mb-3 space-x-2">
                        {["newest", "popular"].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-1 rounded-full text-sm ${filter === f
                                    ? "bg-rose-500 text-white"
                                    : "bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
                                    }`}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>

                   
                    <div className="space-y-4">
                        {activities.filter(act => 
                            feedView === "mine" 
                                ? act.user?._id === user?._id 
                                : act.user?._id !== user?._id
                        ).length === 0 && (
                            <p className="text-gray-500 text-center">No activities here yet.</p>
                        )}
                        {activities
                            .filter(act => 
                                feedView === "mine" 
                                    ? act.user?._id === user?._id 
                                    : act.user?._id !== user?._id
                            )
                            .map((act) => (
                            <div
                                key={act._id}
                                className="border rounded-lg p-4 bg-gray-50 hover:shadow-md transition"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center space-x-3">
                                        <img
                                            src={
                                                act.user?.profileImage?.startsWith("http")
                                                    ? act.user?.profileImage
                                                    : `http://localhost:5000/uploads/${act.user.profileImage}`
                                            }
                                            alt={act.user?.name}
                                            className="w-10 h-10 rounded-full border"
                                        />
                                        <span className="font-semibold text-gray-800">
                                            {act.user?.name}
                                        </span>
                                    </div>
                                    {act.user?._id === user?._id && (
                                        <button 
                                            onClick={() => handleDelete(act._id)}
                                            className="text-gray-400 hover:text-red-500 transition p-1"
                                            title="Delete Post"
                                        >
                                            <FaTrash size={14} />
                                        </button>
                                    )}
                                </div>

                                <p className="text-gray-700 mb-3">{act.content}</p>

                                <div className="flex items-center text-gray-600 text-sm space-x-4">
                                    <button
                                        onClick={() => handleLike(act._id)}
                                        className="flex items-center space-x-1 hover:text-rose-500"
                                    >
                                        {act.likes.includes(user._id) ? (
                                            <FaHeart className="text-rose-500" />
                                        ) : (
                                            <FaRegHeart />
                                        )}
                                        <span>{act.likes.length}</span>
                                    </button>
                                    <button
                                        onClick={() => toggleCommentInput(act._id)}
                                        className="flex items-center space-x-1 hover:text-blue-500"
                                    >
                                        <FaRegComment />
                                        <span>{act.comments ? act.comments.length : 0}</span>
                                    </button>
                                    <span className="ml-auto text-xs text-gray-400">
                                        {new Date(act.createdAt).toLocaleString()}
                                    </span>
                                </div>

                                {/* Comments Section */}
                                {showCommentInput[act._id] && (
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        {act.comments && act.comments.length > 0 && (
                                            <div className="space-y-3 mb-3">
                                                {act.comments.map((comment, idx) => (
                                                    <div key={idx} className="flex space-x-2">
                                                        <img
                                                            src={
                                                                comment.user?.profileImage?.startsWith("http")
                                                                    ? comment.user?.profileImage
                                                                    : `http://localhost:5000/uploads/${comment.user?.profileImage}`
                                                            }
                                                            alt={comment.user?.name}
                                                            className="w-6 h-6 rounded-full border mt-1"
                                                        />
                                                        <div className="flex-1 bg-white p-2 rounded-lg border text-sm shadow-sm">
                                                            <span className="font-semibold text-gray-800 block text-xs">
                                                                {comment.user?.name}
                                                            </span>
                                                            <span className="text-gray-700">{comment.text}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex space-x-2">
                                            <input
                                                type="text"
                                                value={commentInputs[act._id] || ""}
                                                onChange={(e) => handleCommentChange(act._id, e.target.value)}
                                                placeholder="Write a comment..."
                                                className="flex-1 border rounded-full px-3 py-1 text-sm focus:ring-rose-400 focus:outline-none"
                                            />
                                            <button
                                                onClick={() => handleCommentSubmit(act._id)}
                                                className="text-rose-500 font-semibold px-3 py-1 text-sm hover:bg-rose-50 rounded-full transition"
                                            >
                                                Post
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActivityFeed;
