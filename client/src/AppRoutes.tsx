import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";

const AppRoutes = () => {
  const token = localStorage.getItem("token");

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            token ? (
              <Navigate to="/dashboard" />
            ) : (
              <LoginPage />
            )
          }
        />

        <Route
          path="/dashboard"
          element={
            token ? (
              <DashboardPage />
            ) : (
              <Navigate to="/" />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;