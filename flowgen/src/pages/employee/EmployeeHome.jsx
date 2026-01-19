import { useNavigate } from "react-router-dom";

function EmployeeHome() {
  const navigate = useNavigate();

  // Dummy data (later from DB)
  const myTasks = [
    {
      id: "T1001",
      title: "Fix Login UI validation",
      priority: "High",
      dueDate: "2026-01-20",
      status: "To Do",
    },
    {
      id: "T1002",
      title: "Write API documentation draft",
      priority: "Medium",
      dueDate: "2026-01-22",
      status: "In Progress",
    },
  ];

  const badgeClass = (priority) => {
    if (priority === "High") return "bg-red-50 text-red-700 border-red-100";
    if (priority === "Medium")
      return "bg-amber-50 text-amber-700 border-amber-100";
    return "bg-green-50 text-green-700 border-green-100";
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Tasks</h1>
        <p className="text-slate-600 mt-1">
          Track your tasks and keep progress updated.
        </p>
      </div>

      {/* Empty state */}
      {myTasks.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 shadow-sm text-center">
          <h2 className="text-xl font-semibold text-slate-900">
            No tasks assigned
          </h2>
          <p className="text-slate-600 mt-2">
            You don’t have any tasks assigned right now. Please check back
            later.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 text-slate-700 font-semibold">Task</th>
                <th className="p-4 text-slate-700 font-semibold">Priority</th>
                <th className="p-4 text-slate-700 font-semibold">Due Date</th>
                <th className="p-4 text-slate-700 font-semibold">Status</th>
                <th className="p-4 text-slate-700 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {myTasks.map((t) => (
                <tr
                  key={t.id}
                  className="border-b border-slate-100 hover:bg-slate-50 transition"
                >
                  <td className="p-4">
                    <div className="font-semibold text-slate-900">{t.title}</div>
                    <div className="text-xs text-slate-500 mt-1">ID: {t.id}</div>
                  </td>

                  <td className="p-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full border text-sm font-medium ${badgeClass(
                        t.priority
                      )}`}
                    >
                      {t.priority}
                    </span>
                  </td>

                  <td className="p-4 text-slate-700">{t.dueDate}</td>
                  <td className="p-4 text-slate-700">{t.status}</td>

                  <td className="p-4">
                    <button
                      onClick={() => navigate(`/employee/tasks/${t.id}`)}
                      className="text-blue-700 font-medium hover:underline"
                    >
                      Update →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default EmployeeHome;
