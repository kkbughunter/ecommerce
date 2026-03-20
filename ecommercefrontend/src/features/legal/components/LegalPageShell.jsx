import { useNavigate } from "react-router-dom";

const SvgIcon = ({ path, className = "h-5 w-5 fill-current" }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
    <path d={path} />
  </svg>
);

const LEGAL_NAV = [
  { label: "Privacy Policy", path: "/legal/privacy" },
  { label: "Terms of Use", path: "/legal/terms" },
  { label: "Returns & Refunds", path: "/legal/returns" },
];

const LegalPageShell = ({ title, lastUpdated, children }) => {
  const navigate = useNavigate();
  const currentPath = window.location.pathname;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-md">
        <div className="flex h-14 items-center justify-between px-4 md:px-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            <SvgIcon
              path="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"
              className="h-4 w-4 fill-current"
            />
            Back
          </button>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="text-lg font-extrabold tracking-tight text-slate-900"
          >
            Villpo Store
          </button>
          <button
            type="button"
            onClick={() => navigate("/client")}
            className="hidden items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 sm:flex"
          >
            Shop Now
          </button>
          <div className="w-20 sm:hidden" />
        </div>
      </header>

      {/* Sub-nav for legal pages */}
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl gap-1 overflow-x-auto px-4 py-2 md:px-6">
          {LEGAL_NAV.map((item) => (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                currentPath === item.path
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-4 py-10 md:px-6">
        <header className="mb-8 border-b border-slate-200 pb-6">
          <h1 className="text-3xl font-extrabold text-slate-900 md:text-4xl">{title}</h1>
          {lastUpdated && (
            <p className="mt-2 text-sm text-slate-400">Last updated: {lastUpdated}</p>
          )}
        </header>
        <div className="prose-slate space-y-8 text-slate-700">{children}</div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-5 text-center text-xs text-slate-400 md:px-6">
          &copy; {new Date().getFullYear()} Villpo Store. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default LegalPageShell;
