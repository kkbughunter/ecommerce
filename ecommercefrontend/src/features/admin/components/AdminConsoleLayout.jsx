import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearAuthSession, getAuthMeta } from "../../../core/auth/session";
import AppFooter from "../../../layouts/AppFooter";

const navItems = [
  {
    key: "dashboard",
    label: "Dashboard",
    path: "/admin",
    icon: "M3 13h8V3H3v10zm10 8h8V3h-8v18zm-10 0h8v-6H3v6z",
  },
  {
    key: "orders",
    label: "Orders",
    path: "/admin/orders",
    icon: "M4 4h16v3H4V4zm0 6h16v10H4V10zm3 3v2h10v-2H7z",
  },
  {
    key: "payments",
    label: "Payments",
    path: "/admin/payments",
    icon: "M3 6h18v12H3V6zm2 3v6h14V9H5zm2 1h5v1H7v-1z",
  },
  {
    key: "invoices",
    label: "Invoices",
    path: "/admin/invoices",
    icon: "M6 2h12v20l-3-2-3 2-3-2-3 2V2zm2 4v2h8V6H8zm0 4v2h8v-2H8z",
  },
  {
    key: "products",
    label: "Products",
    path: "/admin/products",
    icon: "M11 2v9H2v2h9v9h2v-9h9v-2h-9V2h-2z",
  },
];

const Icon = ({ path }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
    <path d={path} />
  </svg>
);

const AdminConsoleLayout = ({
  activeNav = "dashboard",
  title,
  subtitle,
  searchValue = "",
  onSearchChange = null,
  searchPlaceholder = "Search...",
  topActions = null,
  children,
}) => {
  const navigate = useNavigate();
  const authMeta = getAuthMeta();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const activeItem = useMemo(
    () => navItems.find((item) => item.key === activeNav) || navItems[0],
    [activeNav],
  );

  useEffect(() => {
    try {
      const saved = localStorage.getItem("admin_sidebar_collapsed");
      if (saved === "1") {
        setIsSidebarCollapsed(true);
      }
    } catch {
      // ignore localStorage issues
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("admin_sidebar_collapsed", isSidebarCollapsed ? "1" : "0");
    } catch {
      // ignore localStorage issues
    }
  }, [isSidebarCollapsed]);

  const handleLogout = () => {
    clearAuthSession();
    navigate("/login", { replace: true });
  };

  return (
    <main className="min-h-screen bg-[#dfe3ea] font-['Poppins','Segoe_UI',sans-serif] text-[#0f172a]">
      <div className="w-full">
        <div className="overflow-hidden border border-[#d5d9df] bg-[#f6f7f9] shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
          <div className={`grid min-h-[calc(100vh-142px)] ${isSidebarCollapsed ? "lg:grid-cols-[78px_1fr]" : "lg:grid-cols-[238px_1fr]"}`}>
            <aside className={`border-b border-[#e3e6ec] bg-[#f3f4f7] p-4 lg:border-b-0 lg:border-r ${isSidebarCollapsed ? "lg:px-2" : ""}`}>
              <div className={`mb-6 flex items-center ${isSidebarCollapsed ? "justify-center" : "gap-2"}`}>
                <div className="h-8 w-8 rounded-lg bg-[linear-gradient(140deg,#0f172a,#334155)]" />
                {!isSidebarCollapsed ? (
                  <div>
                    <p className="text-base font-semibold text-[#0f172a]">eComma</p>
                    <p className="text-[11px] text-[#667085]">Admin Console</p>
                  </div>
                ) : null}
              </div>

              <nav className="space-y-1.5">
                {navItems.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => navigate(item.path)}
                    title={item.label}
                    className={`flex w-full items-center ${isSidebarCollapsed ? "justify-center" : "justify-between"} rounded-xl px-3 py-2 text-left text-sm transition ${
                      activeItem.key === item.key
                        ? "bg-white text-[#111827] shadow-[0_8px_22px_rgba(15,23,42,0.09)]"
                        : "text-[#4b5563] hover:bg-white/75"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon path={item.icon} />
                      {!isSidebarCollapsed ? item.label : null}
                    </span>
                    {!isSidebarCollapsed ? <span className="text-xs text-[#9ca3af]">+</span> : null}
                  </button>
                ))}
              </nav>

              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setIsSidebarCollapsed((prev) => !prev)}
                  title={isSidebarCollapsed ? "Expand menu" : "Collapse menu"}
                  className="h-9 w-full rounded-lg border border-[#d5dae3] bg-white text-xs font-semibold text-[#475569] hover:bg-[#f8fafc]"
                >
                  {isSidebarCollapsed ? ">>" : "<< Minimize"}
                </button>
              </div>

              <div className="mt-3 rounded-xl border border-[#e3e6ec] bg-white p-3">
                {!isSidebarCollapsed ? (
                  <>
                    <p className="text-[11px] uppercase tracking-[0.09em] text-[#94a3b8]">Signed In</p>
                    <p className="mt-1 truncate text-sm font-medium text-[#1f2937]" title={authMeta?.email || "-"}>
                      {authMeta?.email || "-"}
                    </p>
                  </>
                ) : (
                  <p className="truncate text-center text-xs font-medium text-[#1f2937]" title={authMeta?.email || "-"}>
                    {authMeta?.email?.slice(0, 2)?.toUpperCase() || "AD"}
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-3 h-9 w-full rounded-lg border border-[#e5e7eb] bg-[#f8fafc] text-xs font-semibold text-[#475569] hover:bg-white"
                >
                  {isSidebarCollapsed ? "Out" : "Logout"}
                </button>
              </div>
            </aside>

            <section className="flex min-h-0 flex-col">
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e3e6ec] bg-[#f9fafb] px-4 py-3">
                <div className="min-w-[180px]">
                  <h1 className="text-[22px] font-semibold tracking-tight text-[#111827]">{title}</h1>
                  {subtitle ? <p className="text-[12px] text-[#6b7280]">{subtitle}</p> : null}
                </div>

                <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
                  {onSearchChange ? (
                    <div className="min-w-[220px] flex-1 max-w-[420px]">
                      <input
                        type="text"
                        value={searchValue}
                        onChange={(event) => onSearchChange(event.target.value)}
                        placeholder={searchPlaceholder}
                        className="h-10 w-full rounded-xl border border-[#e5e7eb] bg-white px-3 text-sm text-[#334155] outline-none focus:border-[#94a3b8]"
                      />
                    </div>
                  ) : null}
                  {topActions}
                </div>
              </header>

              <div className="min-h-0 flex-1 overflow-auto bg-[#f4f6f8] px-4 py-4">{children}</div>
            </section>
          </div>
        </div>
      </div>
      <AppFooter />
    </main>
  );
};

export default AdminConsoleLayout;
