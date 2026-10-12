import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { StarRatingDisplay } from "../components/StarRating";
import { ProfileVisitBadge } from "../components/ProfileVisitBadge";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setError("Not authenticated");
          setLoading(false);
          return;
        }

        const response = await fetch("http://localhost:5000/api/auth/profile", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch profile");
        }

        setUser(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) return <p className="text-center mt-10 text-lg">Loading...</p>;
  if (error) return <p className="text-center mt-10 text-red-500">{error}</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-white to-red-100 flex flex-col">
      <Navbar />

      <div className="flex justify-center items-center flex-grow mt-20 mb-10">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl p-10 flex flex-col md:flex-row items-center md:items-start relative">

          {/* Profile Image */}
          <div className="flex-shrink-0 mb-6 md:mb-0 md:mr-10">
            <img
              src={
                user?.profileImage?.startsWith("http")
                  ? user.profileImage
                  : `http://localhost:5000/uploads/${user.profileImage}`
              }
              alt="Profile"
              className="w-48 h-48 rounded-full object-cover border-4 border-red-400 shadow-lg"
            />
          </div>

          <div className="flex-1 text-left">

            <p className="text-red-500 font-semibold text-lg mb-1">
              HELLO I’M
            </p>

            <h2 className="text-4xl font-bold text-gray-800 mb-1">
              {user?.name}
            </h2>

            <h3 className="text-xl text-gray-500 italic mb-2">
              {user?.bio || "Developer"}
            </h3>

            <div className="flex items-center gap-3 mb-4">
              <StarRatingDisplay
                value={user?.rating}
                count={user?.ratingCount ?? 0}
                showCount={true}
              />
              <ProfileVisitBadge count={user?.profileVisits ?? 0} />
            </div>

            <p className="text-gray-600 mb-6">
              {user?.description ||
                "I enjoy learning and sharing skills through technology."}
            </p>

            {/* User Info */}
            <div className="space-y-2 mb-6">
              <p>
                <strong>Email:</strong> {user?.email}
              </p>

              <p>
                <strong>Location:</strong>{" "}
                {user?.location || "Not specified"}
              </p>

              <p>
                <strong>Experience:</strong>{" "}
                {user?.experienceLevel || "N/A"}
              </p>

              <p>
                <strong>Availability:</strong>{" "}
                {user?.availability || "N/A"}
              </p>
            </div>

            <div className="mb-4">
  <p className="font-semibold text-gray-700 mb-1">Skills Offered:</p>

  <div className="flex flex-wrap gap-2">
    {Array.isArray(user?.skillsOffered) && user.skillsOffered.length > 0 ? (
      user.skillsOffered.map((skill, index) => {
        const skillName =
          typeof skill === "string"
            ? skill
            : skill?.name || skill?.skill || "";

        return (
          <span
            key={index}
            className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium"
          >
            {skillName}
          </span>
        );
      })
    ) : (
      <span>None</span>
    )}
  </div>
</div>

            {/* Skills Wanted */}
            <div className="mb-4">
              <p className="font-semibold text-gray-700 mb-1">
                Skills Wanted:
              </p>

              <div className="flex flex-wrap gap-2">
                {user?.skillsWanted?.length > 0 ? (
                  user.skillsWanted.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <span>None</span>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex space-x-4 mt-6">
              <button
                onClick={() =>
                  navigate("/update-profile", { state: { user } })
                }
                className="bg-red-500 text-white px-5 py-2 rounded-full hover:bg-red-600 transition-all shadow-md"
              >
                Edit Profile
              </button>

              <div className="flex items-center space-x-3">
                <a href="#" className="text-gray-600 hover:text-red-500 text-xl">
                  <i className="fab fa-facebook"></i>
                </a>

                <a href="#" className="text-gray-600 hover:text-red-500 text-xl">
                  <i className="fab fa-linkedin"></i>
                </a>

                <a href="#" className="text-gray-600 hover:text-red-500 text-xl">
                  <i className="fab fa-twitter"></i>
                </a>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;