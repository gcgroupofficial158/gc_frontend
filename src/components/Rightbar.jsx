// src/components/Rightbar.jsx
export default function Rightbar() {
  return (
    <aside className="hidden lg:block w-72 ml-8">
      <div className="bg-white rounded shadow p-6">
        <h4 className="font-bold mb-4 text-lg">Trending Topics</h4>
        <ul className="space-y-2">
          <li className="text-blue-700 hover:underline">#AI Ethics</li>
          <li className="text-blue-700 hover:underline">#Quantum Computing</li>
          <li className="text-blue-700 hover:underline">#Graph Neural Networks</li>
        </ul>
      </div>
      <div className="bg-white rounded shadow p-6 mt-8">
        <h4 className="font-bold mb-4 text-lg">Top Researchers</h4>
        <ul>
          <li className="mb-2">Dr. Priya Gupta</li>
          <li className="mb-2">Dr. Samuel Lee</li>
        </ul>
      </div>
    </aside>
  );
}
