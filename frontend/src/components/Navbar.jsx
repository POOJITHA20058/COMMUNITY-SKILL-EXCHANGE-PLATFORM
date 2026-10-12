import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../redux/authSlice";
import { FaUserCircle, FaBell } from "react-icons/fa";
import { HiDotsVertical, HiX, HiMenu } from "react-icons/hi";
import { useVideoSocket } from "../context/VideoSocketContext";
import axios from "axios";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token } = useSelector((state) => state.auth);
  
  const [showNotifications, setShowNotifications] = useState(false);
  const socketCtx = useVideoSocket();
  const notifications = socketCtx?.notifications || [];
  const setNotifications = socketCtx?.setNotifications || (() => {});
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleReadNotification = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  return (
    <nav className="bg-white shadow-md fixed w-full top-0 left-0 z-10">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo */}
        <a href="/" className="text-2xl font-bold text-red-500">
          SkillExchange
        </a>

        {/* Desktop Menu */}
        <div className="hidden md:flex space-x-6">
          <a href="#home" className="text-gray-700 hover:text-red-500">
            Home
          </a>
          <a href="#skills" className="text-gray-700 hover:text-red-500">
            Skills
          </a>
          <a href="#testimonials" className="text-gray-700 hover:text-red-500">
            Testimonials
          </a>
          <a href="/about" className="text-gray-700 hover:text-red-500">
            About
          </a>
          
        </div>

        {/* User Auth Section */}
        <div className="hidden md:flex space-x-4 items-center relative">
          {token ? (
            <div className="flex items-center space-x-4">
              <Link to="/users" className="block px-4 py-2 text-gray-700">
                Community Hub
              </Link>
              <Link to="/ai-assistant" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                AI Assistant
              </Link>

              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative text-gray-600 hover:text-red-500 focus:outline-none mt-2"
                >
                  <FaBell className="text-2xl" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                      {unreadCount}
                    </span>
                  )}
                </button>
                
                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-4 w-72 bg-white border border-gray-100 shadow-xl rounded-lg py-2 max-h-96 overflow-y-auto z-50">
                    <h3 className="px-4 py-2 font-bold text-gray-800 border-b">Notifications</h3>
                    {notifications.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-gray-500 text-center">No new notifications</p>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n._id}
                          onClick={() => handleReadNotification(n._id)}
                          className={`px-4 py-3 border-b cursor-pointer hover:bg-gray-50 flex items-start space-x-3 transition ${n.isRead ? "opacity-60" : "bg-red-50"}`}
                        >
                          <img
                            src={
                              n.sender?.profileImage?.startsWith("http")
                                ? n.sender?.profileImage
                                : `http://localhost:5000/uploads/${n.sender?.profileImage || "default.png"}`
                            }
                            alt="Sender"
                            className="w-8 h-8 rounded-full border object-cover"
                          />
                          <div className="flex-1">
                            <p className="text-sm text-gray-800">
                              <span className="font-semibold">{n.sender?.name}</span> {n.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* User Image or Default Icon */}
              {user?.profileImage? (
                <img
                  src={
                    user.profileImage.startsWith("http")
                      ? user.profileImage
                      : `http://localhost:5000/uploads/${user.profileImage}`
                  }
                  alt={user.name || "User"}
                  className="w-10 h-10 rounded-full border-2 border-gray-300 object-cover"
                />
              ) : (
                <FaUserCircle className="text-3xl text-gray-700" />
              )}


              {/* User Name */}
              <span className="text-gray-700 font-semibold">
                {user?.name || "User"}
              </span>

              {/* Three Dot Menu */}
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="focus:outline-none"
              >
                <HiDotsVertical className="text-2xl text-gray-700 cursor-pointer" />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-40 left-12 w-44 bg-white shadow-lg rounded-lg py-2">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    Profile
                  </Link>
                  <Link
                    to="/blocked-users"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    Blocked Users
                  </Link>
                  <Link
                    to="/dashboard"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/ai-assistant"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    AI Assistant
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/signin">
                <button className="bg-gray-200 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-300">
                  Log In
                </button>
              </Link>
              <Link to="/signup">
                <button className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">
                  Sign Up
                </button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-gray-700 focus:outline-none"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <HiX className="text-3xl" /> : <HiMenu className="text-3xl" />}
        </button>
      </div>

      {/* Mobile Sidebar Menu */}
      <div
        className={`fixed inset-0 bg-gray-800 bg-opacity-75 z-50 transition-transform ${isOpen ? "translate-x-0" : "-translate-x-full"
          } md:hidden`}
      >
        <div className="bg-white w-64 h-full shadow-lg p-6 relative">
          <button
            className="absolute top-4 right-4 text-gray-700"
            onClick={() => setIsOpen(false)}
          >
            <HiX className="text-3xl" />
          </button>

          {/* Mobile Navigation Links */}
          <nav className="flex flex-col space-y-4 mt-6">
            <a href="#home" className="text-gray-700 hover:text-red-500">
              Home
            </a>
            <a href="#skills" className="text-gray-700 hover:text-red-500">
              Skills
            </a>
            <a href="#testimonials" className="text-gray-700 hover:text-red-500">
              Testimonials
            </a>
            <a href="#contact" className="text-gray-700 hover:text-red-500">
              Contact
            </a>
          </nav>

          {/* Mobile User Menu */}
          <div className="mt-6">
            {token ? (
              <>
                <div className="flex items-center space-x-3 border-b pb-4">
                  {user?.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt="Profile"
                      className="w-10 h-10 rounded-full border-2 border-gray-300 object-cover"
                    />
                  ) : (
                    <FaUserCircle className="text-3xl text-gray-700" />
                  )}
                  <span className="text-gray-700 font-semibold">
                    {user?.name || "User"}
                  </span>
                </div>

                <Link
                  to="/users"
                  className="block w-full px-4 py-2 text-gray-700 hover:bg-gray-100 mt-4"
                >
                  Community Hub
                </Link>
                <Link
                  to="/profile"
                  className="block w-full px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  Profile
                </Link>
                <Link
                  to="/blocked-users"
                  className="block w-full px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  Blocked Users
                </Link>
                <Link
                  to="/ai-assistant"
                  className="block w-full px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  AI Assistant
                </Link>
                <Link
                  to="/my-skills"
                  className="block w-full px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  My Skills
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 mt-2"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/signin">
                  <button className="w-full bg-gray-200 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-300">
                    Log In
                  </button>
                </Link>
                <Link to="/signup">
                  <button className="w-full mt-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">
                    Sign Up
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
