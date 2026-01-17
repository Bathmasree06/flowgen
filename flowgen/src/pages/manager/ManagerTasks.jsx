import { useNavigate } from "react-router-dom";

function ManagerTasks() {
  const navigate = useNavigate();

  // Dummy tasks (later from DB)
  const tasks = [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">View Tasks</h1>
          <p className="text-slate-600 mt-1">
            Tasks created and allocated by you.
          </p>
        </div>

        <button
          onClick={() => alert("Create Task page comes next ✅")}
          className="px-4 py-2 rounded-xl bg-blue-700 text-white font-semibold hover:bg-blue-800 transition shadow-sm"
        >
          + Create Task
        </button>
      </div>

      {/* If no tasks */}
      {tasks.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 shadow-sm text-center">
          <h2 className="text-xl font-semibold text-slate-900">
            No tasks found
          </h2>
          <p className="text-slate-600 mt-2">
            You haven’t created or allocated any tasks yet.
          </p>

          <button
            onClick={() => alert("Create Task page comes next ✅")}
            className="mt-6 px-5 py-3 rounded-xl bg-blue-700 text-white font-semibold hover:bg-blue-800 transition shadow-sm"
          >
            + Create your first task
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 text-slate-700 font-semibold">Task</th>
                <th className="p-4 text-slate-700 font-semibold">Skill</th>
                <th className="p-4 text-slate-700 font-semibold">Effort</th>
                <th className="p-4 text-slate-700 font-semibold">Status</th>
                <th className="p-4 text-slate-700 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => (
                <tr key={t.id} className="border-b border-slate-100">
                  <td className="p-4">{t.title}</td>
                  <td className="p-4">{t.requiredSkill}</td>
                  <td className="p-4">{t.effortHours} hrs</td>
                  <td className="p-4">{t.status}</td>
                  <td className="p-4">
                    <button
                      onClick={() => navigate(`/manager/tasks/${t.id}`)}
                      className="text-blue-700 font-medium hover:underline"
                    >
                      View →
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

export default ManagerTasks;
