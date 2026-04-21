import React from "react";
import { initAWS } from "./aws/awsConfig";
import { AlertProvider } from "./context/AlertContext";

// screens
import Login from "./screens/Login";

initAWS();

export default function App() {
  return (
    <AlertProvider>
      <Login />
    </AlertProvider>
  );
}