import { useEffect, useRef, useState } from "react";
import authApi from "../../../core/api/authApi";

let scriptPromise;
function loadGoogle() {
  if (window.google?.accounts?.id) return Promise.resolve(window.google);
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.onload = () => resolve(window.google);
      script.onerror = () => {
        script.remove();
        scriptPromise = undefined;
        reject(new Error("Google sign-in could not load."));
      };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

export default function GoogleLoginButton({ onCredential, disabled }) {
  const container = useRef(null);
  const callback = useRef(onCredential);
  const busy = useRef(disabled);
  const [state, setState] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => { callback.current = onCredential; busy.current = disabled; }, [onCredential, disabled]);

  useEffect(() => {
    let cancelled = false;
    // Load config after the script so StrictMode's discarded effect never overwrites the nonce cookie.
    loadGoogle().then(async (google) => {
      if (cancelled) return;
      try {
        const response = await authApi.googleConfig();
        if (cancelled) return;
        const payload = response?.data;
        if (typeof payload === "string") {
          throw new Error("Google config endpoint returned a page instead of JSON. Check VITE_BASE_URL/API base path.");
        }
        const config = payload?.data;
        if (!config) {
          throw new Error("Google config response is missing data.");
        }
        if (!config.enabled) { setState("disabled"); return; }
        google.accounts.id.initialize({
          client_id: config.clientId,
          nonce: config.nonce,
          auto_select: false,
          callback: ({ credential }) => {
            if (!cancelled && !busy.current) callback.current(credential);
          },
        });
        google.accounts.id.renderButton(container.current, {
          theme: "outline", size: "large", text: "continue_with", width: 320,
        });
        setState("ready");
      } catch (error) {
        console.error("Google sign-in setup failed", error?.response?.data || error);
        if (!cancelled) {
          setErrorMessage(error?.response?.data?.message || error?.message || "Google sign-in is unavailable.");
          setState("error");
        }
      }
    }).catch((error) => {
      console.error("Google sign-in script failed to load", error);
      if (!cancelled) {
        setErrorMessage(error?.message || "Google sign-in could not load.");
        setState("error");
      }
    });
    return () => { cancelled = true; };
  }, [attempt]);

  if (state === "disabled") return null;
  return (
    <div className="space-y-4">
      <div ref={container} className={`flex justify-center ${disabled ? "pointer-events-none opacity-50" : ""}`} aria-busy={disabled} />
      {state === "loading" && <p className="text-center text-sm text-slate-500">Loading Google sign-in…</p>}
      {state === "error" && (
        <div className="text-center space-y-2">
          <p role="status" className="text-center text-sm text-slate-500">
            {errorMessage || "Google sign-in is unavailable. Use email and password, or reload to retry."}
          </p>
          <button
            type="button"
            onClick={() => { setErrorMessage(""); setState("loading"); setAttempt((value) => value + 1); }}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Retry Google sign-in
          </button>
        </div>
      )}
      {state === "ready" && <p className="text-center text-xs text-slate-500">or continue with email</p>}
    </div>
  );
}
