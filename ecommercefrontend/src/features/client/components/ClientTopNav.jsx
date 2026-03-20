import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { clearAuthSession } from "../../../core/auth/session";

const NAV_ITEMS = [
  {
    key: "home",
    label: "Home",
    path: "/client",
    icon: "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z",
  },
  {
    key: "orders",
    label: "My Orders",
    path: "/client/orders",
    icon: "M4 4h16v3H4V4zm0 5h16v11H4V9zm3 3v2h10v-2H7z",
  },
  {
    key: "account",
    label: "Account",
    path: "/client/account",
    icon: "M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5z",
  },
  {
    key: "cart",
    label: "Cart",
    path: "/client/cart",
    icon: "M7 18c-1.1 0-1.99.9-1.99 2A2 2 0 0 0 7 22a2 2 0 0 0 0-4zm10 0a2 2 0 1 0 2 2 2 2 0 0 0-2-2zM7.17 14h9.9a2 2 0 0 0 1.92-1.45L21 6H6.21l-.47-2H2v2h2l2.6 10a2 2 0 0 0 1.94 1.5H19v-2H8.53a.5.5 0 0 1-.48-.36L7.17 14z",
  },
];

const SvgIcon = ({ path, className = "h-5 w-5 fill-current" }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
    <path d={path} />
  </svg>
);

const normalizePath = (v) => (typeof v === "string" ? v.replace(/\/+$/, "") || "/" : "");

const ClientTopNav = ({
  title = "Villpo Store",
  eyebrow = "",
  quickLinks = [],
  showSearch = false,
  showNavActions = true,
  rightActions = null,
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
  const [menuOpen, setMenuOpen] = useState(false);

  const safeCartCount = Number.isFinite(Number(cartCount)) ? Number(cartCount) : 0;

  const actionList = useMemo(
    () =>
      NAV_ITEMS.map((item) => ({
        ...item,
        isActive: normalizePath(item.path) === currentPath,
      })),
    [currentPath],
  );

  const cartItem = actionList.find((a) => a.key === "cart");

  const handleLogout = () => {
    clearAuthSession();
    navigate("/login", { replace: true });
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-md">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          {/* Logo */}
          <button
            type="button"
            onClick={() => navigate("/client")}
            className="flex flex-col items-start leading-none"
          >
            {eyebrow && (
              <span className="text-[10px] font-semibold uppercase tracking-widest text-violet-500">
                {eyebrow}
              </span>
            )}
            <span className="text-xl font-extrabold tracking-tight text-slate-900">{title}</span>
          </button>

          {/* Desktop center: page section links */}
          {Array.isArray(quickLinks) && quickLinks.length > 0 && (
            <nav className="hidden items-center gap-6 md:flex">
              {quickLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-slate-500 transition hover:text-blue-600"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          )}

          {/* Right side */}
          <div className="flex items-center gap-1">
            {/* Desktop search */}
            {showSearch && (
              <div className="relative mr-1 hidden md:block">
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onSearchSubmit?.()}
                  placeholder={searchPlaceholder}
                  className="h-9 w-52 rounded-full border border-slate-200 bg-slate-50 pl-4 pr-10 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={() => onSearchSubmit?.()}
                  className="absolute right-1 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-blue-600 text-white transition hover:bg-blue-700"
                >
                  <SvgIcon
                    path="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16a6.47 6.47 0 0 0 4.23-1.57l.27.28v.79L20 21.5 21.5 20l-6-6zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z"
                    className="h-3.5 w-3.5 fill-current"
                  />
                </button>
              </div>
            )}

            {rightActions}

            {/* Desktop nav items */}
            {showNavActions && (
              <div className="hidden items-center gap-0.5 md:flex">
                {actionList.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => navigate(item.path)}
                    title={item.label}
                    className={`relative flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-medium transition ${
                      item.isActive
                        ? "bg-blue-50 text-blue-600"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <SvgIcon path={item.icon} className="h-4 w-4 fill-current" />
                    <span className="hidden lg:inline">{item.label}</span>
                    {item.key === "cart" && safeCartCount > 0 && (
                      <span className="min-w-[18px] rounded-full bg-blue-600 px-1.5 py-0.5 text-center text-[10px] font-bold leading-none text-white">
                        {safeCartCount > 99 ? "99+" : safeCartCount}
                      </span>
                    )}
                  </button>
                ))}
                {showLogout && (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-red-500 transition hover:bg-red-50"
                  >
                    <SvgIcon
                      path="M10 17l1.41-1.41L8.83 13H20v-2H8.83l2.58-2.59L10 7l-5 5 5 5zm-6 3h8v-2H4V6h8V4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2z"
                      className="h-4 w-4 fill-current"
                    />
                    <span className="hidden lg:inline">Logout</span>
                  </button>
                )}
              </div>
            )}

            {/* Mobile: cart icon + hamburger */}
            {showNavActions && (
              <>
                {cartItem && (
                  <button
                    type="button"
                    onClick={() => navigate(cartItem.path)}
                    className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 md:hidden"
                    aria-label="Cart"
                  >
                    <SvgIcon path={cartItem.icon} className="h-5 w-5 fill-current" />
                    {safeCartCount > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 min-w-[17px] rounded-full bg-blue-600 px-1 text-center text-[9px] font-bold leading-[17px] text-white">
                        {safeCartCount > 99 ? "99+" : safeCartCount}
                      </span>
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setMenuOpen(true)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 md:hidden"
                  aria-label="Open menu"
                >
                  <SvgIcon
                    path="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"
                    className="h-5 w-5 fill-current"
                  />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile search bar (second row) */}
        {showSearch && (
          <div className="border-t border-slate-100 px-4 py-2.5 md:hidden">
            <div className="relative">
              <input
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onSearchSubmit?.()}
                placeholder={searchPlaceholder}
                className="h-9 w-full rounded-full border border-slate-200 bg-slate-50 pl-4 pr-10 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <button
                type="button"
                onClick={() => onSearchSubmit?.()}
                className="absolute right-1 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-blue-600 text-white"
              >
                <SvgIcon
                  path="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16a6.47 6.47 0 0 0 4.23-1.57l.27.28v.79L20 21.5 21.5 20l-6-6zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z"
                  className="h-3.5 w-3.5 fill-current"
                />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Mobile slide-over menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeMenu}
          />
          <div className="absolute right-0 top-0 flex h-full w-72 flex-col bg-white shadow-2xl">
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 px-4">
              <span className="text-lg font-bold text-slate-900">{title}</span>
              <button
                type="button"
                onClick={closeMenu}
                className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-slate-100"
              >
                <SvgIcon
                  path="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                  className="h-5 w-5 fill-slate-600"
                />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                Navigation
              </p>
              <div className="space-y-1">
                {actionList.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      navigate(item.path);
                      closeMenu();
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${
                      item.isActive
                        ? "bg-blue-50 text-blue-600"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        item.isActive
                          ? "bg-blue-100 text-blue-600"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <SvgIcon path={item.icon} className="h-4 w-4 fill-current" />
                    </span>
                    <span className="flex-1">{item.label}</span>
                    {item.key === "cart" && safeCartCount > 0 && (
                      <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                        {safeCartCount > 99 ? "99+" : safeCartCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {Array.isArray(quickLinks) && quickLinks.length > 0 && (
                <>
                  <div className="my-4 border-t border-slate-100" />
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                    Page Sections
                  </p>
                  <div className="space-y-1">
                    {quickLinks.map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        onClick={closeMenu}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                          <SvgIcon
                            path="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"
                            className="h-4 w-4 fill-slate-500"
                          />
                        </span>
                        {link.label}
                      </a>
                    ))}
                  </div>
                </>
              )}

              <div className="my-4 border-t border-slate-100" />
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-red-500 transition hover:bg-red-50"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-400">
                  <SvgIcon
                    path="M10 17l1.41-1.41L8.83 13H20v-2H8.83l2.58-2.59L10 7l-5 5 5 5zm-6 3h8v-2H4V6h8V4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2z"
                    className="h-4 w-4 fill-current"
                  />
                </span>
                Sign Out
              </button>
            </nav>
          </div>
        </div>
      )}
    </>
  );
};

export default ClientTopNav;
