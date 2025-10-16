import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AuthProvider from "./contexts/AuthContext";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import PublishPaper from "./pages/PublishPaper";
import Papers from "./pages/Papers";
import PaperView from "./pages/PaperView";
import Network from "./pages/Network";
import Profile from "./pages/Profile";
import SocialFeed from "./pages/SocialFeed";
import CreatePost from "./pages/CreatePost";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Protected Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Navbar />
              <Home />
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Navbar />
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/publish" element={
            <ProtectedRoute>
              <Navbar />
              <PublishPaper />
            </ProtectedRoute>
          } />
          
          <Route path="/papers" element={
            <ProtectedRoute>
              <Navbar />
              <Papers />
            </ProtectedRoute>
          } />
          
          <Route path="/paper/:id" element={
            <ProtectedRoute>
              <Navbar />
              <PaperView />
            </ProtectedRoute>
          } />
          
          <Route path="/network" element={
            <ProtectedRoute>
              <Navbar />
              <Network />
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <Navbar />
              <Profile />
            </ProtectedRoute>
          } />
          
          <Route path="/feed" element={
            <ProtectedRoute>
              <Navbar />
              <SocialFeed />
            </ProtectedRoute>
          } />
          
          <Route path="/create-post" element={
            <ProtectedRoute>
              <Navbar />
              <CreatePost />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
export default App;
