import ChatSidebar from "@/components/ChatSidebar";
import RingLoader from "@/components/RingLoader.jsx";
import { useAuthContext } from "@/contexts/AuthProvider.jsx";
import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router";

export default function ChatLayout() {
  const { user } = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (user === null) {
      navigate("/signin");
    }
  }, [user]);

  if (!user) {
    return <RingLoader color="white" />;
  }

  return (
    <>
      <ChatSidebar />
      <main className="h-screen scr800:ml-[300px] duration-300">
        <Outlet />
      </main>
    </>
  );
}
