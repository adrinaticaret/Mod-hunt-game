import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { CarvWalletProvider } from "./components/WalletProvider";

// Import CSS برای wallet adapter
import '@solana/wallet-adapter-react-ui/styles.css';

createRoot(document.getElementById("root")!).render(
  <CarvWalletProvider>
    <App />
  </CarvWalletProvider>
);
