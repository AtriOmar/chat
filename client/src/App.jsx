import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/chat");
  }, []);

  return null;
}

export default App;
