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
  useEffect(() => { callback.current = onCredential; busy.current = disabled; }, [onCredential, disabled]);

  useEffect(() => {
    let cancelled = false;
    // Load config after the script so StrictMode's discarded effect never overwrites the nonce cookie.
    loadGoogle().then(async (google) => {
      if (cancelled) return;
      const response = await authApi.googleConfig();
      if (cancelled) return;
      const config = response.data.data;
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
    }).catch(() => { if (!cancelled) setState("error"); });
    return () => { cancelled = true; };
  }, []);

  if (state === "disabled") return null;
  return (
    <div className="space-y-4">
      <div ref={container} className={`flex justify-center ${disabled ? "pointer-events-none opacity-50" : ""}`} aria-busy={disabled} />
      {state === "loading" && <p className="text-center text-sm text-slate-500">Loading Google sign-in…</p>}
      {state === "error" && <p role="status" className="text-center text-sm text-slate-500">Google sign-in is unavailable. Use email and password, or reload to retry.</p>}
      {state === "ready" && <p className="text-center text-xs text-slate-500">or continue with email</p>}
    </div>
  );
}
