import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { StarRatingDisplay, StarRatingInput } from "../components/StarRating";
import { ProfileVisitBadge } from "../components/ProfileVisitBadge";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

const getApiBase = () => {
  const env = import.meta.env.VITE_API_URL || "";
  const base = env.replace(/\/api\/?$/, "") || "http://localhost:5000";
  return base.startsWith("http") ? base : "http://localhost:5000";
};
const API_BASE = getApiBase();

const getImageUrl = (profileImage) => {
  if (!profileImage) return "https://icon-library.com/images/default-profile-icon/default-profile-icon-6.jpg";
  if (profileImage.startsWith("http")) return profileImage;
  return `${API_BASE}/uploads/${profileImage}`;
};

const UserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, token: reduxToken } = useSelector((state) => state.auth);
  const token = reduxToken || (currentUser && currentUser.token) || localStorage.getItem("token");

  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [myRating, setMyRating] = useState(null);
  const [ratingInput, setRatingInput] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);

  const fetchUser = useCallback(async () => {
    if (!id || !token) {
      setLoading(false);
      if (!token) setError("Please sign in to view profiles.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || "User not found");
        setProfileUser(null);
        return;
      }
      setProfileUser(data);
    } catch (err) {
      setError(err.message || "Failed to load profile");
      setProfileUser(null);
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (!currentUser?._id || !profileUser?._id || currentUser._id === profileUser._id) {
      setIsConnected(false);
      return;
    }
    const checkConnection = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/connections/${currentUser._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const list = await res.json().catch(() => []);
        const accepted = (list || []).filter((c) => c.status === "accepted");
        const connected = accepted.some(
          (c) =>
            (c.senderId?._id || c.senderId) === profileUser._id ||
            (c.receiverId?._id || c.receiverId) === profileUser._id
        );
        setIsConnected(!!connected);
      } catch {
        setIsConnected(false);
      }
    };
    checkConnection();
  }, [currentUser?._id, profileUser?._id, token]);

  useEffect(() => {
    if (!token || !profileUser?._id || currentUser?._id === profileUser._id) return;
    const fetchMyRating = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/ratings/me/${profileUser._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        setMyRating(data.rating || null);
        setRatingInput(data.rating?.value || 0);
      } catch {
        setMyRating(null);
        setRatingInput(0);
      }
    };
    fetchMyRating();
  }, [token, profileUser?._id, currentUser?._id]);

  const handleSubmitRating = async () => {
    if (!token || !profileUser?._id || ratingInput < 1 || ratingInput > 5) {
      toast.error("Please select 1–5 stars.");
      return;
    }
    setSubmittingRating(true);
    try {
      const res = await fetch(`${API_BASE}/api/ratings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ratedUserId: profileUser._id, value: ratingInput }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.message || "Failed to submit rating");
        return;
      }
      toast.success(data.message || "Rating saved");
      setProfileUser((prev) =>
        prev
          ? { ...prev, rating: data.averageRating, ratingCount: data.ratingCount }
          : null
      );
      setMyRating(data.rating || { value: ratingInput });
    } catch (err) {
      toast.error("Failed to submit rating");
    } finally {
      setSubmittingRating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-white to-red-100">
        <Navbar />
        <p className="text-center mt-24 text-gray-600">Loading profile...</p>
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-white to-red-100">
        <Navbar />
        <div className="text-center mt-24">
          <p className="text-red-600 font-medium">{error || "User not found"}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?._id === profileUser._id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-white to-red-100 flex flex-col">
      <Navbar />
      <div className="flex-grow flex justify-center mt-20 mb-10 px-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl p-8 md:p-10 flex flex-col md:flex-row items-center md:items-start relative">
          <div className="flex-shrink-0 mb-6 md:mb-0 md:mr-10">
            <img
              src={getImageUrl(profileUser.profileImage)}
              alt={profileUser.name}
              className="w-40 h-40 rounded-full object-cover border-4 border-red-400 shadow-lg"
            />
          </div>
          <div className="flex-1 text-left w-full">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h2 className="text-3xl font-bold text-gray-800">{profileUser.name}</h2>
              <ProfileVisitBadge count={profileUser.profileVisits ?? 0} />
            </div>
            <p className="text-lg text-gray-500 italic mb-2">{profileUser.bio || ""}</p>
            <div className="flex items-center gap-4 mb-4">
              <StarRatingDisplay
                value={profileUser.rating}
                count={profileUser.ratingCount ?? 0}
                showCount={true}
              />
            </div>
            <p className="text-gray-600 mb-4">{profileUser.description || ""}</p>
            <div className="space-y-1 mb-4">
              {profileUser.location && <p><strong>Location:</strong> {profileUser.location}</p>}
              {profileUser.experienceLevel && <p><strong>Experience:</strong> {profileUser.experienceLevel}</p>}
              {profileUser.availability && <p><strong>Availability:</strong> {profileUser.availability}</p>}
            </div>
            <div className="mb-4">
              <p className="font-semibold text-gray-700 mb-1">Skills Offered:</p>
              <div className="flex flex-wrap gap-2">
                {(profileUser.skillsOffered || []).length > 0
                  ? profileUser.skillsOffered.map((s, i) => {
                      let label = "";
                      if (typeof s === "string") {
                        label = s;
                      } else if (s && typeof s === "object") {
                        const name = s.name || s.skill || "";
                        label = name ? name : String(s);
                      } else {
                        label = String(s ?? "");
                      }
                      return (
                        <span key={i} className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm">
                          {label}
                        </span>
                      );
                    })
                  : "None"}
              </div>
            </div>
            <div className="mb-4">
              <p className="font-semibold text-gray-700 mb-1">Skills Wanted:</p>
              <div className="flex flex-wrap gap-2">
                {(profileUser.skillsWanted || []).length > 0
                  ? profileUser.skillsWanted.map((s, i) => (
                      <span key={i} className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                        {typeof s === "string" ? s : s?.name || s}
                      </span>
                    ))
                  : "None"}
              </div>
            </div>

            {!isOwnProfile && isConnected && (
              <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
                <p className="font-semibold text-gray-800 mb-2">Rate this user</p>
                <StarRatingInput value={ratingInput} onChange={setRatingInput} />
                <button
                  onClick={handleSubmitRating}
                  disabled={submittingRating || ratingInput < 1}
                  className="mt-3 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingRating ? "Saving..." : "Submit rating"}
                </button>
              </div>
            )}

            {!isOwnProfile && (
              <button
                onClick={() => navigate(-1)}
                className="mt-6 px-5 py-2 bg-slate-600 text-white rounded-full hover:bg-slate-700"
              >
                Go back
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
