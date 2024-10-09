import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useAuthContext } from "@/contexts/AuthProvider";
import { useNavigate } from "react-router";
import { Link } from "react-router-dom";
import RingLoader from "@/components/RingLoader.jsx";
import { IonIcon } from "@ionic/react";
import { eyeOutline, eyeOffOutline } from "ionicons/icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";

export default function Signup() {
  const usernameRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);
  const [input, setInput] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState({
    signup: "",
  });
  const { setUser } = useAuthContext();
  const navigate = useNavigate();
  const [passwordVisible, setPasswordVisible] = useState(false);

  useEffect(() => {
    usernameRef.current?.focus();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    if (sending) return;

    if (!input?.password?.trim()?.length || !input?.username?.trim()?.length || !input?.confirmPassword?.trim()?.length) {
      setError((prev) => ({ ...prev, signup: "Please fill all the fields" }));
      return;
    }

    if (input.password !== input.confirmPassword) {
      setError((prev) => ({
        ...prev,
        signup: "Passwords do not match",
      }));
      return;
    }

    if (input.username?.indexOf(" ") > 0) {
      setError((prev) => ({
        ...prev,
        signup: "Username cannot contain spaces",
      }));
      return;
    }

    setSending(true);
    try {
      const user = {
        username: input.username,
        password: input.password,
      };

      const result = await axios.post("/users/create", user);

      localStorage.setItem("calculator_token", result?.data?.token);

      setUser(result.data);

      navigate("/chat");
    } catch (err) {
      setSending(false);
      console.log(err);
      const message = err.response?.data;
      if (message === "username already used") {
        setError((prev) => ({
          ...prev,
          signup: "Username already used",
        }));
        return;
      }

      setError((prev) => ({ ...prev, signup: "An error occured" }));
      return;
    }
    setSending(false);
  }

  return (
    <div className="flex items-center min-h-screen">
      <div className="w-full max-w-[800px] mx-auto">
        <header>
          <h3 className="mt-4 font-semibold text-center text-2xl text-black">Register</h3>
        </header>
        <form className="mt-10" onSubmit={handleSubmit}>
          <input
            placeholder="Username"
            type="text"
            name="username"
            onChange={(e) => setInput((prev) => ({ ...prev, username: e.target.value }))}
            value={input.username}
            className="w-full py-3 pl-4 pr-11 rounded-xl text-slate-900 text-xl outline-none focus:ring-2 focus:ring-cyan-300 border border-slate-300 font-rubik"
            ref={usernameRef}
          />
          <div className="relative mt-2">
            <input
              placeholder="Password"
              type={passwordVisible ? "text" : "password"}
              name="password"
              onChange={(e) => setInput((prev) => ({ ...prev, password: e.target.value }))}
              value={input.password}
              ref={passwordRef}
              className="w-full py-3 pl-4 pr-11 rounded-xl text-slate-900 text-xl outline-none focus:ring-2 focus:ring-cyan-300 border border-slate-300 font-rubik"
            />
            <i
              className="absolute top-1/2 -translate-y-1/2 right-4 flex items-center justify-center cursor-pointer"
              onClick={() => setPasswordVisible((visibility) => !visibility)}
            >
              {passwordVisible ? <IonIcon icon={eyeOutline} className="text-2xl" /> : <IonIcon icon={eyeOffOutline} className="text-2xl" />}
            </i>
          </div>
          <div className="relative mt-2">
            <input
              placeholder="Confirm Password"
              type={passwordVisible ? "text" : "password"}
              name="password"
              onChange={(e) => setInput((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              value={input.confirmPassword}
              ref={confirmPasswordRef}
              className="w-full py-3 pl-4 pr-11 rounded-xl text-slate-900 text-xl outline-none focus:ring-2 focus:ring-cyan-300 border border-slate-300 font-rubik"
            />
          </div>
          {error?.signup && (
            <div className="mt-2 py-3 px-4 rounded-xl text-red-500 bg-red-100 border border-red-500 w-full flex items-center gap-4">
              <FontAwesomeIcon icon={faExclamationTriangle} size="lg" fill="red" />
              {error?.signup}
            </div>
          )}
          <div className="relative mt-6">
            <input
              type="submit"
              value="Se connecter"
              className="w-full p-3 rounded-full bg-purple-500 hover:bg-purple-600 font-medium text-xl text-white cursor-pointer transition duration-300"
            />
            {sending ? (
              <i className="absolute right-2 top-1/2 -translate-y-1/2">
                <RingLoader color="white" />
              </i>
            ) : (
              ""
            )}
          </div>
          <div className="flex justify-between px-3">
            <Link to="/reset-password" className="text-blue-500 hover:underline">
              {/* Mot de passe oublié ? */}
            </Link>
            <Link to="/register" className="text-blue-500 hover:underline">
              S'inscrire
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
