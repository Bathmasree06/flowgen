import { BrowserRouter, Routes, Route } from "react-router-dom";

import RoleSelect from "./pages/RoleSelect";
import ManagerLogin from "./pages/ManagerLogin";
import EmployeeLogin from "./pages/EmployeeLogin";

// Manager pages
import ManagerLayout from "./pages/manager/ManagerLayout";
import ManagerHome from "./pages/manager/ManagerHome";
import ManagerTasks from "./pages/manager/ManagerTasks";

// Employee placeholder for now
function EmployeeHome() {
  return <h1 className="p-10 text-2xl font-bold">Employee Dashboard</h1>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RoleSelect />} />
        <Route path="/login/manager" element={<ManagerLogin />} />
        <Route path="/login/employee" element={<EmployeeLogin />} />

        {/* ✅ Manager Dashboard with Layout */}
        <Route path="/manager" element={<ManagerLayout />}>
          <Route path="home" element={<ManagerHome />} />
          <Route path="tasks" element={<ManagerTasks />} />
        </Route>

        {/* Employee routes (next step) */}
        <Route path="/employee/home" element={<EmployeeHome />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
