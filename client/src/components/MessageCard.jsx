import { formatDate, messageTime } from "@/lib/formatDate";
import { Tooltip } from "react-tooltip";
import { useAuthContext } from "@/contexts/AuthProvider.jsx";
import { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsisVertical, faReply } from "@fortawesome/free-solid-svg-icons";
import { faFaceSmile } from "@fortawesome/free-regular-svg-icons";
import { useChatContext } from "@/contexts/ChatProvider.jsx";
import { socket } from "@/lib/socket.js";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import ViewReactsModal from "@/components/ViewReactsModal.jsx";
import { useAlertsContext } from "@/contexts/AlertsProvider.jsx";
import DeleteMessageModal from "@/components/DeleteMessageModal.jsx";

export default function MessageCard({ index, messages, conversation }) {
  const { user } = useAuthContext();
  const { setReplyTo } = useChatContext();
  const [showReactsModal, setShowReactsModal] = useState(false);
  const { confirm } = useAlertsContext();

  const message = messages[index];
  const prevMessage = messages[index + 1];

  const membersObj = useMemo(
    () =>
      conversation?.members?.reduce((acc, member) => {
        acc[member?.user?.id] = member;
        return acc;
      }, {}) || {},
    [conversation]
  );

  const time = messageTime(messages, index);

  const isLeft = message.senderId !== user.id;

  function handleReply() {
    setReplyTo(message);
  }

  const uniqueReactions = useMemo(
    () =>
      Object.keys(
        message?.reactions?.reduce((acc, reaction) => {
          if (!acc[reaction.reaction]) {
            acc[reaction.reaction] = true;
          }
          return acc;
        }, {})
      ),
    [message?.reactions]
  );

  const reactionsWithMembers = useMemo(
    () =>
      message?.reactions?.map((reaction) => ({
        user: {
          id: membersObj[reaction.user]?.user?.id,
          username: membersObj[reaction.user]?.user?.username,
        },
        reaction: reaction.reaction,
      })) || [],
    [message, membersObj]
  );

  async function handleDelete() {
    try {
      const res = await confirm(DeleteMessageModal, { message: { content: message?.content } });

      if (res) {
        socket.emit("deleteMessage", { messageId: message.id });
      }
    } catch (err) {
      console.log(err);
    }
  }

  if (!message) return;

  return (
    <div>
      {time ? <p className="w-full text-center text-slate-600 text-sm font-medium mb-2">{time}</p> : ""}

      {(conversation?.group &&
        message.senderId !== user?.id &&
        new Date(message.createdAt).getTime() - new Date(prevMessage?.createdAt || null).getTime() > 600000) ||
      (conversation?.group && message.senderId !== user?.id && prevMessage.senderId !== message.senderId) ? (
        <div className="mt-2 font-bold text-slate-500 text-left text-sm">{membersObj[message.senderId]?.user?.username}</div>
      ) : (
        ""
      )}
      {message?.replyTo?.content ? <div className="pt-14"></div> : ""}

      <div className={`relative flex items-center gap-1 ${!isLeft ? "flex-row-reverse" : ""}`}>
        {/* display the replyTo message if there is one */}
        {message?.replyTo?.content ? (
          <div className={`${isLeft ? "left-0" : "right-0"} w-full absolute bottom-full translate-y-3 z-[-1] text-slate-600 `}>
            <p className={`${isLeft ? "" : "ml-auto"} w-fit text-sm`}>
              <span className="font-bold">{membersObj[message.senderId]?.user?.username}</span> replied to{" "}
              <span className="font-bold">{membersObj[message?.replyTo?.senderId]?.user?.username}</span>
            </p>
            <div className={`${isLeft ? "" : "ml-auto"} w-fit max-w-[80%] pb-3 pt-1 px-2 rounded-xl bg-indigo-100 text-slate-500`}>
              <p className="line-clamp-1" style={{ overflowWrap: "anywhere" }}>
                {message?.replyTo?.deleted ? "Deleted Message" : message?.replyTo?.content}
              </p>
            </div>
          </div>
        ) : (
          ""
        )}
        <div
          id={`message-${message.id}`}
          className={`relative w-fit max-w-[85%] py-1 px-3 rounded-xl whitespace-pre-wrap  ${
            message?.deleted ? "border bg-slate-100 text-slate-900" : !isLeft ? "bg-purple-500 text-white" : "bg-slate-300"
          } `}
        >
          <p style={{ overflowWrap: "anywhere" }}>{message?.deleted ? "Deleted Message" : message?.content}</p>

          {/* display the reactions if there are any */}
          {message?.reactions?.length ? (
            <button
              onClick={() => {
                setShowReactsModal(true);
              }}
              className={`${isLeft ? "left-0" : "right-0"} absolute top-full -translate-y-1.5 flex rounded-2xl bg-white shadow-[0_1px_5px_rgb(0,0,0,.2)]`}
            >
              {uniqueReactions?.map((reaction) => (
                <span key={reaction}>{reaction}</span>
              ))}
              {message?.reactions?.length > 1 ? <span className="text-sm self-end pl-1 pr-2 text-slate-900">{message?.reactions?.length}</span> : ""}
            </button>
          ) : (
            ""
          )}
        </div>
        <div className="px-2"></div>
        <div className={`${isLeft ? "" : "flex-row-reverse"} flex gap-2`}>
          <Popover>
            <PopoverButton className="size-8 rounded-full hover:bg-slate-100 overflow-visible">
              <FontAwesomeIcon icon={faFaceSmile} className="text-lg text-slate-400" />
            </PopoverButton>
            <PopoverPanel anchor="top" className="p-2">
              {({ close }) => <EmojiPicker message={message} close={close} />}
            </PopoverPanel>
          </Popover>
          <button onClick={handleReply} className="size-8 rounded-full hover:bg-slate-100">
            <FontAwesomeIcon icon={faReply} className="text-lg text-slate-400" />
          </button>
          <button onClick={handleDelete} className="size-8 rounded-full hover:bg-slate-100">
            <FontAwesomeIcon icon={faEllipsisVertical} className="text-lg text-slate-400" />
          </button>
        </div>
      </div>
      {/* we need a gap if we have reactions */}
      {message?.reactions?.length > 0 && <div className="pt-5"></div>}
      <Tooltip style={{ zIndex: 1 }} anchorSelect={`#message-${message.id}`} content={formatDate(message.createdAt)} place="right" />
      <ViewReactsModal
        show={showReactsModal}
        hide={() => {
          setShowReactsModal(false);
        }}
        reactions={reactionsWithMembers}
        messageId={message?._id}
      />
    </div>
  );
}

function EmojiPicker({ close, message }) {
  function sendReaction(emoji) {
    socket.emit("reaction", { messageId: message.id, reaction: emoji });
    close();
  }

  return (
    <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-3xl bg-white shadow-[0_1px_8px_rgb(0,0,0,.3)] text-2xl">
      <div className="hover:scale-125 duration-200">
        <button
          onClick={() => {
            sendReaction("❤️");
          }}
        >
          ❤️
        </button>
      </div>
      <div className="hover:scale-125 duration-200">
        <button
          onClick={() => {
            sendReaction("😂");
          }}
        >
          😂
        </button>
      </div>
      <div className="hover:scale-125 duration-200">
        <button
          onClick={() => {
            sendReaction("😢");
          }}
        >
          😢
        </button>
      </div>
      <div className="hover:scale-125 duration-200">
        <button
          onClick={() => {
            sendReaction("😮");
          }}
        >
          😮
        </button>
      </div>
      <div className="hover:scale-125 duration-200">
        <button
          onClick={() => {
            sendReaction("👍");
          }}
        >
          👍
        </button>
      </div>
      <div className="hover:scale-125 duration-200">
        <button
          onClick={() => {
            sendReaction("👎");
          }}
        >
          👎
        </button>
      </div>
    </div>
  );
}
