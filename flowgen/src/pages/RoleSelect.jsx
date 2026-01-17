import { useNavigate } from "react-router-dom";

function RoleSelect() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-blue-700 tracking-tight">
            Flowgen
          </h1>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Manager Card */}
          <button
            onClick={() => navigate("/login/manager")}
            className="group bg-white border border-slate-200 rounded-2xl p-8 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 text-left"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900 group-hover:text-blue-700 transition">
                  Manager
                </h2>
                <p className="text-slate-600 mt-2 leading-relaxed">
                  Allocate tasks, manage workload, review ML recommendations, and
                  track team progress.
                </p>
              </div>

              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100 group-hover:bg-blue-100 transition">
                <span className="text-blue-700 text-xl">👔</span>
              </div>
            </div>

            <div className="mt-6 inline-flex items-center text-blue-700 font-medium">
              Continue as Manager <span className="ml-2">→</span>
            </div>
          </button>

          {/* Employee Card */}
          <button
            onClick={() => navigate("/login/employee")}
            className="group bg-white border border-slate-200 rounded-2xl p-8 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 text-left"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900 group-hover:text-blue-700 transition">
                  Employee
                </h2>
                <p className="text-slate-600 mt-2 leading-relaxed">
                  View assigned tasks, update status, log effort hours, and
                  monitor your workload.
                </p>
              </div>

              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100 group-hover:bg-blue-100 transition">
                <span className="text-blue-700 text-xl">🧑‍💻</span>
              </div>
            </div>

            <div className="mt-6 inline-flex items-center text-blue-700 font-medium">
              Continue as Employee <span className="ml-2">→</span>
            </div>
          </button>
        </div>

        {/* Footer hint */}
        <p className="text-center text-slate-500 mt-10 text-sm">
          Select your role to proceed to secure login.
        </p>
      </div>
    </div>
  );
}

export default RoleSelect;
