import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
// import axios, { setToken } from "../lib/axiosInstance";

const AuthContext = React.createContext();

function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined);

  async function getUserStatus() {
    try {
      const res = await axios.get("/login/status");
      setUser(res.data.user);
      return res;
    } catch (err) {
      console.log(err);
    }
  }

  useEffect(() => {
    getUserStatus();
  }, []);

  return <AuthContext.Provider value={{ user, setUser, getUserStatus }}>{children}</AuthContext.Provider>;
}

export default AuthProvider;

export function useAuthContext() {
  return useContext(AuthContext);
}
