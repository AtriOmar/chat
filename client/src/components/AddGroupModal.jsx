import MembersSelect from "@/components/MembersSelect.jsx";
import Modal from "@/components/Modal.jsx";
import { useAuthContext } from "@/contexts/AuthProvider.jsx";
import { faExclamationTriangle, faSearch } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useDebouncedCallback } from "use-debounce";

export default function AddGroupModal({ show, hide }) {
  const [input, setInput] = useState({
    name: "",
    search: "",
    members: [],
  });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function createGroup(e) {
    e.preventDefault();

    if (sending) return;

    if (!input.name.trim().length || !input.members.length) {
      setError("Please fill all fields");
      return;
    }

    const newGroup = {
      name: input.name,
      members: input.members,
    };

    setSending(true);
    try {
      const res = await axios.post("/conversations/create", newGroup);

      console.log(res);
      toast.success("Group created successfully");
      setInput({ name: "", search: "", members: [] });
      hide();
    } catch (err) {
      console.log(err);
    }
    setSending(false);
  }

  return (
    <Modal show={show} hide={hide} overlayClassName="bg-black bg-opacity-10" dialogClassName="w-full scr600:max-w-[500px] py-8 px-6 scr600:rounded-3xl">
      <form onSubmit={createGroup}>
        <p className="font-bold text-lg">Create a new group</p>
        <label htmlFor="name" className="block font-medium">
          Name
        </label>
        <input
          id="name"
          type="text"
          className="w-full px-3 py-1 rounded-md border border-gray-300"
          placeholder="Name"
          value={input.name}
          onChange={(e) => setInput((prev) => ({ ...prev, name: e.target.value }))}
        />

        <label htmlFor="search" className="block mt-2 font-medium">
          Members
        </label>
        <MembersSelect setPeople={(value) => setInput((prev) => ({ ...prev, members: value }))} />
        {error && (
          <div className="mt-2 py-1 px-3 rounded-md text-red-500 bg-red-100 border border-red-500 w-full flex items-center gap-4">
            <FontAwesomeIcon icon={faExclamationTriangle} size="1x" fill="red" />
            {error}
          </div>
        )}
        <button type="submit" className="w-full py-1 mt-3 rounded-lg bg-green-500 hover:bg-green-600 duration-200 text-white font-bold ">
          Create
        </button>
      </form>
    </Modal>
  );
}
