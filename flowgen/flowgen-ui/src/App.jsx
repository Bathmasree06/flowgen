import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import EmployeeHome from './pages/employee/EmployeeHome';
import ManagerHome from './pages/manager/ManagerHome';

function App() {
  return (
    <Router>
      <Routes>
        {/* Default route is now the unified login page */}
        <Route path="/" element={<Login />} />
        
        {/* Employee Routes */}
        <Route path="/employee/dashboard" element={<EmployeeHome />} />
        
        {/* Manager Routes */}
        <Route path="/manager/dashboard" element={<ManagerHome />} />

        {/* Catch-all route to redirect unknown URLs back to login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;