import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

function EmployeeTaskDetail() {
  const { taskId } = useParams();
  const navigate = useNavigate();

  // Dummy task detail (later from DB)
  const task = {
    id: taskId,
    title: "Fix Login UI validation",
    description:
      "Add basic validation and error messages for login input fields.",
    effortHours: 3,
    requiredSkill: "Frontend",
    status: "To Do",
  };

  const [status, setStatus] = useState(task.status);

  const handleUpdate = () => {
    alert(`Status updated to: ${status} ✅ (DB integration next phase)`);
    navigate("/employee/home");
  };

  return (
    <div className="max-w-3xl">
      <button
        onClick={() => navigate("/employee/home")}
        className="text-blue-700 hover:underline text-sm font-medium"
      >
        ← Back to My Tasks
      </button>

      <div className="mt-4 bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{task.title}</h1>
            <p className="text-slate-500 text-sm mt-1">Task ID: {task.id}</p>
          </div>

          <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 font-semibold text-sm">
            {task.requiredSkill}
          </span>
        </div>

        <p className="text-slate-700 mt-5 leading-relaxed">
          {task.description}
        </p>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-slate-500 text-sm">Estimated Effort</p>
            <p className="text-slate-900 font-bold mt-1">
              {task.effortHours} hrs
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-slate-500 text-sm">Current Status</p>
            <p className="text-slate-900 font-bold mt-1">{task.status}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-slate-500 text-sm">Update Status</p>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full mt-2 p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option>To Do</option>
              <option>In Progress</option>
              <option>Done</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleUpdate}
          className="mt-6 w-full bg-blue-700 text-white py-3 rounded-xl hover:bg-blue-800 transition font-semibold shadow-sm"
        >
          Save Update
        </button>
      </div>
    </div>
  );
}

export default EmployeeTaskDetail;
