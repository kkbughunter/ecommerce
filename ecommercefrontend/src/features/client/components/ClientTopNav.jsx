import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { clearAuthSession } from "../../../core/auth/session";

const navActions = [
  {
    key: "home",
    label: "Home",
    path: "/client",
    icon: "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z",
  },
  {
    key: "account",
    label: "My Account",
    path: "/client/account",
    icon: "M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5z",
  },
  {
    key: "cart",
    label: "Cart",
    path: "/client/cart",
    icon: "M7 18c-1.1 0-1.99.9-1.99 2A2 2 0 0 0 7 22a2 2 0 0 0 0-4zm10 0a2 2 0 1 0 2 2 2 2 0 0 0-2-2zM7.17 14h9.9a2 2 0 0 0 1.92-1.45L21 6H6.21l-.47-2H2v2h2l2.6 10a2 2 0 0 0 1.94 1.5H19v-2H8.53a.5.5 0 0 1-.48-.36L7.17 14z",
  },
  {
    key: "orders",
    label: "My Orders",
    path: "/client/orders",
    icon: "M4 4h16v3H4V4zm0 5h16v11H4V9zm3 3v2h10v-2H7z",
  },
];

const Icon = ({ path }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
    <path d={path} />
  </svg>
);

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
    <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16a6.47 6.47 0 0 0 4.23-1.57l.27.28v.79L20 21.5 21.5 20l-6-6zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z" />
  </svg>
);

const normalizePath = (value) => (typeof value === "string" ? value.replace(/\/+$/, "") || "/" : "");

const ClientTopNav = ({
  title = "Villpo Store",
  eyebrow = "",
  quickLinks = [],
  showSearch = false,
  searchValue = "",
  onSearchChange = null,
  onSearchSubmit = null,
  searchPlaceholder = "Search products...",
  cartCount = null,
  showLogout = false,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = normalizePath(location.pathname);

  const links = Array.isArray(quickLinks) ? quickLinks : [];
  const safeCartCount = Number.isFinite(Number(cartCount)) ? Number(cartCount) : 0;

  const actionList = useMemo(
    () =>
      navActions.map((action) => ({
        ...action,
        isActive: normalizePath(action.path) === currentPath,
      })),
    [currentPath],
  );

  const handleLogout = () => {
    clearAuthSession();
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-20 border-b border-[#e8ebfb] bg-white/85 backdrop-blur">
      <div className="flex w-full flex-wrap items-center justify-between gap-3 px-2 py-4 md:px-3">
        <div className="flex items-center gap-8">
          <div>
            {eyebrow ? <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#64748b]">{eyebrow}</p> : null}
            <h1 className="text-[24px] font-bold tracking-tight text-[#111827]">{title}</h1>
          </div>
          {links.length ? (
            <nav className="hidden items-center gap-5 text-[14px] text-[#475569] md:flex">
              {links.map((item) => (
                <a key={`${item.href}-${item.label}`} href={item.href} className="transition hover:text-[#2563eb]">
                  {item.label}
                </a>
              ))}
            </nav>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {showSearch ? (
            <input
              type="text"
              value={searchValue}
              onChange={(event) => onSearchChange?.(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-10 w-56 rounded-xl border border-[#d7dcf3] bg-[#f8faff] px-3 text-[13px] outline-none focus:border-[#7c3aed]"
            />
          ) : null}
          {showSearch ? (
            <button
              type="button"
              onClick={() => onSearchSubmit?.()}
              title="Search"
              aria-label="Search"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-[linear-gradient(90deg,#2563eb,#7c3aed)] text-white"
            >
              <SearchIcon />
            </button>
          ) : null}

          {actionList.map((action) => (
            <button
              key={action.key}
              type="button"
              onClick={() => navigate(action.path)}
              title={action.key === "cart" && safeCartCount > 0 ? `Cart (${safeCartCount})` : action.label}
              aria-label={action.key === "cart" && safeCartCount > 0 ? `Cart (${safeCartCount})` : action.label}
              className={`relative flex h-10 w-10 items-center justify-center rounded-xl border text-[#334155] ${
                action.isActive
                  ? "border-[#2563eb] bg-[#eff6ff]"
                  : "border-[#d8deef] bg-white"
              }`}
            >
              <Icon path={action.icon} />
              {action.key === "cart" && safeCartCount > 0 ? (
                <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-[#2563eb] px-1 text-center text-[10px] font-semibold text-white">
                  {safeCartCount > 99 ? "99+" : safeCartCount}
                </span>
              ) : null}
            </button>
          ))}

          {showLogout ? (
            <button
              type="button"
              onClick={handleLogout}
              className="flex h-10 items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 text-[12px] font-semibold text-rose-700"
            >
              <Icon path="M10 17l1.41-1.41L8.83 13H20v-2H8.83l2.58-2.59L10 7l-5 5 5 5zm-6 3h8v-2H4V6h8V4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2z" />
              Logout
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
};

export default ClientTopNav;
