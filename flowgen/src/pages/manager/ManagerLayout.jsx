import { NavLink, Outlet } from "react-router-dom";

function ManagerLayout() {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 p-5 hidden md:block">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-blue-700">Flowgen</h1>
          <p className="text-slate-500 text-sm mt-1">Manager Panel</p>
        </div>

        <nav className="space-y-2">
          <NavLink
            to="/manager/home"
            className={({ isActive }) =>
              `block px-4 py-3 rounded-xl font-medium transition ${
                isActive
                  ? "bg-blue-50 text-blue-700 border border-blue-100"
                  : "text-slate-700 hover:bg-slate-100"
              }`
            }
          >
            🏠 Home
          </NavLink>

          <NavLink
            to="/manager/tasks"
            className={({ isActive }) =>
              `block px-4 py-3 rounded-xl font-medium transition ${
                isActive
                  ? "bg-blue-50 text-blue-700 border border-blue-100"
                  : "text-slate-700 hover:bg-slate-100"
              }`
            }
          >
            ✅ View Tasks
          </NavLink>
        </nav>

        <div className="mt-10 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <p className="text-sm text-slate-600">
            Tip: Use <span className="font-semibold">Auto Allocate</span> to
            assign tasks based on skill and workload.
          </p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Manager Dashboard
            </h2>
            <p className="text-sm text-slate-500">
              Allocate tasks, track progress, and manage workload
            </p>
          </div>

          <button className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition text-slate-800 font-medium">
            Logout
          </button>
        </header>

        {/* Page content */}
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default ManagerLayout;
