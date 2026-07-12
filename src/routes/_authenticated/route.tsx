import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: () => {
    let userId = localStorage.getItem("connect_abroad_user_id");
    if (!userId) {
      userId = typeof crypto.randomUUID === "function" 
        ? crypto.randomUUID() 
        : Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem("connect_abroad_user_id", userId);
    }
    return { 
      user: { 
        id: userId, 
        email: "student@connectabroad.com" 
      } 
    };
  },
  component: () => <Outlet />,
});
