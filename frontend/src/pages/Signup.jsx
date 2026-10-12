import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const Signup = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    skillsOffered: "",
    skillsWanted: "",
    bio: "",
    location: "",
    experienceLevel: "Beginner",
    availability: "Weekends",
    linkedin: "",
    github: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validateField = (name, value) => {
    let msg = "";
    const lettersOnly = /^[A-Za-z\s]+$/;
    const skillsRegex = /^[A-Za-z\s,]+$/;

    if (name === "name") {
      if (value.trim().length < 3) msg = "Name must be at least 3 characters.";
      else if (!lettersOnly.test(value))
        msg = "Name should contain only letters.";
    }

    if (name === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) msg = "Enter a valid email address.";
    }

    if (name === "password") {
      if (value.length < 6) msg = "Password must be at least 6 characters.";
      else if (!/(?=.*[A-Za-z])(?=.*\d)/.test(value))
        msg = "Password must include at least 1 letter and 1 number.";
      else if (/\s/.test(value)) msg = "Password cannot contain spaces.";
    }

    if (name === "skillsOffered") {
      if (!skillsRegex.test(value))
        msg = "Skills can include letters, spaces, and commas only.";
    }

    if (name === "skillsWanted") {
      if (!skillsRegex.test(value))
        msg = "Skills can include letters, spaces, and commas only.";
    }

    if (name === "bio") {
      if (value.trim().length < 10) msg = "Bio must be at least 10 characters.";
     
    }

    if (name === "location") {
      if (value.trim().length < 2) msg = "Enter a valid location.";
    }

    if (
      (name === "linkedin" || name === "github") &&
      value.trim() !== "" &&
      !value.startsWith("http")
    )
      msg = "URL must start with http or https.";

    return msg;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const validationMsg = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: validationMsg }));
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const hasErrors = Object.values(errors).some((msg) => msg !== "");
    if (hasErrors) {
      setError("Please fix all errors before submitting.");
      setLoading(false);
      return;
    }

    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => data.append(key, formData[key]));

      const response = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        body: data,
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.message || "Signup failed. Check your details and try again.");

      navigate("/signin");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <Navbar />

      <div className="max-w-4xl mx-auto mt-20 bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold text-center text-red-500 mb-6">
          Join SkillExchange
        </h2>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700">Full Name</label>
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
            <label className="block text-gray-700">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg"
            />
            {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-gray-700">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg"
            />
            {errors.password && (
              <p className="text-red-500 text-sm">{errors.password}</p>
            )}
          </div>

          <div>
            <label className="block text-gray-700">Skills You Can Teach</label>
            <input
              type="text"
              name="skillsOffered"
              value={formData.skillsOffered}
              onChange={handleChange}
              placeholder="e.g., Java, Python, Communication"
              className="w-full px-4 py-2 border rounded-lg"
            />
            {errors.skillsOffered && (
              <p className="text-red-500 text-sm">{errors.skillsOffered}</p>
            )}
          </div>

          <div>
            <label className="block text-gray-700">Skills You Want to Learn</label>
            <input
              type="text"
              name="skillsWanted"
              value={formData.skillsWanted}
              onChange={handleChange}
              placeholder="e.g., UI Design, Leadership, SQL"
              className="w-full px-4 py-2 border rounded-lg"
            />
            {errors.skillsWanted && (
              <p className="text-red-500 text-sm">{errors.skillsWanted}</p>
            )}
          </div>

          <div>
            <label className="block text-gray-700">Short Bio</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg"
            />
            {errors.bio && <p className="text-red-500 text-sm">{errors.bio}</p>}
          </div>

          <div>
            <label className="block text-gray-700">Location</label>
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
            <label className="block text-gray-700">Experience Level</label>
            <select
              name="experienceLevel"
              value={formData.experienceLevel}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-700">Availability</label>
            <select
              name="availability"
              value={formData.availability}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="Weekends">Weekends</option>
              <option value="Evenings">Evenings</option>
              <option value="Flexible">Flexible</option>
            </select>
          </div>



          <button
            type="submit"
            className="w-full bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 transition"
            disabled={loading}
          >
            {loading ? "Signing up..." : "Sign Up"}
          </button>
        </form>

        <p className="text-center mt-4">
          Already have an account?{" "}
          <a href="/signin" className="text-red-500 hover:underline">
            Sign In
          </a>
        </p>
      </div>
    </div>
  );
};

export default Signup;
