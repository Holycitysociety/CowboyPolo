import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./App.css";

// ---- Thirdweb wrapper ----
// If your Patronium site uses a different setup (clientId, chain, etc),
// copy that here instead of this simple example.
import { ThirdwebProvider } from "@thirdweb-dev/react";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThirdwebProvider activeChain="base">
      <App />
    </ThirdwebProvider>
  </React.StrictMode>
);