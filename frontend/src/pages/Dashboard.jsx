import React, { useState } from "react";
import Navbar from "../components/Navbar";
import { useSelector } from "react-redux";
import {
  FaUserCircle,
  FaChalkboardTeacher,
  FaCalendarAlt,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  return (
    <div className="bg-gray-100 min-h-screen">
      <Navbar />

      <div className="container mx-auto px-6 py-10 mt-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">
          Welcome, {user?.name || "User"} 
        </h2>

        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          
          <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition duration-300 text-center">
            <FaUserCircle className="text-6xl text-gray-400 mb-4 mx-auto" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{user?.name}</h3>
            <p className="text-gray-500 mb-2">{user?.email}</p>
            <p className="text-gray-600 mb-1">
              <strong>Location:</strong> {user?.location || "N/A"}
            </p>
            <p className="text-gray-600">
              <strong>Experience:</strong> {user?.experienceLevel || "N/A"}
            </p>
          </div>

          
          <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition duration-300 flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FaChalkboardTeacher className="text-red-500" /> Recommended Matches
              </h3>
              <p className="text-gray-700 mb-4">
                Find people who want to learn what you teach and vice versa!
              </p>
            </div>
            <button
              className="mt-auto bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
              onClick={() => navigate("/recommend-matches")}
            >
              View Matches
            </button>
          </div>

 <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition duration-300 flex flex-col justify-between">
            <div className="flex items-center gap-4 mb-4">
              <FaCalendarAlt className="text-4xl text-blue-500" />
              <h3 className="text-xl font-semibold text-gray-900">Upcoming Events</h3>
            </div>
            <p className="text-gray-700 mb-4">
              Join skill-sharing workshops & community events!
            </p>
            <button
              className="mt-auto bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
              onClick={() => navigate("/upcoming-events")}
            >
              View Events
            </button>
          </div>
        </div>

       
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 justify-center">
          <div
            onClick={() => navigate("/view-connections")}
            className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition cursor-pointer text-center border border-gray-200"
          >
            <h3 className="text-xl font-semibold text-black mb-2">Connections</h3>
            <p className="text-gray-600 mb-4">
              View and manage your skill exchange connections
            </p>
            <button className="bg-red-500 hover:bg-black text-white py-2 px-4 rounded-lg transition-colors">
              View Connections
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
