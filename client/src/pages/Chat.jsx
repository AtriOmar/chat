import React, { useState, useEffect, useRef } from "react";
import { socket } from "@/lib/socket";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faBars, faCircleUser } from "@fortawesome/free-solid-svg-icons";
import { useChatContext } from "@/contexts/ChatProvider";
import { useUIContext } from "@/contexts/UIProvider";
import { useAuthContext } from "@/contexts/AuthProvider.jsx";
import { useNavigate, useParams } from "react-router";
import MessagesBox from "@/components/MessagesBox.jsx";
import SendMessageInput from "@/components/SendMessageInput.jsx";
import { Link } from "react-router-dom";
import RingLoader from "@/components/RingLoader.jsx";
import axios from "axios";

let currentBoxHeight;

export default function Chat() {
  const { user } = useAuthContext();

  const { id } = useParams();
  const [conversation, setConversation] = useState(undefined);
  const [messages, setMessages] = useState([]);
  const [receiver, setReceiver] = useState(undefined);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(30);
  const [refetching, setRefetching] = useState(false);
  const { isConnected } = useChatContext();
  const { setReplyTo } = useChatContext();
  const [newLimit, setNewLimit] = useState(false);
  const [visible, setVisible] = useState(true);
  const [toggle, setToggle] = useState(false);
  const navigate = useNavigate();
  const observing = useRef(-1);
  const resizeObserver = useRef(
    typeof window !== "undefined" &&
      new ResizeObserver((entries, obs) => {
        const el = document.querySelector(".messagesBox");

        if (el?.scrollTop === 0) {
          el.scrollTo(0, el.scrollHeight - currentBoxHeight);
        }

        currentBoxHeight = el?.scrollHeight;
      })
  );
  const observer = useRef(
    typeof window !== "undefined" &&
      new IntersectionObserver((entries, obs) => {
        const entry = entries[0];

        if (entry.isIntersecting) {
          setLimit((prev) => prev + 30);
          // fetchMessages(true);
          setNewLimit(true);
          obs.unobserve(entry.target);
        }
      })
  );
  const { setChatSidebarOpen } = useUIContext();

  useEffect(() => {
    if (newLimit) {
      fetchMessages(true);
      setNewLimit(false);
    }
  }, [newLimit]);

  useEffect(() => {
    const box2 = document.querySelector(".messagesContainer");
    if (box2) resizeObserver.current.observe(box2);

    if (!messages?.length || messages?.length < 5) return;

    const elements = document.querySelectorAll(".message-container");

    const el = elements?.[elements.length - 4];

    const msg = messages?.[messages?.length - 4];

    if (observing.current === msg?.id || !msg?.id) {
      return;
    }

    observing.current = msg?.id;

    if (el) observer.current.observe(el);
  }, [messages]);

  useEffect(() => {
    setToggle(false);

    setTimeout(() => {
      setToggle(true);
    }, 100);
  }, []);

  const cancelTokenSourceRef = useRef(null);

  async function fetchMessages(more = false) {
    if (more && messages?.length < 30) return;
    console.log("length", more, messages?.length);
    console.log("-------------------- fetching --------------------");

    // Cancel the previous request if it exists
    if (cancelTokenSourceRef.current) {
      console.log("canceling");
      cancelTokenSourceRef.current.cancel("Operation canceled due to new request.");
    }

    // Create a new cancel token source
    cancelTokenSourceRef.current = axios.CancelToken.source();

    setRefetching(true);
    try {
      const res = await axios.get("/conversations/getWithMessages", {
        params: {
          id,
          limit: 30,
          skip: more ? messages?.length : 0,
        },
        cancelToken: cancelTokenSourceRef.current.token, // Pass the cancel token
      });

      console.log("-------------------- getwithmessages --------------------");
      console.log(res.data);

      if (more) {
        setMessages((prev) => [...prev, ...res.data.messages]);
      } else {
        setReceiver(res.data.user);
        // if (res.data.messages) {
        //   res.data.conversation.Messages = res.data.messages;
        // }
        setConversation(res.data.conversation);
        setMessages(res.data.messages);
      }

      console.log("conversations ccccc", res.data);
      setLoading(false);
      setRefetching(false);
      console.log("mouch finally");
    } catch (err) {
      if (axios.isCancel(err)) {
        console.log("Request canceled", err.message);
      } else {
        console.log("err", err);
      }
    }

    console.log("finally");
  }

  useEffect(() => {
    console.log(id, conversation);
    if (!socket) return;

    fetchMessages();

    async function onMessage(message) {
      console.log("onMessage", message);
      setLimit((prev) => prev + 1);
      setMessages((prev) => [message, ...prev]);
    }

    async function onReaction({ messageId, reaction }) {
      console.log("reaction", messageId, reaction);

      setMessages((prev) => {
        const newMessages = JSON.parse(JSON.stringify(prev));
        if (newMessages) {
          const message = newMessages.find((m) => m.id === messageId);
          if (message) {
            if (!message.reactions) message.reactions = [];
            console.log("message.reactions", message.reactions, reaction);
            message.reactions = message?.reactions?.filter((r) => r.user.toString() !== reaction.user);
            if (reaction?.reaction) message.reactions.push(reaction);
          }
        }
        return newMessages;
      });
    }

    // this works when a new conversation with a new user is created, meaning when w
    // send a message to the receiver while there is no conversation
    async function onCreatedConversation({ conversation, messages }) {
      setConversation(conversation);
      setMessages(messages);
    }

    function onDeleteMessage({ messageId }) {
      setMessages((prev) =>
        prev.map((m) => {
          if (m._id === messageId) {
            m.deleted = true;
          }
          return m;
        })
      );
    }

    socket.emit("watchSingle", id, limit);

    socket.on("message", onMessage);

    socket.on("reaction", onReaction);

    socket.on("createdConversation", onCreatedConversation);

    socket.on("deleteMessage", onDeleteMessage);

    return () => {
      setConversation(undefined);
      setMessages([]);
      setLimit(30);
      setReplyTo(null);
      setLoading(true);
      socket.emit("unwatchSingle", id);
      socket.off("messages");
      socket.off("message");
      socket.off("reaction");
    };
  }, [isConnected, id]);

  useEffect(() => {
    function handleVisibilityChange(e) {
      if (e.target.visibilityState === "visible") {
        setVisible(true);
      } else {
        setVisible(false);
      }
    }

    function handleBlur() {
      setVisible(false);
    }

    function handleFocus() {
      setVisible(true);
    }

    // window.addEventListener("blur", handleBlur);
    // window.addEventListener("focus", handleFocus);

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      // window.removeEventListener("blur", handleBlur);
      // window.removeEventListener("focus", handleFocus);
    };
  }, []);

  useEffect(() => {
    if (conversation === null && receiver === null) {
      navigate("/chat");
    }
  }, [conversation, receiver]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <i>
          <RingLoader width="70" height="70" />
        </i>
      </div>
    );
  }

  if (!conversation && !receiver) {
    return;
  }

  // if (!receiver) {
  //   navigate("/chat");
  //   return;
  // }

  // if (!receiver) {
  //   return (
  //     <div className="grid place-items-center m-2 py-10 px-10 rounded-lg bg-white shadow-md">
  //       <div className="">
  //         {/* <img className="w-[150px] mx-auto " src={sad} alt="" /> */}
  //         <h3 className="mt-8 font-medium text-slate-900 text-xl text-center ">Nous ne trouvons pas l'utilisateur demandé</h3>
  //         <Link
  //           href="/"
  //           className="flex items-center justify-center gap-3 w-full py-2 px-3 mt-8 rounded-full bg-amber-400 hover:bg-amber-500 font-medium text-lg text-white cursor-pointer transition duration-300"
  //         >
  //           <FontAwesomeIcon icon={faArrowLeft} size="lg" />
  //           Retourner à l'accueil
  //         </Link>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="h-full flex pb-2  rounded-lg bg-whit shadow-md">
      <div className="relative w-full flex flex-col">
        <div className="relative flex  items-center gap-2 w-full py-1 px-4 bg-white shadow break-anywhere">
          <button
            className="scr800:hidden"
            onClick={() => {
              setChatSidebarOpen(true);
            }}
          >
            <FontAwesomeIcon icon={faBars} className="text-xl" />
          </button>
          <div className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-slate-200 duration-200">
            {receiver?.picture ? (
              <div className="relative w-[30px] aspect-square rounded-[50%] border bg-white overflow-hidden">
                <img src={`/api/photo?path=/uploads/profile-pictures/${receiver?.picture}`} alt="Profile picture" fill className="object-cover" />
              </div>
            ) : (
              <FontAwesomeIcon icon={faCircleUser} className="text-[30px] aspect-square text-slate-400" />
            )}

            <span className="text-sm scr700:text-base font-medium scr700:font-bold  text-black text-lg text-center  capitalize line-clamp-1">
              {conversation?.group || conversation?.name ? conversation.name : receiver?.username}
            </span>
          </div>
        </div>
        <MessagesBox user={receiver} messages={messages} limit={limit} conversation={conversation} fetchMessages={fetchMessages} refetching={refetching} />
        <SendMessageInput user={receiver} conversation={conversation} />
      </div>
    </div>
  );
}
