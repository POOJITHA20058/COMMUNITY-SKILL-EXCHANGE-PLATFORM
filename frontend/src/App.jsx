import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import store from "./redux/store";
import { VideoSocketProvider } from "./context/VideoSocketContext";
import LandingPage from "./pages/landingPage";
import Signup from "./pages/Signup";
import Signin from "./pages/Signin";
import Dashboard from "./pages/Dashboard";
import Profile from "./User/Profile";
import UserProfile from "./User/UserProfile";
import AllUsers from "./User/AllUsers";
import RecommendMatches from "./pages/RecommendMatches";
import ViewConnections from "./pages/ViewConnections";
import UpdateProfile from "./User/UpdateProfile";
import UpcomingEvents from "./pages/UpcomingEvents";
import ChatContainer from "./pages/ChatContainer";
import VideoCallPage from "./pages/VideoCallPage";
import AIAssistant from "./pages/AIAssistant";
import ActivityFeed from "./pages/ActivityFeed";
import About from "./pages/About";
import BlockedUsers from "./pages/BlockedUsers";

function App() {
  return (
    <Provider store={store}>
      <Router>
        <VideoSocketProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/signin" element={<Signin />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/user/:id" element={<UserProfile />} />
          <Route path="/users" element={<AllUsers />} />
          <Route path="/recommend-matches" element={<RecommendMatches />} />
          <Route path="/view-connections" element={<ViewConnections />} />
          <Route path="/update-profile" element={<UpdateProfile />} />
          <Route path="/upcoming-events" element={<UpcomingEvents />} />
          <Route path="/chat/:friendId" element={<ChatContainer />} />
          <Route path="/video-call/:friendId" element={<VideoCallPage />} />
          <Route path="/ai-assistant" element={<AIAssistant />} />
          <Route path="/explore" element={<ActivityFeed/>} />
          <Route path="/blocked-users" element={<BlockedUsers />} />
          <Route path="/about" element={<About/>} />
        </Routes>
        </VideoSocketProvider>
      </Router>
    </Provider>
  );
}

export default App;
