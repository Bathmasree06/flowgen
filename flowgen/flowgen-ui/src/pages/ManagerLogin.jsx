import { useState } from "react";
import { useNavigate } from "react-router-dom";

function ManagerLogin() {
  const navigate = useNavigate();
  const [managerId, setManagerId] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();

    // ✅ Temporary login logic (UI testing only)
    // Later we will connect PostgreSQL + backend auth
    if (managerId.trim() && password.trim()) {
      navigate("/manager/home");
    } else {
      alert("Please enter Manager ID and Password.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-blue-700">Flowgen</h1>
          <p className="text-slate-600 mt-2">Manager Login</p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-4" onSubmit={handleLogin}>
          <div>
            <label className="block text-slate-700 font-medium">
              Manager ID
            </label>
            <input
              value={managerId}
              onChange={(e) => setManagerId(e.target.value)}
              type="text"
              placeholder="e.g., MGR1021"
              className="w-full mt-1 p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-medium">
              Password
            </label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="Enter password"
              className="w-full mt-1 p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-700 text-white py-3 rounded-xl hover:bg-blue-800 transition font-semibold shadow-sm"
          >
            Login
          </button>
        </form>

        {/* Bottom actions */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/")}
            className="text-blue-700 hover:underline text-sm"
          >
            ← Back to Role Selection
          </button>
        </div>

        <p className="text-slate-500 text-xs mt-6 text-center">
          Note: Credentials will be validated using database authentication in
          the next phase.
        </p>
      </div>
    </div>
  );
}

export default ManagerLogin;
