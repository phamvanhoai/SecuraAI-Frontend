export const endpoints = {
  auth: { login: "/auth/login", refresh: "/auth/refresh", logout: "/auth/logout" },
  users: { me: "/users/me" },
} as const;
