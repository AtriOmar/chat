import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useChatContext } from "@/contexts/ChatProvider";
import { formatDate } from "@/lib/formatDate";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleUser } from "@fortawesome/free-solid-svg-icons";
import { useAuthContext } from "@/contexts/AuthProvider.jsx";
import MessageCard from "@/components/MessageCard.jsx";
import RingLoader from "@/components/RingLoader.jsx";

let prevReceiver = -1;

export default function MessagesBox({ user: receiver, messages, limit, conversation, refetching }) {
  const { user } = useAuthContext();

  // useEffect(() => {
  //   console.log("messages", messages);
  //   console.log("conversation", conversation);
  // }, [messages, conversation]);

  const [firstRender, setFirstRender] = useState(true);
  const { isConnected } = useChatContext();

  useEffect(() => {
    // if (!receiver) return;

    if (prevReceiver === receiver?.id) return;

    setFirstRender(true);
    prevReceiver = receiver?.id;
  }, [receiver?.id]);

  // scrolling to bottom when a new message arrives
  useLayoutEffect(() => {
    const messagesBox = document.querySelector(".messagesBox");
    const allMessages = document.querySelectorAll(".message-container");
    const lastMessage = allMessages[0];

    if (firstRender && messages?.length) {
      lastMessage?.scrollIntoView();
      //   setFirstRender(false);
      // firstRender = false;
      setFirstRender(false);
    }

    if (messagesBox.scrollHeight - messagesBox.clientHeight - messagesBox.scrollTop - (lastMessage?.scrollHeight || 0) < 5) {
      lastMessage?.scrollIntoView();
    }
  }, [messages, firstRender]);

  return (
    <div className="grow scroll-auto overflow-y-scroll  max-[600px]:scrollbar-none messagesBox relative" style={{ pointerEvents: "auto" }}>
      <div className="flex flex-col justify-end min-h-full px-3 pb-3 pointer-events-auto min-w-[250px] messagesContainer">
        {limit > (messages?.length || 0) && !refetching ? (
          <div className="flex flex-col items-center gap-2 mt-6">
            {receiver?.picture ? (
              <div className="relative w-[125px] aspect-square rounded-[50%] border overflow-hidden">
                <img src={`/api/photo?path=/uploads/profile-pictures/${receiver?.picture}`} alt="Profile picture" className="object-cover" fill />
              </div>
            ) : (
              // <UserCircleIcon className="w-[125px] aspect-square" />
              <FontAwesomeIcon icon={faCircleUser} className="text-[125px] aspect-square text-slate-400" />
            )}
            <h1 className="font-rubik font-bold text-slate-900 text-xl capitalize break-anywhere">
              {conversation?.group || conversation?.name ? conversation.name : receiver?.username}
            </h1>
          </div>
        ) : (
          <i className="mx-auto">
            <RingLoader width="40" height="40" />
          </i>
        )}
        <div className={`${false ? "flex" : "hidden"} flex-col gap-2 items-center loading`}>
          <RingLoader width={30} height={30} color="#999" />
        </div>
        <div className="flex flex-col-reverse gap-[2px] mt-4">
          {messages?.map((message, index) => {
            return (
              <div key={message.id} className="message-container">
                <MessageCard messages={messages} index={index} conversation={conversation} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
