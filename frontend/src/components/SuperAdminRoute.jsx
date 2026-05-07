
import { Navigate } from "react-router-dom";
import { isLoggedIn, isSuperAdmin } from "../utils/auth";

export default function SuperAdminRoute({ children }) {
  if (!isLoggedIn())   return <Navigate to="/login" replace />;
  if (isSuperAdmin())  return children;
  return <Navigate to="/admin" replace />;
}