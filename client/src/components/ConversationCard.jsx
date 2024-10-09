import React, { useEffect, useMemo, useState } from "react";
import { formatDateRelative } from "@/lib/formatDate";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleUser, faUserGroup } from "@fortawesome/free-solid-svg-icons";
import { useAuthContext } from "@/contexts/AuthProvider.jsx";
import { useParams } from "react-router";
import { Link } from "react-router-dom";

export default function ConversationCard({ conversation }) {
  const { user } = useAuthContext();
  const { id } = useParams();

  const otherUser = conversation?.members?.[0]?.user?.id === user?.id ? conversation?.members?.[1] : conversation?.members?.[0];
  const [formattedDate, setFormattedDate] = useState(conversation?.Messages?.[0]?.createdAt && formatDateRelative(conversation?.Messages?.[0]?.createdAt));

  useEffect(() => {
    if (!conversation?.Messages?.[0]?.createdAt) return;

    setFormattedDate(formatDateRelative(conversation?.Messages?.[0]?.createdAt, "short"));
    const interval = setInterval(() => {
      setFormattedDate(formatDateRelative(conversation?.Messages?.[0]?.createdAt, "short"));
    }, 30000);

    return () => clearInterval(interval);
  }, [conversation]);

  if (!conversation) return;

  return (
    <Link
      to={"/chat/" + (conversation?.group === true ? conversation?.id : otherUser?.user?.id)}
      className={`${
        (conversation?.group && id === conversation?._id) || (!conversation?.group && id === otherUser?.user?.id) ? "bg-slate-200" : ""
      } relative block grow max-w-[400px] mx-0.5 py-2 px-3 rounded-lg hover:bg-slate-300 hover:shadow-card2 duration-300`}
    >
      {conversation?.group ? (
        <i className="block absolute top-1 right-2">
          <FontAwesomeIcon icon={faUserGroup} className="text-slate-900" />
        </i>
      ) : (
        ""
      )}
      {/* <p className={`absolute top-1 right-2 font-bold text-xs ${conversation.seen === "both" || conversation.seen === user.id + "" ? "hidden" : ""}`}>New</p> */}
      <div className="flex items-center gap-3">
        {otherUser?.user?.picture ? (
          <div className="shrink-0 relative w-[40px] aspect-square rounded-[50%] border bg-white overflow-hidden">
            {/* <img src={`/api/photo?path=/uploads/profile-pictures/${otherUser?.picture}`} alt="Profile picture" className="object-cover" fill /> */}
          </div>
        ) : (
          <FontAwesomeIcon icon={faCircleUser} className="text-[40px] aspect-square text-slate-400" />
        )}
        <div>
          <h3 className="font-semibold text-black capitalize">{conversation?.group || conversation?.name ? conversation.name : otherUser?.user?.username}</h3>

          {conversation?.Messages?.[0] ? (
            <div className="flex text-sm text-slate-700">
              <p className="text-sm text-slate-700 break-all line-clamp-1">
                {conversation?.Messages?.[0]?.senderId === user.id ? <span className="">You: </span> : ""}
                {conversation?.Messages?.[0]?.content}
              </p>
              <span className="mx-1">.</span>
              <p className="">{formattedDate}</p>
            </div>
          ) : (
            <p className="text-sm text-slate-700 break-all line-clamp-1">Created {formatDateRelative(conversation.createdAt)}</p>
          )}
        </div>
      </div>
    </Link>
  );
}
