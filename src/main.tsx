import { createRoot } from "react-dom/client";
console.log("Main.tsx is executing");

// const root = document.getElementById("root");
// if (root) {
//   root.innerHTML = "<h1>Vanilla JS Hello World</h1>";
//   console.log("Root content updated via Vanilla JS");
// } else {
//   console.error("Root element not found");
// }

import { validateEnv } from "./lib/env";
import App from "./App.tsx";
import "./index.css";

// // Validate environment variables at startup
// // validateEnv();

createRoot(document.getElementById("root")!).render(<App />);
