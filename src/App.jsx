import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import AuthProvider from "./contexts/AuthContext";
import ChatProvider from "./contexts/ChatContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

// Lazy load pages for code splitting
const Login = lazy(() => import("./pages/Login"));
const Home = lazy(() => import("./pages/Home"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const PublishPaper = lazy(() => import("./pages/PublishPaper"));
const Papers = lazy(() => import("./pages/Papers"));
const PaperView = lazy(() => import("./pages/PaperView"));
const Network = lazy(() => import("./pages/Network"));
const Profile = lazy(() => import("./pages/Profile"));
const SocialFeed = lazy(() => import("./pages/SocialFeed"));
const CreatePost = lazy(() => import("./pages/CreatePost"));
const Chat = lazy(() => import("./pages/Chat"));

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <ChatProvider>
      <Router>
          <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Protected Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Navbar />
                  <Suspense fallback={<PageLoader />}>
              <Home />
                  </Suspense>
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Navbar />
                  <Suspense fallback={<PageLoader />}>
              <Dashboard />
                  </Suspense>
            </ProtectedRoute>
          } />
          
          <Route path="/publish" element={
            <ProtectedRoute>
              <Navbar />
                  <Suspense fallback={<PageLoader />}>
              <PublishPaper />
                  </Suspense>
            </ProtectedRoute>
          } />
          
          <Route path="/papers" element={
            <ProtectedRoute>
              <Navbar />
                  <Suspense fallback={<PageLoader />}>
              <Papers />
                  </Suspense>
            </ProtectedRoute>
          } />
          
          <Route path="/paper/:id" element={
            <ProtectedRoute>
              <Navbar />
                  <Suspense fallback={<PageLoader />}>
              <PaperView />
                  </Suspense>
            </ProtectedRoute>
          } />
          
          <Route path="/network" element={
            <ProtectedRoute>
              <Navbar />
                  <Suspense fallback={<PageLoader />}>
              <Network />
                  </Suspense>
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <Navbar />
                  <Suspense fallback={<PageLoader />}>
              <Profile />
                  </Suspense>
            </ProtectedRoute>
          } />
          
          <Route path="/profile/:id" element={
            <ProtectedRoute>
              <Navbar />
                  <Suspense fallback={<PageLoader />}>
              <Profile />
                  </Suspense>
            </ProtectedRoute>
          } />
          
          <Route path="/feed" element={
            <ProtectedRoute>
              <Navbar />
                  <Suspense fallback={<PageLoader />}>
              <SocialFeed />
                  </Suspense>
            </ProtectedRoute>
          } />
          
          <Route path="/create-post" element={
            <ProtectedRoute>
              <Navbar />
                  <Suspense fallback={<PageLoader />}>
              <CreatePost />
                  </Suspense>
            </ProtectedRoute>
          } />
          
          <Route path="/chat" element={
            <ProtectedRoute>
              <Navbar />
                  <Suspense fallback={<PageLoader />}>
              <Chat />
                  </Suspense>
            </ProtectedRoute>
          } />
        </Routes>
          </Suspense>
      </Router>
      </ChatProvider>
    </AuthProvider>
  );
}
export default App;
