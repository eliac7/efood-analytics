import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../Hooks/Auth/useAuth";

const ProtectedRoutes = (props: any) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/" />;
  }

  return <Outlet {...props} />;
};

export default ProtectedRoutes;
