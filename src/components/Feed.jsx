// src/components/Feed.jsx
export default function Feed() {
    return (
      <main className="flex-1 mx-4">
        <div className="mb-4 bg-white p-6 rounded shadow">
          <input
            className="w-full px-4 py-2 rounded border"
            placeholder="Share a research update or ask a question..."
          />
        </div>
        {[1,2,3].map(i => (
          <div key={i} className="mb-4 bg-white p-6 rounded shadow">
            <h4 className="font-bold mb-2">Research Topic #{i}</h4>
            <p className="text-gray-700 mb-2">
              Exciting work on Quantum Computing breakthroughs! Connect for collaboration opportunities.
            </p>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Dr. Alex Singh · 2h ago</span>
              <span>12 likes · 4 comments</span>
            </div>
          </div>
        ))}
      </main>
    );
  }
  