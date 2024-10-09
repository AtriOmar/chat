import MembersSelect from "@/components/MembersSelect.jsx";
import Modal from "@/components/Modal.jsx";
import { useAuthContext } from "@/contexts/AuthProvider.jsx";
import { socket } from "@/lib/socket.js";
import { faCircleUser, faExclamationTriangle, faSearch } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useMemo, useState } from "react";

export default function DeleteMessageModal({ resolve, reject, message }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(true);
  }, []);

  return (
    <Modal
      show={show}
      hide={() => {
        resolve(false);
        setShow(false);
      }}
      overlayClassName="bg-black bg-opacity-10"
      dialogClassName="w-full scr600:max-w-[400px] py-8 px-6 scr600:rounded-3xl"
    >
      <div>
        <p className="font-medium text-lg text-center">Are you sure you want to delete the message:</p>
        <p className="font-medium text-lg text-center">"{message?.content}" ?</p>

        <div className="flex gap-2 mt-6">
          <button
            onClick={() => {
              resolve(true);
              setShow(false);
            }}
            className="flex-1 rounded-lg py-2 bg-red-500 hover:bg-red-600 text-white duration-200"
          >
            Delete
          </button>
          <button
            onClick={() => {
              resolve(false);
              setShow(false);
            }}
            className="flex-1 rounded-lg py-2 bg-slate-300 hover:bg-slate-400 text-slate-900 duration-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}
