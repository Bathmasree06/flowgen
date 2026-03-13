import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    
    // TEMPORARY MOCK LOGIC: We will replace this with a real backend API call later.
    // For now, if the ID starts with 'M', we route to manager. Otherwise, employee.
    if (employeeId.toUpperCase().startsWith('M')) {
      navigate('/manager/dashboard');
    } else if (employeeId) {
      navigate('/employee/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      {/* Brand Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Flowgen</h1>
        <p className="text-sm text-slate-500 mt-2">Intelligent Task Allocation System</p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-white rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 p-8 transition-all duration-300 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)]">
        <h2 className="text-xl font-semibold text-slate-800 mb-6">Sign in to your account</h2>
        
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1" htmlFor="employeeId">
              Employee ID
            </label>
            <input
              id="employeeId"
              type="text"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder="e.g. EMP1042 or MGR007"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-medium py-2.5 rounded-lg shadow-sm hover:shadow transition-all duration-200 mt-2"
          >
            Continue
          </button>
        </form>
      </div>

      {/* Footer minimal text */}
      <div className="mt-8 text-xs text-slate-400">
        &copy; {new Date().getFullYear()} Flowgen Enterprise. All rights reserved.
      </div>
    </div>
  );
}