import { Navigate, Outlet } from "react-router-dom";
import Loading from "../../Components/Loading/Loading";
import { useAuth } from "../../Hooks/Auth/useAuth";

const ProtectedRoutes = (props: Record<string, unknown>) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading isLoading={loading} variant="login" />;
  }

  if (!user) {
    return <Navigate to="/" />;
  }

  return <Outlet {...props} />;
};

export default ProtectedRoutes;
