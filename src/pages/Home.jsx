// src/pages/Home.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Feed from '../components/Feed';
import Rightbar from '../components/Rightbar.jsx';

export default function Home() {
  const navigate = useNavigate();

  // Redirect to dashboard for better UX
  React.useEffect(() => {
    navigate('/dashboard');
  }, [navigate]);

  return (
    <div className="bg-gray-100 min-h-screen">
      <Navbar />
      <div className="flex justify-center px-4 md:px-12 lg:px-32 py-6">
        <Sidebar />
        <Feed />
        <Rightbar />
      </div>
    </div>
  );
}
