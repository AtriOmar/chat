import React, { useState, useContext, useEffect } from "react";
import { useAuthContext } from "./AuthProvider";
import { socket } from "@/lib/socket.js";

const ChatContext = React.createContext();

function ChatProvider({ children }) {
  const { user, setUser } = useAuthContext();
  const [conversations, setConversations] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [openConversations, setOpenConversations] = useState([]);
  const [registrationToken, setRegistrationToken] = useState(null);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [replyTo, setReplyTo] = useState(null);

  async function onConversation(value) {
    console.log("-------------------- conversation event --------------------");
    console.log(value);
    setOpenConversations((prev) => {
      let found = false;
      const newConv = prev.map((el) => {
        if (el.id === value.id) {
          found = true;
          return value;
        } else {
          return el;
        }
      });

      if (!found) {
        newConv.push(value);
      }

      return newConv.slice(-5);
    });
    setConversations((prev) =>
      [value, ...prev.filter((conv) => conv.id !== value.id)].sort(
        (a, b) => new Date(b.Messages?.[0]?.createdAt || b.createdAt || null) - new Date(a.Messages?.[0]?.createdAt || a.createdAt || null)
      )
    );
  }

  useEffect(() => {
    socket.on("conversation", onConversation);

    return () => {
      socket.off("conversation", onConversation);
    };
  }, [conversations]);

  async function initSocket() {
    if (!user) {
      setOpenConversations([]);
      return;
    }
    async function onConversations(value) {
      if (conversationsLoading) {
        setConversationsLoading(false);
      }
      setConversations(value);
      socket.off("conversations", onConversations);
    }

    const token = localStorage.getItem("calculator_token");
    socket._opts.query.token = `Bearer ${token}`;

    console.log("-------------------- user from initSocket --------------------");
    console.log(user);
    console.log("-------------------- socket._opts.query --------------------");
    console.log(socket._opts.query);

    // socket._opts.query.registrationToken = registrationToken;
    socket.connect();
    socket.on("connect", () => {
      setIsConnected(true);
    });
    socket.on("disconnect", () => {
      setIsConnected(false);
    });
    socket.on("conversations", onConversations);
  }

  useEffect(() => {
    setConversations([]);
    initSocket();

    return () => {
      socket.disconnect();
      socket.off("connect");
      socket.off("disconnect");
    };
  }, [user, registrationToken]);

  const value = {
    conversations,
    setConversations,
    isConnected,
    openConversations,
    setOpenConversations,
    registrationToken,
    conversationsLoading,
    replyTo,
    setReplyTo,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export default ChatProvider;

export function useChatContext() {
  return useContext(ChatContext);
}
