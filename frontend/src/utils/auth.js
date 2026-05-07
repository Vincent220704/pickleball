// ─── Token ───────────────────────────────────────────────────────────────────
export const getToken = () => localStorage.getItem("token");

export const setToken = (token) => localStorage.setItem("token", token);

export const removeToken = () => localStorage.removeItem("token");

// ─── User ─────────────────────────────────────────────────────────────────────
export const getUser = () => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setUser = (user) =>
  localStorage.setItem("user", JSON.stringify(user));

export const removeUser = () => localStorage.removeItem("user");

// ─── Auth state ───────────────────────────────────────────────────────────────
export const isLoggedIn = () => !!getToken();

export const getRole = () => getUser()?.role ?? null;

export const isAdmin = () => ["admin", "super_admin"].includes(getRole());

export const isSuperAdmin = () => getRole() === "super_admin";

// ─── Logout (xóa toàn bộ) ────────────────────────────────────────────────────
export const clearAuth = () => {
  removeToken();
  removeUser();
};