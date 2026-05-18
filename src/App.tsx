import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthenticatedLayout } from "@/components/AuthenticatedLayout";

import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import Register from "./pages/Register";
import AmbulatoryCharts from "./pages/AmbulatoryCharts";
import Patients from "./pages/Patients";
import PatientProfile from "./pages/PatientProfile";

function AuthenticatedRoutes() {
  return (
    <AuthenticatedLayout>
      <Outlet />
    </AuthenticatedLayout>
  );
}

const App = () => {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="klinika-theme">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Auth />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/register" element={<Register />} />
          
          <Route element={<AuthenticatedRoutes />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/patients/:id" element={<PatientProfile />} />
            <Route path="/ambulatory-charts" element={<AmbulatoryCharts />} />
            <Route path="/admin" element={<Dashboard />} />
            <Route path="/profile" element={<Dashboard />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
