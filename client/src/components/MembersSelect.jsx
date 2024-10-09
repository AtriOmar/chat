import axios from "axios";
import React from "react";
import { useEffect } from "react";
import AsyncSelect from "react-select/async";
import makeAnimated from "react-select/animated";
import reactStringReplace from "react-string-replace";
import { useAuthContext } from "@/contexts/AuthProvider.jsx";

const animatedComponents = makeAnimated();

function MembersSelect({ setPeople }) {
  const { user } = useAuthContext();

  async function fetchUsers(username) {
    const res = await axios.get("/users/getAll", {
      params: {
        limit: 10,
        search: username,
      },
    });

    const data = res.data;
    return data.map((obj) => ({
      value: obj._id,
      label: username.length ? reactStringReplace(obj.username, username, (match, i) => <b key={i}>{match}</b>) : obj.username,
    }));
  }

  return (
    <div>
      <AsyncSelect
        styles={{ container: (provided) => ({ ...provided, margin: 0 }) }}
        closeMenuOnSelect={false}
        components={animatedComponents}
        isMulti
        defaultOptions
        loadOptions={fetchUsers}
        filterOption={(option) => option.value !== user?._id}
        className="mt-2"
        onChange={(newPeople) => setPeople(newPeople.map((curr) => curr.value))}
      />
    </div>
  );
}

export default MembersSelect;
