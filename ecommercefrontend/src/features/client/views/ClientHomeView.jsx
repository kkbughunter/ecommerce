import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { clearAuthSession } from "../../../core/auth/session";
import ProductCard from "../components/ProductCard";
import useClientCategories from "../hooks/useClientCategories";
import useCart from "../hooks/useCart";
import useClientProducts from "../hooks/useClientProducts";

const trustPoints = [
  {
    title: "Fast Delivery",
    subtitle: "Express shipping across major cities",
  },
  {
    title: "Secure Payment",
    subtitle: "Card, UPI and wallet friendly checkout",
  },
  {
    title: "Easy Returns",
    subtitle: "Simple returns within 7 days",
  },
];

const SectionTitle = ({ eyebrow, title, action }) => (
  <div className="mb-5 flex items-end justify-between gap-3">
    <div>
      {eyebrow && (
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#7c3aed]">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-1 text-[26px] font-semibold text-[#0f172a]">{title}</h2>
    </div>
    {action}
  </div>
);

const ClientHomeView = () => {
  const navigate = useNavigate();
  const {
    filters,
    products,
    pageMeta,
    isLoading,
    error,
    updateSearch,
    goToPage,
    refresh,
  } = useClientProducts();
  const {
    categories,
    isLoading: isCategoriesLoading,
    refreshCategories,
  } = useClientCategories();
  const {
    cartCount,
    isMutatingCart,
    error: cartError,
    success: cartSuccess,
    addToCart,
  } = useCart();

  const flashProducts = useMemo(
    () => products.filter((product) => product?.productTag === "FLASH_SALES"),
    [products],
  );
  const trendingProducts = useMemo(
    () => products.filter((product) => product?.productTag === "TRENDING_PRODUCTS"),
    [products],
  );
  const categoryTiles = useMemo(() => categories.slice(0, 8), [categories]);

  const handleLogout = () => {
    clearAuthSession();
    navigate("/login", { replace: true });
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,#eef2ff_0%,#f8fafc_45%,#f6f8fc_100%)] text-[#0f172a]">
      <header className="sticky top-0 z-20 border-b border-[#e8ebfb] bg-white/85 backdrop-blur">
        <div className="flex w-full flex-wrap items-center justify-between gap-3 px-2 py-4 md:px-3">
          <div className="flex items-center gap-8">
            <h1 className="text-[24px] font-bold tracking-tight text-[#111827]">Villpo Store</h1>
            <nav className="hidden items-center gap-5 text-[14px] text-[#475569] md:flex">
              <a href="#discover" className="transition hover:text-[#2563eb]">Discover</a>
              <a href="#categories" className="transition hover:text-[#2563eb]">Categories</a>
              <a href="#flash" className="transition hover:text-[#2563eb]">Flash</a>
              <a href="#trending" className="transition hover:text-[#2563eb]">Trending</a>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={filters.q}
              onChange={(event) => updateSearch(event.target.value)}
              placeholder="Search products..."
              className="h-10 w-56 rounded-xl border border-[#d7dcf3] bg-[#f8faff] px-3 text-[13px] outline-none focus:border-[#7c3aed]"
            />
            <button
              type="button"
              onClick={refresh}
              className="h-10 rounded-xl bg-[linear-gradient(90deg,#2563eb,#7c3aed)] px-4 text-[12px] font-semibold text-white"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => navigate("/client/account")}
              className="h-10 rounded-xl border border-[#d7dcf3] bg-white px-4 text-[12px] font-semibold text-[#334155]"
            >
              My Account
            </button>
            <button
              type="button"
              onClick={() => navigate("/client/cart")}
              className="h-10 rounded-xl border border-[#d7dcf3] bg-white px-4 text-[12px] font-semibold text-[#334155]"
            >
              Cart ({cartCount})
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="h-10 rounded-xl border border-[#e2e8f0] bg-white px-4 text-[12px] font-semibold text-[#334155]"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <section id="discover" className="mt-6 w-full px-2 md:px-3">
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <article className="rounded-3xl bg-[linear-gradient(135deg,#0f172a,#312e81_45%,#1d4ed8)] p-8 text-white shadow-[0_25px_60px_rgba(30,41,59,0.35)]">
            <p className="text-[12px] uppercase tracking-[0.12em] text-[#93c5fd]">Limited offer</p>
            <h2 className="mt-2 max-w-lg text-[42px] font-semibold leading-[1.1]">
              Modern tech, better prices, faster delivery.
            </h2>
            <p className="mt-3 max-w-lg text-[14px] text-[#dbeafe]">
              Live product catalog powered by your backend APIs. Product images will be plugged in next.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                className="rounded-xl bg-white px-4 py-2 text-[13px] font-semibold text-[#1e40af]"
              >
                Start Shopping
              </button>
              <button
                type="button"
                className="rounded-xl border border-white/35 bg-white/10 px-4 py-2 text-[13px] font-semibold text-white backdrop-blur"
              >
                View Deals
              </button>
            </div>
          </article>

          <article className="rounded-3xl border border-[#e7ebff] bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.07)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#7c3aed]">Featured drop</p>
            <h3 className="mt-2 text-[24px] font-semibold text-[#0f172a]">Weekly Picks</h3>
            <p className="mt-2 text-[13px] text-[#64748b]">
              Hand-picked products refreshed from active inventory.
            </p>
            <p className="mt-5 text-[30px] font-semibold text-[#0f172a]">{pageMeta.totalElements}</p>
            <p className="text-[12px] text-[#64748b]">
              {isLoading ? "Updating catalog..." : "Active products available"}
            </p>
            <button
              type="button"
              onClick={refresh}
              className="mt-6 rounded-xl bg-[linear-gradient(90deg,#2563eb,#7c3aed)] px-4 py-2 text-[12px] font-semibold text-white"
            >
              Refresh Catalog
            </button>
          </article>
        </div>
      </section>

      <section id="categories" className="mt-10 w-full px-2 md:px-3">
        <SectionTitle
          eyebrow="Categories"
          title="Browse By Category"
          action={
            <button
              type="button"
              onClick={refreshCategories}
              className="h-9 rounded-xl border border-[#d8deef] bg-white px-3 text-[12px] font-semibold text-[#334155]"
            >
              {isCategoriesLoading ? "Loading..." : "Refresh"}
            </button>
          }
        />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-8">
          {categoryTiles.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => updateSearch(category)}
              className="rounded-2xl border border-[#dde2f8] bg-white px-3 py-4 text-center text-[12px] font-semibold text-[#334155] transition hover:border-[#7c3aed] hover:text-[#7c3aed]"
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      <section id="flash" className="mt-12 w-full px-2 md:px-3">
        <SectionTitle
          eyebrow="Today"
          title="Flash Sales"
          action={<p className="text-[13px] text-[#64748b]">{isLoading ? "Loading..." : `${pageMeta.totalElements} items`}</p>}
        />
        {error && <p className="mb-4 text-sm text-[#dc2626]">{error}</p>}
        {cartError && <p className="mb-4 text-sm text-[#dc2626]">{cartError}</p>}
        {cartSuccess && <p className="mb-4 text-sm text-[#059669]">{cartSuccess}</p>}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {flashProducts.map((product) => (
            <ProductCard
              key={`${product.productId}-flash`}
              product={product}
              onAddToCart={addToCart}
              isAddingToCart={isMutatingCart}
            />
          ))}
        </div>
        {!flashProducts.length && !isLoading && (
          <p className="mt-4 text-sm text-[#64748b]">No products tagged for Flash Sales yet.</p>
        )}
      </section>

      <section className="mt-14 w-full px-2 md:px-3">
        <article className="rounded-3xl bg-[linear-gradient(120deg,#0b1120,#1e293b,#1d4ed8)] p-8 text-white shadow-[0_20px_45px_rgba(15,23,42,0.35)]">
          <p className="text-[11px] uppercase tracking-[0.1em] text-[#93c5fd]">Category highlight</p>
          <h2 className="mt-2 text-[34px] font-semibold leading-[1.12]">Enhance your music experience</h2>
          <p className="mt-2 max-w-lg text-[13px] text-[#dbeafe]">
            Premium audio picks and accessories curated for immersive sound.
          </p>
          <button
            type="button"
            className="mt-5 rounded-xl bg-[#22c55e] px-4 py-2 text-[13px] font-semibold text-[#052e16]"
          >
            Explore Audio
          </button>
        </article>
      </section>

      <section id="trending" className="mt-14 w-full px-2 md:px-3">
        <SectionTitle
          eyebrow="Discover"
          title="Trending Products"
          action={
            <div className="flex gap-2">
              <button
                type="button"
                disabled={pageMeta.first}
                onClick={() => goToPage(Math.max(pageMeta.page - 1, 0))}
                className="h-9 rounded-xl border border-[#d8deef] bg-white px-3 text-[12px] font-semibold text-[#334155] disabled:opacity-40"
              >
                Prev
              </button>
              <button
                type="button"
                disabled={pageMeta.last}
                onClick={() => goToPage(pageMeta.page + 1)}
                className="h-9 rounded-xl border border-[#d8deef] bg-white px-3 text-[12px] font-semibold text-[#334155] disabled:opacity-40"
              >
                Next
              </button>
            </div>
          }
        />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {trendingProducts.map((product) => (
            <ProductCard
              key={`${product.productId}-trend`}
              product={product}
              onAddToCart={addToCart}
              isAddingToCart={isMutatingCart}
            />
          ))}
        </div>
        {!trendingProducts.length && !isLoading && (
          <p className="mt-4 text-sm text-[#64748b]">No products tagged for Trending Products yet.</p>
        )}
      </section>

      <section className="mt-16 w-full px-2 md:px-3">
        <div className="grid gap-4 md:grid-cols-3">
          {trustPoints.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-[#e4e8f7] bg-white p-5 text-center shadow-[0_8px_24px_rgba(15,23,42,0.06)]"
            >
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#2563eb,#7c3aed)] text-[12px] font-bold text-white">
                OK
              </div>
              <h3 className="text-[14px] font-semibold text-[#0f172a]">{item.title}</h3>
              <p className="mt-1 text-[12px] text-[#64748b]">{item.subtitle}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="mt-16 bg-[#0b1020] text-white">
        <div className="grid w-full gap-8 px-2 py-12 md:grid-cols-4 md:px-3">
          <div>
            <h4 className="text-[22px] font-semibold">Villpo Store</h4>
            <p className="mt-3 text-[13px] text-[#aab2d5]">Smart products. Better prices. Modern shopping experience.</p>
          </div>
          <div>
            <h4 className="text-[14px] font-semibold uppercase tracking-[0.08em] text-[#dbe4ff]">Contact</h4>
            <p className="mt-3 text-[13px] text-[#aab2d5]">support@Villpo Store.com</p>
            <p className="mt-1 text-[13px] text-[#aab2d5]">+91 98765 43210</p>
          </div>
          <div>
            <h4 className="text-[14px] font-semibold uppercase tracking-[0.08em] text-[#dbe4ff]">Quick Links</h4>
            <p className="mt-3 text-[13px] text-[#aab2d5]">My Account</p>
            <p className="mt-1 text-[13px] text-[#aab2d5]">Cart</p>
            <p className="mt-1 text-[13px] text-[#aab2d5]">Wishlist</p>
          </div>
          <div>
            <h4 className="text-[14px] font-semibold uppercase tracking-[0.08em] text-[#dbe4ff]">Policies</h4>
            <p className="mt-3 text-[13px] text-[#aab2d5]">Privacy Policy</p>
            <p className="mt-1 text-[13px] text-[#aab2d5]">Terms of Use</p>
            <p className="mt-1 text-[13px] text-[#aab2d5]">Returns</p>
          </div>
        </div>
        <p className="border-t border-[#1f2a4f] py-4 text-center text-[12px] text-[#7f8ab4]">
          (c) {new Date().getFullYear()} Villpo Store. All rights reserved.
        </p>
      </footer>
    </main>
  );
};

export default ClientHomeView;
