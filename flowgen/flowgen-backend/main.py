import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function EmployeeHome() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home'); 
  const navigate = useNavigate();

  // --- STATE FOR PROFESSIONAL FEATURES ---
  const [taskFilter, setTaskFilter] = useState('active'); 
  const [searchQuery, setSearchQuery] = useState(''); // NEW: Search state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [updateHours, setUpdateHours] = useState(0);
  const [updateStatus, setUpdateStatus] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('flowgen_user');
    if (!storedUser) {
      navigate('/');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    const fetchTasks = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/employees/${parsedUser.employee_id}/tasks`);
        const result = await response.json();
        if (!response.ok) throw new Error(result.detail || 'Failed to fetch tasks');
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

  const openUpdateModal = (task) => {
    setSelectedTask(task);
    setUpdateHours(task.actual_hours || 0);
    setUpdateStatus(task.status || 'pending');
    setIsModalOpen(true);
  };

  const closeUpdateModal = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
    setError('');
  };

  const handleTaskUpdate = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    setError('');

    const parsedHours = parseFloat(updateHours);
    
    if (isNaN(parsedHours) || parsedHours < 0) {
      setError("Please enter a valid number for hours.");
      setIsUpdating(false);
      return;
    }

    if (updateStatus === 'completed' && parsedHours <= 0) {
      setError("Workflow Error: You must log actual hours before marking a task as Completed.");
      setIsUpdating(false);
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/tasks/${selectedTask.task_id}/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: user.employee_id,
          actual_hours: parsedHours,
          status: updateStatus
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        let errorMessage = 'Failed to update task.';
        if (result.detail) {
          if (Array.isArray(result.detail)) {
            errorMessage = result.detail.map(err => `${err.loc[err.loc.length - 1]}: ${err.msg}`).join(', ');
          } else if (typeof result.detail === 'string') {
            errorMessage = result.detail;
          } else {
            errorMessage = JSON.stringify(result.detail);
          }
        }
        throw new Error(errorMessage);
      }

      setTasks(currentTasks => 
        currentTasks.map(t => 
          t.task_id === selectedTask.task_id 
            ? { ...t, actual_hours: parsedHours, status: updateStatus }
            : t
        )
      );
      
      closeUpdateModal();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUpdating(false);
    }
  };
  
  // --- NEW: OVERDUE LOGIC ---
  const isOverdue = (dueDate, status) => {
    if (status === 'completed') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Strip time for accurate day comparison
    const taskDate = new Date(dueDate);
    return taskDate < today;
  };

  // --- FILTER & SEARCH CALCULATIONS ---
  const filteredTasks = tasks.filter(task => {
    // 1. Tab Filter
    if (taskFilter === 'active' && task.status === 'completed') return false;
    if (taskFilter === 'completed' && task.status !== 'completed') return false;
    
    // 2. Search Filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const titleMatch = task.title?.toLowerCase().includes(query);
      const idMatch = task.task_id?.toString().toLowerCase().includes(query);
      if (!titleMatch && !idMatch) return false;
    }
    return true; 
  });

  const activeTasksCount = tasks.filter(t => t.status !== 'completed').length;
  const completedTasksCount = tasks.filter(t => t.status === 'completed').length;
  const totalEstimatedHours = tasks.reduce((sum, task) => sum + (task.estimated_hours || 0), 0);
  const totalLoggedHours = tasks.reduce((sum, task) => sum + (task.actual_hours || 0), 0);
  const remainingHours = Math.max(0, totalEstimatedHours - totalLoggedHours);
  const workloadProgress = totalEstimatedHours > 0 ? Math.min(100, Math.round((totalLoggedHours / totalEstimatedHours) * 100)) : 0;

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-500 font-medium">Loading workspace...</div>;

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between hidden md:flex z-10">
        <div>
          <div className="h-16 flex items-center px-6 border-b border-slate-100">
            <div className="w-7 h-7 bg-blue-700 rounded-md flex items-center justify-center text-white font-bold text-sm tracking-tighter mr-3">F</div>
            <span className="text-lg font-bold text-slate-800 tracking-tight">Flowgen</span>
          </div>
          <nav className="p-4 space-y-1">
            <button onClick={() => setActiveTab('home')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'home' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> Dashboard
            </button>
            <button onClick={() => setActiveTab('tasks')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'tasks' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg> My Tasks
            </button>
            <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'profile' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> Profile
            </button>
          </nav>
        </div>
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">{user?.employee_id?.substring(0,2)}</div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-800">{user?.employee_id}</span>
              <span className="text-xs text-slate-500 capitalize">{user?.designation}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full py-2 text-xs font-medium text-slate-600 bg-slate-50 rounded-md border border-slate-200 hover:bg-slate-100 transition-colors">Sign Out</button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          {error && !isModalOpen && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

          {/* DASHBOARD VIEW */}
          {activeTab === 'home' && (
            <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
              <div><h1 className="text-2xl font-bold text-slate-800">Welcome back.</h1><p className="text-slate-500 mt-1">Here is a summary of your current workload.</p></div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm"><div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Active Tasks</div><div className="text-3xl font-bold text-slate-800">{activeTasksCount}</div></div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm"><div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Completed</div><div className="text-3xl font-bold text-slate-800">{completedTasksCount}</div></div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm"><div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Hours Logged</div><div className="text-3xl font-bold text-blue-600">{totalLoggedHours}<span className="text-sm font-medium text-slate-400 ml-1">hrs</span></div></div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm"><div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Remaining</div><div className="text-3xl font-bold text-slate-800">{remainingHours}<span className="text-sm font-medium text-slate-400 ml-1">hrs</span></div></div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-end mb-2"><div><h3 className="text-sm font-semibold text-slate-800">Overall Effort Progress</h3></div><span className="text-sm font-bold text-blue-700">{workloadProgress}%</span></div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden"><div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${workloadProgress}%` }}></div></div>
              </div>
            </div>
          )}

          {/* TASKS VIEW */}
          {activeTab === 'tasks' && (
            <div className="max-w-5xl mx-auto animate-in fade-in duration-300">
              <header className="mb-6 flex flex-col md:flex-row md:items-end justify-between border-b border-slate-200 pb-4 gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">My Tasks</h1>
                  <p className="text-slate-500 text-sm mt-1">Manage and update your assigned responsibilities.</p>
                </div>
                
                {/* NEW: Filters and Search Bar Container */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <input 
                    type="text" 
                    placeholder="Search by ID or title..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors shadow-sm"
                  />
                  <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                    {['all', 'active', 'completed'].map(filter => (
                      <button
                        key={filter}
                        onClick={() => setTaskFilter(filter)}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md capitalize transition-all ${taskFilter === filter ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>
              </header>

              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                {filteredTasks.length === 0 ? (
                  <div className="p-10 text-center text-slate-500">No tasks found. Try adjusting your search or filters.</div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filteredTasks.map((task) => {
                      const taskIsOverdue = isOverdue(task.due_date, task.status);
                      
                      return (
                        <div key={task.task_id} className={`p-5 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between group gap-4 ${taskIsOverdue ? 'bg-red-50/30' : ''}`}>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-mono text-slate-400">{task.task_id}</span>
                              <h3 className={`text-base font-semibold ${task.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                                {task.title}
                              </h3>
                              {/* NEW: Overdue Badge */}
                              {taskIsOverdue && (
                                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wider rounded border border-red-200">Overdue</span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                              <span className="text-slate-500">{task.task_type}</span>
                              <span className="text-slate-300">•</span>
                              <span className={`${taskIsOverdue ? 'text-red-600 font-medium' : 'text-slate-500'}`}>
                                Due: {new Date(task.due_date).toLocaleDateString()}
                              </span>
                              <span className="text-slate-300">•</span>
                              <div className="flex items-center gap-2">
                                <span className="text-slate-500">Effort: <span className="font-medium text-slate-700">{task.actual_hours || 0}</span> / {task.estimated_hours}h</span>
                                <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                                  <div 
                                  className={`h-full rounded-full ${task.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'}`} 
                                  style={{ width: `${Math.min(100, ((task.actual_hours || 0) / task.estimated_hours) * 100)}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${getPriorityColor(task.priority)}`}>{task.priority?.toUpperCase()}</span>
                            <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 capitalize">{task.status?.replace('_', ' ')}</span>
                            {task.status !== 'completed' && (
                              <button 
                                onClick={() => openUpdateModal(task)}
                                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:border-blue-300 hover:text-blue-700 transition-colors shadow-sm"
                              >
                                Log Time
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PROFILE VIEW */}
          {activeTab === 'profile' && (
            <div className="max-w-3xl mx-auto animate-in fade-in duration-300">
              <h1 className="text-2xl font-bold text-slate-800 mb-6">Employee Profile</h1>
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8">
                <div className="flex items-center gap-6 mb-8 pb-8 border-b border-slate-100">
                  <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-2xl">{user?.employee_id?.substring(0,2)}</div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">{user?.employee_id}</h2>
                    <p className="text-slate-500 capitalize">{user?.designation}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* UPDATE TASK MODAL OVERLAY */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800">Update Task Progress</h3>
                <button onClick={closeUpdateModal} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>
              
              <form onSubmit={handleTaskUpdate} className="p-6 space-y-5">
                {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
                
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-xs font-mono text-slate-500">{selectedTask?.task_id}</span>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{selectedTask?.title}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select 
                    value={updateStatus} 
                    onChange={(e) => setUpdateStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Actual Hours Logged (Est: {selectedTask?.estimated_hours}h)
                  </label>
                  <input 
                    type="number" 
                    step="0.5"
                    min="0"
                    value={updateHours} 
                    onChange={(e) => setUpdateHours(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={closeUpdateModal} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={isUpdating} className="flex-1 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-70">
                    {isUpdating ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}