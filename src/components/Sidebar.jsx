// src/components/Sidebar.jsx
export default function Sidebar() {
    return (
      <aside className="hidden md:block w-64 mr-8">
        <div className="bg-white rounded shadow p-6">
          <img className="w-16 h-16 rounded-full mx-auto mb-3" src="/profile.jpg" alt="Profile" />
          <h3 className="font-bold text-center text-lg mb-3">Dr. Alex Singh</h3>
          <p className="text-sm text-gray-500 text-center mb-6">AI Researcher | IIT Delhi</p>
          <div className="space-y-2">
            <a href="/profile" className="block text-blue-700 hover:underline">View Profile</a>
            <a href="/network" className="block text-blue-700 hover:underline">Connections</a>
            <a href="/groups" className="block text-blue-700 hover:underline">Groups</a>
          </div>
        </div>
      </aside>
    );
  }
  