import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  clearAuthSession,
  getHomePathByRole,
  hasAnyRole,
  isAuthenticated,
} from "../../../core/auth/session";
import StoreIcon from "./StoreIcon";

export default function ClientTopNav({
  showSearch = false,
  searchValue = "",
  onSearchChange,
  onSearchSubmit,
  cartCount = null,
  showLogout = false,
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const authenticated = isAuthenticated();
  const customer = authenticated && hasAnyRole(["USER"]);
  const home = customer ? "/client" : "/";
  const account = authenticated
    ? getHomePathByRole() === "/client"
      ? "/client/account"
      : getHomePathByRole()
    : "/login";
  const count = Number(cartCount) || 0;
  const submit = (event) => {
    event.preventDefault();
    if (showSearch) onSearchSubmit?.();
    else navigate(`${home}?q=${encodeURIComponent(query)}#products`);
  };
  const links = [
    { to: home, label: "Shop", icon: "grid", end: true },
    {
      to: customer ? "/client/orders" : "/login",
      label: "Orders",
      icon: "box",
    },
    {
      to: customer ? "/client/cart" : "/login",
      label: "Cart",
      icon: "cart",
      cart: true,
    },
    { to: account, label: authenticated ? "Account" : "Sign in", icon: "user" },
  ];
  return (
    <>
      <a className="store-skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="store-header">
        <div className="store-topline">
          <div className="store-container">
            <span>Small components. Endless possibilities.</span>
            <a href="mailto:admin@astraval.com">
              Need a hand? Get in touch <StoreIcon name="arrow" />
            </a>
          </div>
        </div>
        <div className="store-container store-header-main">
          <Link to={home} className="store-logo" aria-label="Villpo Store home">
            <span className="store-logo-mark">
              <StoreIcon name="chip" />
            </span>
            <span>
              villpo<span className="store-logo-dot">.</span>
              <small>THE COMPONENT STORE</small>
            </span>
          </Link>
          <form className="store-search" role="search" onSubmit={submit}>
            <StoreIcon name="search" />
            <input
              type="search"
              aria-label="Search components"
              placeholder="Search components, boards, sensors…"
              value={showSearch ? searchValue : query}
              onChange={(event) =>
                showSearch
                  ? onSearchChange?.(event.target.value)
                  : setQuery(event.target.value)
              }
            />
            <button type="submit" aria-label="Submit search">
              <StoreIcon name="arrow" />
            </button>
          </form>
          <nav
            className="store-desktop-actions"
            aria-label="Account navigation"
          >
            <Link
              to={customer ? "/client/orders" : "/login"}
              aria-label="Orders"
            >
              <StoreIcon name="box" />
              <span>Orders</span>
            </Link>
            <Link
              to={account}
              aria-label={authenticated ? "Account" : "Sign in"}
            >
              <StoreIcon name="user" />
              <span>{authenticated ? "Account" : "Sign in"}</span>
            </Link>
            <Link
              to={customer ? "/client/cart" : "/login"}
              className="store-header-cart"
              aria-label={`Cart${cartCount === null ? "" : `, ${count} items`}`}
            >
              <StoreIcon name="cart" />
              <span>Cart</span>
              {cartCount !== null && <b>{count > 99 ? "99+" : count}</b>}
            </Link>
          </nav>
          <Link
            className="store-mobile-account"
            to={account}
            aria-label={authenticated ? "Account" : "Sign in"}
          >
            <StoreIcon name="user" />
          </Link>
        </div>
        <div className="store-category-nav">
          <nav className="store-container" aria-label="Store navigation">
            <Link to={`${home}#categories`}>
              <StoreIcon name="grid" />
              All categories
            </Link>
            <Link to={`${home}#products`}>Shop components</Link>
            <Link to={`${home}#featured`}>Featured picks</Link>
            <Link to="/legal/returns">Returns & help</Link>
            {showLogout && authenticated && (
              <button
                type="button"
                onClick={() => {
                  clearAuthSession();
                  navigate("/login", { replace: true });
                }}
              >
                <StoreIcon name="logout" />
                Sign out
              </button>
            )}
            <span className="store-nav-note">
              For the things you’re building.
            </span>
          </nav>
        </div>
      </header>
      <nav className="store-mobile-nav" aria-label="Mobile navigation">
        {links.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              isActive &&
              (customer || item.label === "Shop" || item.label === "Sign in")
                ? "is-active"
                : ""
            }
          >
            <span>
              <StoreIcon name={item.icon} />
              {item.cart && count > 0 && <b>{count > 99 ? "99+" : count}</b>}
            </span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
