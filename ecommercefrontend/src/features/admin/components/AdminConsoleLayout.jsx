import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearAuthSession, getAuthMeta } from "../../../core/auth/session";
import AppFooter from "../../../layouts/AppFooter";

const NAV_GROUPS = [
  {
    key: "overview",
    label: "Overview",
    items: [
      {
        key: "dashboard",
        label: "Dashboard",
        path: "/admin",
        icon: "M3 13h8V3H3v10zm10 8h8V3h-8v18zm-10 0h8v-6H3v6z",
      },
    ],
  },
  {
    key: "catalog",
    label: "Catalog",
    items: [
      {
        key: "products",
        label: "Products",
        path: "/admin/products",
        icon: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z",
      },
      {
        key: "categories",
        label: "Categories",
        path: "/admin/categories",
        icon: "M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z",
      },
    ],
  },
  {
    key: "marketing",
    label: "Marketing",
    items: [
      {
        key: "sliders",
        label: "Sliders",
        path: "/admin/sliders",
        icon: "M3 5h18v4H3V5zm0 5h18v4H3v-4zm0 5h18v4H3v-4z",
      },
      {
        key: "mainBanners",
        label: "Main Banners",
        path: "/admin/main-banners",
        icon: "M3 5h18v14H3V5zm2 2v10h14V7H5zm2 2h5v2H7V9zm0 3h8v2H7v-2z",
      },
    ],
  },
  {
    key: "operations",
    label: "Operations",
    items: [
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
        key: "customers",
        label: "Customers",
        path: "/admin/customers",
        icon: "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zM8 11c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.96 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z",
      },
    ],
  },
];
const FLAT_NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items);
const DEFAULT_EXPANDED_GROUPS = {
  overview: true,
  catalog: true,
  marketing: false,
  operations: true,
};

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
  const [expandedGroups, setExpandedGroups] = useState(DEFAULT_EXPANDED_GROUPS);

  const activeItem = useMemo(
    () => FLAT_NAV_ITEMS.find((item) => item.key === activeNav) || FLAT_NAV_ITEMS[0],
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

  const toggleGroup = (groupKey) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
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
                    <p className="text-base font-semibold text-[#0f172a]">Villpo</p>
                    <p className="text-[11px] text-[#667085]">Admin Console</p>
                  </div>
                ) : null}
              </div>

              <nav className="space-y-3">
                {isSidebarCollapsed ? (
                  <section className="space-y-1.5">
                    {FLAT_NAV_ITEMS.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => navigate(item.path)}
                        title={item.label}
                        className={`flex w-full items-center justify-center rounded-xl px-3 py-2 text-left text-sm transition ${
                          activeItem.key === item.key
                            ? "bg-white text-[#111827] shadow-[0_8px_22px_rgba(15,23,42,0.09)]"
                            : "text-[#4b5563] hover:bg-white/75"
                        }`}
                      >
                        <Icon path={item.icon} />
                      </button>
                    ))}
                  </section>
                ) : (
                  NAV_GROUPS.map((group) => {
                    const isExpanded = Boolean(expandedGroups[group.key]);
                    return (
                      <section key={group.key} className="space-y-1.5">
                        <button
                          type="button"
                          onClick={() => toggleGroup(group.key)}
                          className="flex w-full items-center justify-between rounded-lg px-2 py-1 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-[#9ca3af] hover:bg-white/60"
                        >
                          <span>{group.label}</span>
                          <span className="text-[11px] text-[#94a3b8]">{isExpanded ? "-" : "+"}</span>
                        </button>
                        {isExpanded ? (
                          <div className="space-y-1.5">
                            {group.items.map((item) => (
                              <button
                                key={item.key}
                                type="button"
                                onClick={() => navigate(item.path)}
                                title={`${group.label}: ${item.label}`}
                                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${
                                  activeItem.key === item.key
                                    ? "bg-white text-[#111827] shadow-[0_8px_22px_rgba(15,23,42,0.09)]"
                                    : "text-[#4b5563] hover:bg-white/75"
                                }`}
                              >
                                <span className="flex items-center gap-2.5">
                                  <Icon path={item.icon} />
                                  {item.label}
                                </span>
                                <span className="text-xs text-[#9ca3af]">+</span>
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </section>
                    );
                  })
                )}
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
