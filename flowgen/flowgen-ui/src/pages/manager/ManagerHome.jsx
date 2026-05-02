import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ManagerHome() {
  const [team, setTeam] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home'); 
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState(1); 
  const [recommendations, setRecommendations] = useState([]);
  const [newTask, setNewTask] = useState({
    title: '', task_type: 'Feature', required_skill: 'Frontend', 
    priority: 'medium', estimated_hours: 8, due_date: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('flowgen_user');
    if (!storedUser) {
      navigate('/');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    if (parsedUser.role !== 'manager') {
      navigate('/'); 
      return;
    }
    setUser(parsedUser);
    fetchDashboardData(parsedUser.employee_id);
  }, [navigate]);

  const fetchDashboardData = async (managerId) => {
    try {
      setLoading(true);
      const [teamRes, tasksRes] = await Promise.all([
        fetch(`http://127.0.0.1:8000/api/managers/${managerId}/team`),
        fetch(`http://127.0.0.1:8000/api/managers/${managerId}/tasks`)
      ]);
      
      const teamData = await teamRes.json();
      const tasksData = await tasksRes.json();

      if (!teamRes.ok) throw new Error(teamData.detail);
      if (!tasksRes.ok) throw new Error(tasksData.detail);

      setTeam(teamData.data);
      setTasks(tasksData.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('flowgen_user');
    navigate('/');
  };

  // --- NEW: CSV EXPORT FUNCTION ---
  const exportToCSV = () => {
    const headers = ['Task ID', 'Task Name', 'Assignee', 'Status', 'Priority', 'Estimated Hours', 'Due Date'];
    const csvData = tasks.map(t => [
      t.task_id, 
      `"${t.title}"`, // Quotes handle commas in titles
      t.employee_name, 
      t.status.toUpperCase(), 
      t.priority.toUpperCase(),
      t.estimated_hours,
      new Date(t.due_date).toLocaleDateString()
    ].join(','));
    
    const csvContent = [headers.join(','), ...csvData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Flowgen_Task_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGetRecommendations = async (e) => {
    e.preventDefault();
    setModalStep(2); 
    
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/managers/${user.employee_id}/recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          required_skill: newTask.required_skill,
          estimated_hours: parseFloat(newTask.estimated_hours)
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail);
      
      setRecommendations(result.data);
      setModalStep(3); 
    } catch (err) {
      setError(err.message);
      setModalStep(1); 
    }
  };

  const handleAssignTask = async (employeeId) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/tasks/create-and-assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTask,
          estimated_hours: parseFloat(newTask.estimated_hours), // Ensure it's a number, not a string
          created_by_manager_id: user.employee_id,
          assigned_employee_id: employeeId
        })
      });
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.detail || "Failed to assign task");
      }
      
      // Success! Refresh the dashboard data
      await fetchDashboardData(user.employee_id);
      
      // Close modal and reset form
      setIsModalOpen(false);
      setModalStep(1);
      setNewTask({ title: '', task_type: 'Feature', required_skill: 'Frontend', priority: 'medium', estimated_hours: 8, due_date: '' });
      
    } catch (err) {
      // FIX: Alert the user immediately so it doesn't fail silently!
      alert("❌ Assignment Failed: " + err.message);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeTasks = tasks.filter(t => t.status !== 'completed');
  const overdueTasks = activeTasks.filter(t => new Date(t.due_date) < new Date(new Date().setHours(0,0,0,0)));
  const totalTeamCapacity = team.reduce((sum, emp) => sum + (emp.weekly_capacity || 40), 0);
  const totalAssignedHours = activeTasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0);
  const teamUtilization = totalTeamCapacity > 0 ? Math.min(100, Math.round((totalAssignedHours / totalTeamCapacity) * 100)) : 0;

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-500 font-medium">Loading command center...</div>;

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between hidden md:flex z-10 text-slate-300">
        <div>
          <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950">
            <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center text-white font-bold text-sm tracking-tighter mr-3 shadow-lg">F</div>
            <span className="text-lg font-bold text-white tracking-tight">Flowgen</span>
            <span className="ml-2 px-1.5 py-0.5 bg-slate-800 text-[10px] font-bold uppercase rounded text-slate-400">MGR</span>
          </div>
          <nav className="p-4 space-y-1">
            {['home', 'team', 'tasks', 'profile'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)} 
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors capitalize ${activeTab === tab ? 'bg-blue-600/10 text-blue-400' : 'hover:bg-slate-800 hover:text-white'}`}
              >
                {tab === 'home' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>}
                {tab === 'team' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
                {tab === 'tasks' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
                {tab === 'profile' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                {tab === 'home' ? 'Dashboard' : tab === 'team' ? 'Team Capacity' : tab === 'tasks' ? 'Task Hub' : 'Profile'}
              </button>
            ))}
          </nav>
        </div>
        <div className="p-4 border-t border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-xs border border-slate-700">{user?.employee_id?.substring(0,2)}</div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-white truncate max-w-[140px]">{user?.name}</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">{user?.designation}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full py-2 text-xs font-medium text-slate-400 bg-slate-900 rounded-md border border-slate-800 hover:bg-slate-800 hover:text-white transition-colors">Sign Out</button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 md:px-10 shrink-0">
          <h1 className="text-xl font-bold text-slate-800 capitalize">
            {activeTab === 'home' ? 'Management Dashboard' : activeTab === 'team' ? 'Team Workload & Capacity' : activeTab === 'tasks' ? 'Global Task Hub' : 'Manager Profile'}
          </h1>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 relative">
          {error && !isModalOpen && <div className="mb-6 p-4 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm shadow-sm">{error}</div>}

          {activeTab === 'home' && (
            <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300 pb-20">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm"><div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Total Active Tasks</div><div className="text-3xl font-bold text-slate-800">{activeTasks.length}</div></div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm"><div className="text-red-500 text-xs font-semibold uppercase tracking-wider mb-1">Critical Overdue</div><div className="text-3xl font-bold text-red-600">{overdueTasks.length}</div></div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm"><div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Direct Reports</div><div className="text-3xl font-bold text-slate-800">{team.length}</div></div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm"><div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Team Utilization</div><div className="text-3xl font-bold text-blue-600">{teamUtilization}%</div></div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col max-h-[400px]">
                  <div className="p-4 border-b border-slate-100 bg-slate-50 shrink-0"><h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Bottleneck Alerts</h3></div>
                  {/* FIX: Made this area vertically scrollable if there are many alerts, and removed truncate so text wraps */}
                  <div className="p-4 space-y-3 overflow-y-auto flex-1">
                    {overdueTasks.length === 0 ? <p className="text-sm text-slate-500">No critical alerts. Team is operating smoothly.</p> : overdueTasks.map(t => (
                      <div key={t.task_id} className="p-3 bg-red-50/50 border border-red-100 rounded-lg flex items-start gap-3">
                        <div className="w-2 h-2 mt-1.5 rounded-full bg-red-500 shrink-0"></div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800 leading-snug pr-2">{t.title}</p>
                          <p className="text-xs font-medium text-red-600 mt-1">Overdue • {t.employee_name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between"><h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Top Utilizing Resources</h3><button onClick={()=>setActiveTab('team')} className="text-xs font-medium text-blue-600 hover:underline">View All</button></div>
                  <div className="p-4 space-y-5">
                    {team.slice(0,4).map(emp => {
                      const empTasks = activeTasks.filter(t => t.employee_id === emp.employee_id);
                      const empAssignedHours = empTasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0);
                      const utilPercent = Math.min(100, Math.round((empAssignedHours / (emp.weekly_capacity || 40)) * 100));
                      return (
                        <div key={emp.employee_id}>
                          <div className="flex justify-between items-end mb-1"><span className="text-sm font-semibold text-slate-800">{emp.name} <span className="text-slate-400 font-normal text-xs ml-1 capitalize">{emp.primary_skill}</span></span><span className={`text-xs font-bold ${utilPercent > 90 ? 'text-orange-600' : 'text-slate-600'}`}>{empAssignedHours} / {emp.weekly_capacity || 40}h</span></div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden"><div className={`h-full rounded-full ${utilPercent > 90 ? 'bg-orange-500' : 'bg-blue-500'}`} style={{ width: `${utilPercent}%` }}></div></div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setIsModalOpen(true)}
                className="fixed bottom-10 right-10 z-40 bg-blue-700 hover:bg-blue-800 text-white rounded-full px-6 py-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(29,78,216,0.3)] hover:-translate-y-1 transition-all flex items-center gap-3"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                <span className="font-bold tracking-wide">Create Task</span>
              </button>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="max-w-6xl mx-auto animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {team.map(emp => {
                  const empTasks = activeTasks.filter(t => t.employee_id === emp.employee_id);
                  const empAssignedHours = empTasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0);
                  const utilPercent = Math.min(100, Math.round((empAssignedHours / (emp.weekly_capacity || 40)) * 100));
                  
                  return (
                    <div key={emp.employee_id} className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4 mb-5">
                        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-lg">{emp.name?.substring(0,2)}</div>
                        <div>
                          <h3 className="font-bold text-slate-800">{emp.name}</h3>
                          <p className="text-xs text-slate-500 capitalize">{emp.designation} • {emp.primary_skill}</p>
                        </div>
                      </div>
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm"><span className="text-slate-600 font-medium">Assigned Workload</span><span className={`font-bold ${utilPercent > 90 ? 'text-red-600' : 'text-slate-800'}`}>{empAssignedHours} / {emp.weekly_capacity || 40}h</span></div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden"><div className={`h-full rounded-full transition-all ${utilPercent > 90 ? 'bg-red-500' : utilPercent > 70 ? 'bg-orange-400' : 'bg-green-500'}`} style={{width: `${utilPercent}%`}}></div></div>
                      </div>
                      <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Tasks</span>
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-md">{empTasks.length}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* TASK HUB VIEW WITH CSV EXPORT BUTTON */}
          {activeTab === 'tasks' && (
            <div className="max-w-6xl mx-auto animate-in fade-in duration-300">
               
               <div className="flex justify-end mb-4">
                 <button onClick={exportToCSV} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-bold rounded-lg shadow-sm hover:bg-slate-50 transition-colors flex items-center gap-2">
                   <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                   Export CSV Report
                 </button>
               </div>

               <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-bold text-slate-500 tracking-wider">
                      <tr><th className="px-6 py-4">Task Name</th><th className="px-6 py-4">Assignee</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Due Date</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {tasks.length === 0 ? (
                        <tr><td colSpan="4" className="px-6 py-10 text-center text-slate-500">No tasks have been created yet.</td></tr>
                      ) : tasks.map(task => (
                        <tr key={task.task_id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-800">{task.title}</div>
                            <div className="text-xs text-slate-400 font-mono mt-0.5">{task.task_id} • {task.priority.toUpperCase()} • {task.estimated_hours}h</div>
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-700 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex justify-center items-center text-[10px] font-bold">{task.employee_name?.substring(0,2)}</div>
                            {task.employee_name}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${task.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' : task.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                              {task.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-medium">{new Date(task.due_date).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="max-w-3xl mx-auto animate-in fade-in duration-300">
              <h1 className="text-2xl font-bold text-slate-800 mb-6">Manager Profile</h1>
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex items-center gap-6">
                  <div className="w-24 h-24 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-3xl shadow-sm">
                    {user?.name ? user.name.substring(0, 2).toUpperCase() : 'MG'}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">{user?.name || 'Manager Name'}</h2>
                    <p className="text-slate-500 capitalize font-medium">{user?.designation}</p>
                    <span className="inline-block mt-3 px-2.5 py-1 text-xs font-bold rounded-md uppercase tracking-wide bg-blue-100 text-blue-800">
                      System Administrator
                    </span>
                  </div>
                </div>
                <div className="p-8 grid grid-cols-2 gap-8">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Employee ID</label>
                    <p className="text-sm font-medium text-slate-800 mt-1 font-mono">{user?.employee_id}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
                    <p className="text-sm font-medium text-slate-800 mt-1">{user?.email || 'Not Provided'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Department Head</label>
                    <p className="text-sm font-medium text-slate-800 mt-1 capitalize">{user?.designation}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Direct Reports</label>
                    <p className="text-sm font-medium text-slate-800 mt-1">{team.length} Active Employees</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
              
              <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                <h3 className="text-xl font-bold text-slate-800">
                  {modalStep === 1 ? 'Define New Task' : 'Intelligent Allocation'}
                </h3>
                <button onClick={() => {setIsModalOpen(false); setModalStep(1);}} className="text-slate-400 hover:text-slate-800 transition-colors bg-white rounded-full p-1 border border-transparent hover:border-slate-200 shadow-sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              
              <div className="p-8 overflow-y-auto">
                {modalStep === 1 && (
                  <form onSubmit={handleGetRecommendations} className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">Task Title</label>
                      <input type="text" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all outline-none" placeholder="e.g., Build Authentication API" required />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Required Skill</label>
                        <select value={newTask.required_skill} onChange={e => setNewTask({...newTask, required_skill: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none">
                          <option value="Frontend">Frontend</option><option value="Backend">Backend</option>
                          <option value="Database">Database</option><option value="Design">Design</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Priority</label>
                        <select value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none">
                          <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Estimated Hours</label>
                        <input type="number" min="1" value={newTask.estimated_hours} onChange={e => setNewTask({...newTask, estimated_hours: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none" required />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Due Date</label>
                        <input type="date" value={newTask.due_date} onChange={e => setNewTask({...newTask, due_date: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none" required />
                      </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                      <button type="submit" className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-bold shadow-md transition-all flex items-center gap-2">
                        Get recommendations
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                      </button>
                    </div>
                  </form>
                )}

                {modalStep === 2 && (
                  <div className="py-12 flex flex-col items-center justify-center space-y-4 animate-pulse">
                    <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-medium">Analyzing team capacity and skill matrices...</p>
                  </div>
                )}

                {modalStep === 3 && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3 mb-6">
                      <div className="text-blue-600 mt-0.5"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                      <div>
                        <p className="text-sm font-bold text-blue-900">Recommended Allocation</p>
                        <p className="text-xs text-blue-700 mt-1">Based on {newTask.estimated_hours} hours required for <strong>{newTask.required_skill}</strong>.</p>
                      </div>
                    </div>

                    {recommendations.map((rec, index) => (
                      <div key={rec.employee_id} className={`p-4 rounded-xl border-2 transition-all flex items-center justify-between ${index === 0 ? 'bg-white border-blue-500 shadow-md' : 'bg-slate-50 border-slate-200 hover:border-blue-300'}`}>
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-200 text-slate-600'}`}>
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="text-base font-bold text-slate-800">{rec.name} <span className="text-xs font-mono text-slate-400 ml-2">{rec.employee_id}</span></h4>
                            <p className="text-xs text-slate-500 mt-0.5">{rec.reason}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right hidden sm:block">
                            <p className="text-xs font-bold text-slate-400 uppercase">Match Score</p>
                            <p className={`text-lg font-bold ${rec.match_score >= 80 ? 'text-green-600' : 'text-orange-500'}`}>{rec.match_score}%</p>
                          </div>
                          <button 
                            onClick={() => handleAssignTask(rec.employee_id)}
                            disabled={isSubmitting}
                            className={`px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors ${index === 0 ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-blue-600'}`}
                          >
                            Assign Task
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    <button onClick={() => setModalStep(1)} className="mt-4 text-sm font-medium text-slate-500 hover:text-slate-800">← Back to task details</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}