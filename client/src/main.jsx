import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/App.jsx";
import "@/index.css";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import Chat from "@/pages/Chat";
import Layout from "@/layouts/Layout.jsx";
import AuthProvider from "@/contexts/AuthProvider.jsx";
import ChatProvider from "@/contexts/ChatProvider.jsx";
import axios from "axios";
import Signup from "@/pages/Signup.jsx";
import UIProvider from "@/contexts/UIProvider.jsx";
import ChatLayout from "@/layouts/ChatLayout.jsx";
import Signin from "@/pages/Signin.jsx";
import NoSelectedChat from "@/pages/NoSelectedChat.jsx";
import "react-toastify/dist/ReactToastify.css";
import AlertsProvider from "@/contexts/AlertsProvider.jsx";

axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;
axios.defaults.withCredentials = true;
axios.interceptors.request.use(async function (config) {
  const token = localStorage.getItem("calculator_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;

  return config;
});

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <Error />,
    children: [
      {
        index: true,
        element: <App />,
      },
      {
        path: "chat",
        element: <ChatLayout />,
        children: [
          {
            index: true,
            element: <NoSelectedChat />,
          },
          {
            path: ":id",
            element: <Chat />,
          },
        ],
      },
      {
        path: "signup",
        element: <Signup />,
      },
      {
        path: "signin",
        element: <Signin />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <ChatProvider>
      <UIProvider>
        <AlertsProvider>
          <RouterProvider router={router} />
        </AlertsProvider>
      </UIProvider>
    </ChatProvider>
  </AuthProvider>
);
