import { useNavigate } from "react-router-dom";

function StatCard({ title, value, hint }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
      <p className="text-slate-500 text-sm">{title}</p>
      <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
      <p className="text-slate-600 text-sm mt-2">{hint}</p>
    </div>
  );
}

function ManagerHome() {
  const navigate = useNavigate();

  // Dummy metrics (replace later with DB)
  const stats = {
    total: 0,
    unassigned: 0,
    inProgress: 0,
    risk: 0,
  };

  return (
    <div className="relative">
      {/* Welcome */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Home</h1>
        <p className="text-slate-600 mt-1">
          Your overview of tasks and allocations.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Tasks"
          value={stats.total}
          hint="Tasks created by you"
        />
        <StatCard
          title="Unassigned"
          value={stats.unassigned}
          hint="Need allocation"
        />
        <StatCard
          title="In Progress"
          value={stats.inProgress}
          hint="Currently being worked on"
        />
        <StatCard
          title="At Risk (ML)"
          value={stats.risk}
          hint="Potential delays flagged"
        />
      </div>

      {/* Empty state message */}
      <div className="mt-8 bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">
          No tasks allocated yet
        </h2>
        <p className="text-slate-600 mt-2">
          Start by creating tasks and assigning them to employees. Flowgen will
          help you balance workload and reduce delays.
        </p>

        <button
          onClick={() => navigate("/manager/tasks")}
          className="mt-5 px-5 py-3 rounded-xl bg-blue-700 text-white font-semibold hover:bg-blue-800 transition shadow-sm"
        >
          Go to Task Management →
        </button>
      </div>

      {/* Primary Create Task Button */}
      <button
        onClick={() => alert("Create Task page comes next ✅")}
        className="fixed bottom-8 right-8 bg-blue-700 text-white px-5 py-3 rounded-2xl shadow-lg hover:bg-blue-800 hover:shadow-xl transition font-semibold"
      >
        + Create Task
      </button>
    </div>
  );
}

export default ManagerHome;
