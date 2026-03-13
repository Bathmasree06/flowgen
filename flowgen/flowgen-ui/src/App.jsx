import { BrowserRouter, Routes, Route } from "react-router-dom";

import RoleSelect from "./pages/RoleSelect";
import ManagerLogin from "./pages/ManagerLogin";
import EmployeeLogin from "./pages/EmployeeLogin";

// Manager pages
import ManagerLayout from "./pages/manager/ManagerLayout";
import ManagerHome from "./pages/manager/ManagerHome";
import ManagerTasks from "./pages/manager/ManagerTasks";

// Employee pages
import EmployeeLayout from "./pages/employee/EmployeeLayout";
import EmployeeHome from "./pages/employee/EmployeeHome";
import EmployeeTaskDetail from "./pages/employee/EmployeeTaskDetail";

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

        {/* ✅ Employee Dashboard with Layout */}
        <Route path="/employee" element={<EmployeeLayout />}>
          <Route path="home" element={<EmployeeHome />} />
          <Route path="tasks/:taskId" element={<EmployeeTaskDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
