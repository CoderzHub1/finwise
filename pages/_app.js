import "@/styles/globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { TranslationProvider } from "@/context/TranslationContext";

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <TranslationProvider>
        <Component {...pageProps} />
      </TranslationProvider>
    </AuthProvider>
  );
}
