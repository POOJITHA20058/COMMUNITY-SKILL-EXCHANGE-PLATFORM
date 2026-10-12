import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import Navbar from "../components/Navbar";

const getApiBase = () => {
  const env = import.meta.env.VITE_API_URL || "";
  const base = env.replace(/\/api\/?$/, "") || "http://localhost:5000";
  return base.startsWith("http") ? base : "http://localhost:5000";
};
const API_BASE = getApiBase();

const UpcomingEvents = () => {
  const { user, token: reduxToken } = useSelector((state) => state.auth);
  const token = reduxToken || (user && user.token) || localStorage.getItem("token");

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [visibleCount, setVisibleCount] = useState(6);
  
  // Tabs State
  const [activeTab, setActiveTab] = useState("Discover"); // "Discover" or "My Events"

  // Create/Edit Event State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [newEvent, setNewEvent] = useState({ title: "", description: "", date: "", category: "Workshop", image: "" });

  const fetchEvents = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/events`);
      setEvents(res.data);
    } catch (err) {
      console.error("Error fetching events:", err);
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const getDaysLeft = (eventDate) => {
    const today = new Date();
    const date = new Date(eventDate);
    const diff = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
    return diff > 0 ? `${diff} days left` : "Event completed";
  };

  const filteredEvents = events
    .filter((event) =>
      event.title.toLowerCase().includes(search.toLowerCase())
    )
    .filter((event) => (category === "All" ? true : event.category === category));

  const myEvents = filteredEvents.filter(event => user && event.creator?._id === user._id);
  const otherEvents = filteredEvents.filter(event => !user || event.creator?._id !== user._id);
  
  const displayedEvents = (activeTab === "My Events" ? myEvents : otherEvents).slice(0, visibleCount);

  const handleEnrollClick = async (event) => {
    if (!user) {
      toast.error("Please login to enroll in events");
      return;
    }
    try {
      await axios.post(
        `${API_BASE}/api/events/${event._id}/enroll`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Successfully enrolled in ${event.title}!`);
      fetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to enroll");
    }
  };

  const openCreateModal = () => {
    setEditingEvent(null);
    setNewEvent({ title: "", description: "", date: "", category: "Workshop", image: "" });
    setShowCreateModal(true);
  };

  const openEditModal = (event) => {
    setEditingEvent(event);
    setNewEvent({
      title: event.title,
      description: event.description,
      date: new Date(event.date).toISOString().slice(0, 16),
      category: event.category,
      image: event.image
    });
    setShowCreateModal(true);
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      await axios.delete(`${API_BASE}/api/events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Event deleted successfully");
      fetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete event");
    }
  };

  const handleCreateOrUpdateEvent = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Login required to manage events");
      return;
    }
    try {
      if (editingEvent) {
        await axios.put(
          `${API_BASE}/api/events/${editingEvent._id}`,
          newEvent,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Event updated successfully!");
      } else {
        await axios.post(
          `${API_BASE}/api/events`,
          newEvent,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Event created successfully!");
      }
      setShowCreateModal(false);
      setNewEvent({ title: "", description: "", date: "", category: "Workshop", image: "" });
      setEditingEvent(null);
      fetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save event");
    }
  };

  return (
    <div className="bg-[#f8f9fc] min-h-screen font-sans overflow-x-hidden relative">
      {/* Decorative Blob Backgrounds for Glassmorphism Effect */}
      <div className="absolute top-0 left-[-10%] w-[500px] h-[500px] bg-red-400/20 rounded-full blur-[100px] z-0 pointer-events-none"></div>
      <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-purple-400/20 rounded-full blur-[100px] z-0 pointer-events-none"></div>

      <div className="relative z-10">
        <Navbar />

        {/* Toolbar Section */}
        <div className="pt-28 pb-6 px-6 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            
            <div className="flex flex-1 w-full gap-4 flex-col md:flex-row">
              <div className="relative w-full">
                <span className="absolute inset-y-0 left-4 flex items-center text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </span>
                <input
                  type="text"
                  placeholder="Search amazing events..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white border border-gray-200 text-gray-800 rounded-2xl pl-12 pr-4 py-3 focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all placeholder-gray-400 font-medium shadow-sm"
                />
              </div>
              
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full md:w-56 bg-white border border-gray-200 text-gray-700 font-medium rounded-2xl px-4 py-3 focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all cursor-pointer shadow-sm"
              >
                <option value="All">All Categories</option>
                <option value="Workshop">Workshop</option>
                <option value="Meetup">Meetup</option>
                <option value="Bootcamp">Bootcamp</option>
                <option value="Seminar">Seminar</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <button
              onClick={openCreateModal}
              className="w-full md:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold px-8 py-3 rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-pink-500/30 transform hover:-translate-y-0.5 whitespace-nowrap shadow-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              Host Event
            </button>
          </div>

          {/* Pill Tabs */}
          <div className="flex justify-center mt-12 mb-10">
            <div className="bg-gray-200/60 backdrop-blur-md p-1.5 rounded-full inline-flex border border-gray-300/50 shadow-sm relative">
              <button
                onClick={() => setActiveTab("Discover")}
                className={`relative z-10 px-8 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 ${
                  activeTab === "Discover" ? "text-white" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {activeTab === "Discover" && (
                  <div className="absolute inset-0 bg-gray-900 rounded-full shadow-md transition-all -z-10"></div>
                )}
                Explore Events
              </button>
              
              {user && (
                <button
                  onClick={() => setActiveTab("My Events")}
                  className={`relative z-10 px-8 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 ${
                    activeTab === "My Events" ? "text-white" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {activeTab === "My Events" && (
                    <div className="absolute inset-0 bg-gray-900 rounded-full shadow-md transition-all -z-10"></div>
                  )}
                  My Events
                </button>
              )}
            </div>
          </div>

          {/* Events Grid */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              <div className="col-span-full flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
              </div>
            ) : displayedEvents.length === 0 ? (
              <div className="col-span-full text-center py-16 bg-white/50 backdrop-blur-md rounded-3xl border border-gray-100 shadow-sm">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-xl font-medium text-gray-500">No events found.</p>
                <p className="text-gray-400 mt-2">Try adjusting your filters or search term.</p>
              </div>
            ) : (
              displayedEvents.map((event) => {
                const isEnrolled = user && event.enrolledUsers?.includes(user._id);
                return (
                  <div
                    key={event._id}
                    className="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col"
                  >
                    <div className="relative h-56 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent z-10"></div>
                      <img
                        src={event.image || "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80"}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                      <div className="absolute top-4 left-4 z-20">
                        <span className="bg-white/90 backdrop-blur text-pink-600 font-bold text-xs uppercase tracking-wider px-3 py-1.5 rounded-full shadow-sm">
                          {event.category}
                        </span>
                      </div>
                      <div className="absolute bottom-4 left-4 z-20">
                        <h2 className="text-xl font-bold text-white leading-tight drop-shadow-sm mb-1">
                          {event.title}
                        </h2>
                        <div className="flex items-center text-white/90 text-sm font-medium">
                          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                          {new Date(event.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6 flex flex-col flex-grow">
                      <p className="text-gray-600 text-sm line-clamp-3 hover:line-clamp-none transition-all leading-relaxed mb-4 flex-grow">
                        {event.description}
                      </p>
                      
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex -space-x-2">
                          {/* Placeholder for attendees avatars - could be actual avatars in real data */}
                          <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-xs font-bold text-blue-600">👤</div>
                          <div className="w-8 h-8 rounded-full bg-purple-100 border-2 border-white flex items-center justify-center text-xs font-bold text-purple-600">👤</div>
                          <div className="w-8 h-8 rounded-full bg-pink-100 border-2 border-white flex items-center justify-center text-xs font-bold text-pink-600 z-10">
                            +{event.enrolledUsers?.length || 0}
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-pink-500 bg-pink-50 px-3 py-1 rounded-full">
                          {getDaysLeft(event.date)}
                        </span>
                      </div>

                      <div className="pt-4 border-t border-gray-100 mt-auto">
                        {activeTab === "My Events" ? (
                          <div className="flex gap-3">
                            <button
                              onClick={() => openEditModal(event)}
                              className="flex-1 py-2.5 rounded-xl font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                            >
                              Edit Details
                            </button>
                            <button
                              onClick={() => handleDeleteEvent(event._id)}
                              className="flex-1 py-2.5 rounded-xl font-semibold bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 transition-colors"
                            >
                              Delete Event
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEnrollClick(event)}
                            disabled={isEnrolled}
                            className={`w-full py-3 rounded-xl font-bold transition-all duration-300 ${
                              isEnrolled 
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                                : "bg-gray-900 text-white hover:bg-black shadow-md hover:shadow-xl hover:-translate-y-0.5"
                            }`}
                          >
                            {isEnrolled ? "✓ Registered" : "Reserve Your Spot"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {visibleCount < (activeTab === "My Events" ? myEvents.length : otherEvents.length) && (
            <div className="flex justify-center mt-14">
              <button
                onClick={() => setVisibleCount((prev) => prev + 3)}
                className="px-8 py-3 rounded-full font-bold text-gray-700 bg-white border border-gray-200 shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-300"
              >
                Load More Events
              </button>
            </div>
          )}
        </div>

        {/* Modal Overlay */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowCreateModal(false)}></div>
            <div className="relative bg-white rounded-[2rem] w-full max-w-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col max-h-[90vh]">
              
              <div className="bg-gradient-to-r from-red-500 to-pink-500 px-8 py-6 flex justify-between items-center text-white shrink-0">
                <h2 className="text-2xl font-bold tracking-tight">
                  {editingEvent ? "Edit Masterpiece" : "Host a New Event"}
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-8 overflow-y-auto">
                <form onSubmit={handleCreateOrUpdateEvent} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 pl-1">Event Title</label>
                    <input
                      type="text"
                      required
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 focus:ring-2 focus:ring-pink-500/40 focus:border-pink-500 focus:bg-white outline-none transition-all placeholder-gray-400 font-medium"
                      placeholder="e.g. Next.js Masterclass"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 pl-1">Description</label>
                    <textarea
                      required
                      rows="4"
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 focus:ring-2 focus:ring-pink-500/40 focus:border-pink-500 focus:bg-white outline-none resize-none transition-all placeholder-gray-400"
                      placeholder="What will attendees learn? What is the agenda?"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-700 pl-1">Date & Time</label>
                      <input
                        type="datetime-local"
                        required
                        value={newEvent.date}
                        onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 focus:ring-2 focus:ring-pink-500/40 focus:border-pink-500 focus:bg-white outline-none transition-all font-medium"
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-700 pl-1">Category</label>
                      <select
                        value={newEvent.category}
                        onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 focus:ring-2 focus:ring-pink-500/40 focus:border-pink-500 focus:bg-white outline-none transition-all font-medium"
                      >
                        <option value="Workshop">Workshop</option>
                        <option value="Meetup">Meetup</option>
                        <option value="Bootcamp">Bootcamp</option>
                        <option value="Seminar">Seminar</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 pl-1">Cover Image URL (Optional)</label>
                    <input
                      type="url"
                      value={newEvent.image}
                      onChange={(e) => setNewEvent({ ...newEvent, image: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 focus:ring-2 focus:ring-pink-500/40 focus:border-pink-500 focus:bg-white outline-none transition-all placeholder-gray-400 font-medium"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  
                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full font-bold bg-gray-900 text-white hover:bg-black py-4 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-lg"
                    >
                      {editingEvent ? "Save Changes" : "Publish Event"}
                    </button>
                    {editingEvent && (
                      <button
                        type="button"
                        onClick={() => setShowCreateModal(false)}
                        className="w-full font-semibold text-gray-500 hover:text-gray-800 py-3 mt-2 rounded-xl transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpcomingEvents;
