import { useLocation, useNavigate } from "react-router-dom";
import ClientTopNav from "../../client/components/ClientTopNav";
import StoreFooter from "../../client/components/StoreFooter";

const LEGAL_NAV = [
  { label: "Privacy Policy", path: "/legal/privacy" },
  { label: "Terms of Use", path: "/legal/terms" },
  { label: "Returns & Refunds", path: "/legal/returns" },
];

const LegalPageShell = ({ title, lastUpdated, children }) => {
  const navigate = useNavigate();
  const currentPath = useLocation().pathname;

  return (
    <div className="storefront">
      <ClientTopNav />

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
      <main
        id="main-content"
        tabIndex="-1"
        className="mx-auto max-w-3xl px-4 py-10 md:px-6"
      >
        <header className="mb-8 border-b border-slate-200 pb-6">
          <h1 className="text-3xl font-extrabold text-slate-900 md:text-4xl">
            {title}
          </h1>
          {lastUpdated && (
            <p className="mt-2 text-sm text-slate-400">
              Last updated: {lastUpdated}
            </p>
          )}
        </header>
        <div className="prose-slate space-y-8 text-slate-700">{children}</div>
      </main>

      <StoreFooter />
    </div>
  );
};

export default LegalPageShell;
