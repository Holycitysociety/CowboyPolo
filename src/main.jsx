// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./App.css";
import { ThirdwebProvider } from "thirdweb/react";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* Same clientId + provider setup as Patron site */}
    <ThirdwebProvider clientId="f58c0bfc6e6a2c00092cc3c35db1eed8">
      <App />
    </ThirdwebProvider>
  </React.StrictMode>
);