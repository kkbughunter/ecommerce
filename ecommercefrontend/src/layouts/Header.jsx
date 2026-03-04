import { getAuthMeta } from "../core/auth/session";

const Header = ({ title, subtitle, onLogout }) => {
  const authMeta = getAuthMeta();

  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-700">
          {authMeta.roles?.join(", ") || "Portal"}
        </p>
        <h1 className="text-3xl font-serif text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-xs text-slate-500">Logged in as</p>
          <p className="text-sm font-medium text-slate-700">{authMeta.email || "-"}</p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="h-10 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;
