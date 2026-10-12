import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Navbar from "../components/Navbar";
import { updateUserProfile } from "../redux/authSlice";

const UpdateProfile = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth.user);
  const userData = state?.user || currentUser;

  const [formData, setFormData] = useState({
    name: userData?.name || "",
    email: userData?.email || "",
    bio: userData?.bio || "",
    location: userData?.location || "",
    experienceLevel: userData?.experienceLevel || "Beginner",
    availability: userData?.availability || "Flexible",
    skillsOffered: userData?.skillsOffered?.map(s => typeof s === 'string' ? s : s.name).join(", ") || "",
    skillsWanted: userData?.skillsWanted?.join(", ") || "",
    linkedin: userData?.linkedin || "",
    github: userData?.github || "",
    profileImage: null,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validateField = (name, value) => {
    let msg = "";
    if (name === "name") {
      const regex = /^[A-Za-z\s]+$/;
      if (value.trim().length < 3) msg = "Name must be at least 3 characters.";
      else if (!regex.test(value)) msg = "Name must contain only letters.";
    }
    if (name === "email") {
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!regex.test(value)) msg = "Enter a valid email.";
    }
    if (name === "bio") {
      const regex = /^[A-Za-z\s]+$/;
      if (value.trim().length < 10) msg = "Bio must be at least 10 characters.";
      else if (!regex.test(value)) msg = "Bio must contain only letters.";
    }
    if (name === "location" && value.trim().length < 2) {
      msg = "Enter a valid location.";
    }
    if (name === "linkedin" || name === "github") {
      if (value.trim() !== "" && !value.startsWith("http")) {
        msg = "URL must start with http or https.";
      }
    }
    if (name === "skillsOffered" || name === "skillsWanted") {
      const regex = /^[A-Za-z,\s]+$/;
      if (!regex.test(value)) msg = "Skills must contain only letters and commas.";
    }
    return msg;
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name !== "profileImage") {
      const validationMsg = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: validationMsg }));
    }

    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const hasErrors = Object.values(errors).some((m) => m);
    if (hasErrors) {
      setError("Please fix errors before submitting.");
      setLoading(false);
      return;
    }

    const token = localStorage.getItem("token");
    const data = new FormData();

    const offeredArray = formData.skillsOffered
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s);

    const wantedArray = formData.skillsWanted
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s);

    data.append("name", formData.name);
    data.append("email", formData.email);
    data.append("bio", formData.bio);
    data.append("location", formData.location);
    data.append("experienceLevel", formData.experienceLevel);
    data.append("availability", formData.availability);
    data.append("linkedin", formData.linkedin);
    data.append("github", formData.github);
    data.append("skillsOffered", JSON.stringify(offeredArray));
    data.append("skillsWanted", JSON.stringify(wantedArray));

    if (formData.profileImage) {
      data.append("profileImage", formData.profileImage);
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/users/update-profile",
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
          body: data,
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Update failed");

      const updatedUser = { ...currentUser, ...result.user };
      dispatch(updateUserProfile(result.user));
      localStorage.setItem("user", JSON.stringify(updatedUser));

      alert("Profile updated successfully");
      navigate("/profile");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <Navbar />

      <div className="max-w-4xl mx-auto mt-16 bg-white p-8 rounded-2xl shadow-lg">
        <h2 className="text-3xl font-bold text-center text-red-500 mb-6">
          Update Your Profile
        </h2>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-5" encType="multipart/form-data">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg"
              />
              {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg"
              />
              {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1">Short Bio</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg"
            />
            {errors.bio && <p className="text-red-500 text-sm">{errors.bio}</p>}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg"
              />
              {errors.location && (
                <p className="text-red-500 text-sm">{errors.location}</p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1">Experience Level</label>
              <select
                name="experienceLevel"
                value={formData.experienceLevel}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Availability</label>
              <select
                name="availability"
                value={formData.availability}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option>Weekends</option>
                <option>Evenings</option>
                <option>Flexible</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1">Profile Image</label>
              <input
                type="file"
                name="profileImage"
                accept="image/*"
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1">Skills You Can Teach</label>
            <input
              type="text"
              name="skillsOffered"
              value={formData.skillsOffered}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg"
            />
            {errors.skillsOffered && (
              <p className="text-red-500 text-sm">{errors.skillsOffered}</p>
            )}
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1">Skills You Want to Learn</label>
            <input
              type="text"
              name="skillsWanted"
              value={formData.skillsWanted}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg"
            />
            {errors.skillsWanted && (
              <p className="text-red-500 text-sm">{errors.skillsWanted}</p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 font-semibold mb-1">LinkedIn</label>
              <input
                type="url"
                name="linkedin"
                value={formData.linkedin}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg"
              />
              {errors.linkedin && (
                <p className="text-red-500 text-sm">{errors.linkedin}</p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1">GitHub</label>
              <input
                type="url"
                name="github"
                value={formData.github}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg"
              />
              {errors.github && <p className="text-red-500 text-sm">{errors.github}</p>}
            </div>
          </div>

          <div className="text-center pt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-red-500 text-white px-8 py-2 rounded-full hover:bg-red-600 transition-all"
            >
              {loading ? "Updating..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateProfile;
