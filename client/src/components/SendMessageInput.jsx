// import { PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { useChatContext } from "@/contexts/ChatProvider.jsx";
import { socket } from "@/lib/socket.js";
import { faPaperPlane, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";

export default function SendMessageInput({ user, conversation }) {
  const [text, setText] = useState("");
  const textRef = useRef(null);
  const { id } = useParams();
  const { replyTo, setReplyTo } = useChatContext();

  const membersObj = useMemo(
    () =>
      conversation?.members?.reduce((acc, member) => {
        acc[member?.user?.id] = member;
        return acc;
      }, {}) || {},
    [conversation]
  );

  useEffect(() => {
    textRef.current.focus();
  }, [user?.id]);

  useEffect(() => {
    function handleClick(e) {
      if (e.detail === 1 && document.getSelection().toString() === "") textRef.current.focus();
    }

    const messagesBox = document.querySelector(".messagesBox");
    messagesBox.addEventListener("click", handleClick);

    return () => messagesBox.removeEventListener("click", handleClick);
  }, []);

  function handleSubmit() {
    if (!text.trim().length) {
      setText("");
      textRef.current.innerText = "";
      return;
    }

    textRef.current.innerText = "";
    socket.emit("message", { receiver: id, message: text, replyTo: replyTo?.id || null });

    setText("");
    setReplyTo(null);
  }

  function handlePaste(event) {
    event.preventDefault();

    let paste = (event.clipboardData || window.clipboardData).getData("text/plain");
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    selection.deleteFromDocument();
    selection.getRangeAt(0).insertNode(document.createTextNode(paste));
    selection.collapseToEnd();

    setText(event.target.innerText);
  }

  return (
    <div>
      {replyTo ? (
        <div className="flex items-center px-4 mr-12 py-2 border-t bg-white">
          <div className="flex-1">
            <p className="font-medium">Reply To {membersObj[replyTo.senderId]?.user?.username}:</p>
            <p className="line-clamp-1">{replyTo?.content}</p>
          </div>
          <button
            onClick={() => {
              setReplyTo(null);
            }}
            className="flex items-center justify-center size-8 rounded-full bg-slate-100 hover:bg-slate-200 duration-200"
          >
            <FontAwesomeIcon icon={faXmark} className="text-lg" />
          </button>
        </div>
      ) : (
        ""
      )}
      <div className="flex gap-2 px-4">
        <div
          className="grow rounded-lg px-3 py-2 overflow-y-auto max-h-[100px] bg-slate-100  ring-2 ring-slate-300 focus-within:ring-purple-500 focus-within:ring-opacity-75"
          style={{ overflowWrap: "anywhere" }}
        >
          <p
            contentEditable
            className="sendThoughtInput outline-none whitespace-pre-line break-anywhere"
            suppressContentEditableWarning={true}
            onInput={(e) => {
              setText(e.target.innerText);
            }}
            placeholder="Type your thoughts.."
            ref={textRef}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            onPaste={handlePaste}
            spellCheck={false}
          ></p>
        </div>
        <button onClick={handleSubmit}>
          {/* <FontAwesomeIcon icon={faPaperPlane} className="text-xl fill-white hover:fill-blue-300 transition duration-200" /> */}
          {SEND_SVG}
        </button>
      </div>
    </div>
  );
}

const SEND_SVG = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-8 h-8 fill-purple-500 hover:fill-purple-700 transition duration-200">
    <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
  </svg>
);
