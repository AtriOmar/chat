import React, { useState, useContext, useEffect } from "react";

const AlertsContext = React.createContext();

function AlertsProvider({ children }) {
  const [alerts, setAlerts] = useState([]);

  function confirm(Component, props = {}, options = {}) {
    return new Promise((resolve, reject) => {
      setAlerts([...alerts, <Component {...props} resolve={resolve} reject={reject} />]);
    });
  }

  return (
    <AlertsContext.Provider value={{ confirm }}>
      {alerts.map((alert, index) => (
        <div key={index}>{alert}</div>
      ))}
      {children}
    </AlertsContext.Provider>
  );
}

export default AlertsProvider;

export function useAlertsContext() {
  return useContext(AlertsContext);
}
