import { useSession } from "@/context/SessionProvider";
import { Navigate, Outlet } from "react-router-dom";

const AuthGuard = () => {
  const { session } = useSession();

  if (!session) {
    return <Navigate to="/login" />;
  }

  return <Outlet />;
};

export default AuthGuard;