import MembersSelect from "@/components/MembersSelect.jsx";
import Modal from "@/components/Modal.jsx";
import { useAuthContext } from "@/contexts/AuthProvider.jsx";
import { socket } from "@/lib/socket.js";
import { faCircleUser, faExclamationTriangle, faSearch } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useDebouncedCallback } from "use-debounce";

export default function ViewReactsModal({ show, hide, reactions, messageId }) {
  const { user } = useAuthContext();
  const sortedReactions = useMemo(() => {
    if (!reactions?.length) return [];
    const userReaction = reactions.find((reaction) => reaction?.user?.id === user?.id);
    if (userReaction) {
      return [userReaction, ...reactions.filter((reaction) => reaction?.user?.id !== user?.id)];
    } else {
      return reactions;
    }
  }, [reactions]);

  function removeReaction() {
    socket.emit("reaction", {
      reaction: null,
      messageId,
    });
    hide();
  }

  return (
    <Modal show={show} hide={hide} overlayClassName="bg-black bg-opacity-10" dialogClassName="w-full scr600:max-w-[400px] py-8 px-6 scr600:rounded-3xl">
      <div>
        <p className="mb-2 font-bold">Reactions</p>
        <div className="max-h-[60vh] overflow-y-auto">
          {sortedReactions?.map((reaction) =>
            reaction?.user?.id === user?.id ? (
              <button onClick={removeReaction} key={reaction?.user?.id} className="flex items-center gap-2 w-full p-1 rounded-lg hover:bg-slate-100 text-left">
                <div className="shrink-0 relative w-[40px] aspect-square rounded-[50%] border bg-white overflow-hidden">
                  <FontAwesomeIcon icon={faCircleUser} className="w-full h-full text-slate-400" />
                </div>
                <div className="grow">
                  <p className="font-semibold">{reaction?.user?.username}</p>
                  <p className="text-slate-600 text-sm">Tap to remove</p>
                </div>
                <p>{reaction?.reaction}</p>
              </button>
            ) : (
              <div key={reaction?.user?.id} className="flex items-center gap-2 p-1">
                <div className="shrink-0 relative w-[40px] aspect-square rounded-[50%] border bg-white overflow-hidden">
                  <FontAwesomeIcon icon={faCircleUser} className="w-full h-full text-slate-400" />
                </div>
                <div className="grow">
                  <p className="font-semibold">{reaction?.user?.username}</p>
                </div>
                <p>{reaction?.reaction}</p>
              </div>
            )
          )}
        </div>
      </div>
    </Modal>
  );
}
