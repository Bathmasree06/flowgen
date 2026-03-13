import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function EmployeeHome() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Get the logged-in user from local storage
    const storedUser = localStorage.getItem('flowgen_user');
    if (!storedUser) {
      navigate('/'); // Kick them back to login if no session exists
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    // 2. Fetch their specific tasks from the backend
    const fetchTasks = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/employees/${parsedUser.employee_id}/tasks`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.detail || 'Failed to fetch tasks');
        }

        setTasks(result.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('flowgen_user');
    navigate('/');
  };

  // Helper function to color-code priority badges
  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">Loading your workspace...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Enterprise Top Navigation bar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-700 rounded-md flex items-center justify-center text-white font-bold tracking-tighter">F</div>
          <span className="text-xl font-semibold text-slate-800">Flowgen</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-slate-600">
            {user?.employee_id} • <span className="capitalize">{user?.designation}</span>
          </span>
          <button 
            onClick={handleLogout}
            className="text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6 md:p-8">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800">My Tasks</h1>
          <p className="text-slate-500 text-sm mt-1">Review and manage your current workload.</p>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Task List Container */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
          {tasks.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              No tasks currently assigned to you.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {tasks.map((task) => (
                <div key={task.task_id} className="p-5 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                  
                  {/* Task Info */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-slate-400">{task.task_id}</span>
                      <h3 className="text-base font-semibold text-slate-800">{task.title}</h3>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-slate-500">{task.task_type}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-500">Due: {new Date(task.due_date).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Badges & Actions */}
                  <div className="flex items-center gap-4">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${getPriorityColor(task.priority)}`}>
                      {task.priority?.toUpperCase()}
                    </span>
                    <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 capitalize">
                      {task.status?.replace('_', ' ')}
                    </span>
                    <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100">
                      Update
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}