import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login          from "./pages/Login";
import Register       from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword  from "./pages/ResetPassword";

import PrivateRoute    from "./components/PrivateRoute";
import AdminRoute      from "./components/AdminRoute";
import SuperAdminRoute from "./components/SuperAdminRoute";

import Courts      from "./pages/Courts";
import CourtDetail from "./pages/CourtDetail";
import Booking     from "./pages/Booking";
import UserHome    from "./pages/UserHome";
import Payment     from "./pages/Payment";
import Review      from "./pages/Review";
import Profile     from "./pages/Profile";
import News        from "./pages/News";
import NewsDetail  from "./pages/NewsDetail";

import AdminHome     from "./pages/AdminHome";
import AdminCourts   from "./pages/AdminCourts";
import AdminBookings from "./pages/AdminBookings";
import AdminSlots    from "./pages/AdminSlots";
import AdminUsers    from "./pages/AdminUsers";
import AdminPayments from "./pages/AdminPayments";
import AdminNews     from "./pages/AdminNews";

import UserLayout  from "./layouts/UserLayout";
import AdminLayout from "./layouts/AdminLayout";

import { isLoggedIn, isAdmin } from "./utils/auth";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── PUBLIC ───────────────────────────────────────────────────── */}
        <Route path="/" element={
          <UserLayout><UserHome /></UserLayout>
        }/>
        <Route path="/courts" element={
          <UserLayout><Courts /></UserLayout>
        }/>
        <Route path="/courts/:id" element={
          <UserLayout><CourtDetail /></UserLayout>
        }/>
        <Route path="/news"     element={<UserLayout><News /></UserLayout>} />
        <Route path="/news/:id" element={<UserLayout><NewsDetail /></UserLayout>} />

        {/* ── AUTH ─────────────────────────────────────────────────────── */}
        <Route path="/login" element={
          isLoggedIn()
            ? <Navigate to={isAdmin() ? "/admin" : "/"} replace />
            : <Login />
        }/>
        <Route path="/register" element={
          isLoggedIn() ? <Navigate to="/" replace /> : <Register />
        }/>
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password"  element={<ResetPassword />} />

        {/* ── PRIVATE (cần login) ───────────────────────────────────────── */}
        <Route path="/booking/:courtId" element={
          <PrivateRoute><UserLayout><Booking /></UserLayout></PrivateRoute>
        }/>
        <Route path="/booking" element={
          <Navigate to="/courts" replace />
        }/>
        <Route path="/payment/:booking_id" element={
          <PrivateRoute><UserLayout><Payment /></UserLayout></PrivateRoute>
        }/>
        <Route path="/profile" element={
          <PrivateRoute><UserLayout><Profile /></UserLayout></PrivateRoute>
        }/>
        <Route path="/review" element={
          <PrivateRoute><UserLayout><Review /></UserLayout></PrivateRoute>
        }/>

        {/* ── ADMIN ────────────────────────────────────────────────────── */}
        <Route path="/admin" element={
          <AdminRoute><AdminLayout><AdminHome /></AdminLayout></AdminRoute>
        }/>
        <Route path="/admin/courts" element={
          <AdminRoute><AdminLayout><AdminCourts /></AdminLayout></AdminRoute>
        }/>
        <Route path="/admin/bookings" element={
          <AdminRoute><AdminLayout><AdminBookings /></AdminLayout></AdminRoute>
        }/>
        <Route path="/admin/slots" element={
          <AdminRoute><AdminLayout><AdminSlots /></AdminLayout></AdminRoute>
        }/>
        <Route path="/admin/payments" element={
          <AdminRoute><AdminLayout><AdminPayments /></AdminLayout></AdminRoute>
        }/>
        <Route path="/admin/news" element={
          <AdminRoute><AdminLayout><AdminNews /></AdminLayout></AdminRoute>
        }/>
        <Route path="/admin/users" element={
          <SuperAdminRoute><AdminLayout><AdminUsers /></AdminLayout></SuperAdminRoute>
        }/>

        {/* ── 404 ──────────────────────────────────────────────────────── */}
        <Route path="*" element={
          <div style={{
            minHeight:      "100vh",
            display:        "flex",
            flexDirection:  "column",
            alignItems:     "center",
            justifyContent: "center",
            background:     "#f5f5f5",
          }}>
            <div style={{ fontSize: 64 }}>🏸</div>
            <h2>404 — Trang không tồn tại</h2>
            <a href="/" style={{ color: "#3498db" }}>← Về trang chủ</a>
          </div>
        }/>

      </Routes>
    </BrowserRouter>
  );
}

export default App;