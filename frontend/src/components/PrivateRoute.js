// D:\Pickerbal\frontend\src\components\PrivateRoute.js

import { Navigate, useLocation } from "react-router-dom";
import { isLoggedIn } from "../utils/auth";

export default function PrivateRoute({ children }) {
  const location = useLocation();

  return isLoggedIn()
    ? children
    : <Navigate
        to="/login"
        state={{ from: location, message: "Vui lòng đăng nhập để đặt sân" }}
        replace
      />;
}