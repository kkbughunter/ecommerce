import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getHomePathByRole, isAuthenticated } from "../../../core/auth/session";
import homeSliderApi from "../../../core/api/homeSliderApi";
import ENV from "../../../core/config/env";
import getApiErrorMessage from "../../../core/utils/apiError";
import ClientTopNav from "../components/ClientTopNav";
import ProductCard from "../components/ProductCard";
import useClientCategories from "../hooks/useClientCategories";
import useCart from "../hooks/useCart";
import useClientProducts from "../hooks/useClientProducts";

const LIMITED_OFFER_FALLBACK = {
  title: "Modern tech, better prices, faster delivery.",
  subtitle: "Limited offer",
  description: "Live product catalog powered by your backend APIs.",
  ctaLabel: "Start Shopping",
  targetUrl: "/client",
  imageUrl: "",
};

const CATEGORY_HIGHLIGHT_FALLBACK = {
  title: "Enhance your music experience",
  subtitle: "Category highlight",
  description: "Premium audio picks and accessories curated for immersive sound.",
  ctaLabel: "Explore Audio",
  targetUrl: "/client",
  imageUrl: "",
};

const SvgIcon = ({ path, className = "h-5 w-5 fill-current" }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
    <path d={path} />
  </svg>
);

const SectionTitle = ({ eyebrow, title, action }) => (
  <div className="mb-6 flex items-center justify-between gap-3">
    <div>
      {eyebrow && (
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-violet-500">
          {eyebrow}
        </p>
      )}
      <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
    </div>
    {action}
  </div>
);

const useAutoSlider = (slides, intervalMs = 6000) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return undefined;
    const timerId = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, intervalMs);
    return () => window.clearInterval(timerId);
  }, [slides.length, intervalMs]);

  return {
    active: slides[index] || null,
    index,
    count: slides.length,
    hasMultiple: slides.length > 1,
    goTo: (i) => setIndex(i),
    next: () => {
      if (slides.length <= 1) return;
      setIndex((prev) => (prev + 1) % slides.length);
    },
    prev: () => {
      if (slides.length <= 1) return;
      setIndex((prev) => (prev - 1 + slides.length) % slides.length);
    },
  };
};

const getCategoryImageUrl = (apiBase, category) => {
  if (!apiBase || !category?.categoryImageProductId || !category?.categoryImageUploadId) return null;
  return `${apiBase}/products/${category.categoryImageProductId}/images/${category.categoryImageUploadId}/file`;
};

const withBannerBackground = (imageUrl, fallbackBackground) => {
  if (!imageUrl) return { background: fallbackBackground };
  return {
    backgroundImage: `linear-gradient(135deg, rgba(15,23,42,0.82), rgba(49,46,129,0.68), rgba(29,78,216,0.65)), url(${imageUrl})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
};

const CATEGORY_COLORS = [
  "from-blue-50 to-indigo-100 text-indigo-700 border-indigo-200",
  "from-blue-50 to-indigo-100 text-indigo-700 border-indigo-200",
  "from-blue-50 to-indigo-100 text-indigo-700 border-indigo-200",
  "from-blue-50 to-indigo-100 text-indigo-700 border-indigo-200",
  "from-blue-50 to-indigo-100 text-indigo-700 border-indigo-200",
  "from-blue-50 to-indigo-100 text-indigo-700 border-indigo-200",
  "from-blue-50 to-indigo-100 text-indigo-700 border-indigo-200",
  "from-blue-50 to-indigo-100 text-indigo-700 border-indigo-200",
  "from-blue-50 to-indigo-100 text-indigo-700 border-indigo-200",
  "from-blue-50 to-indigo-100 text-indigo-700 border-indigo-200",
];

const ClientHomeView = ({ publicMode = false }) => {
  const navigate = useNavigate();
  const authenticated = isAuthenticated();
  const roleHomePath = getHomePathByRole();
  const apiBase = ENV.API_BASE_URL?.replace(/\/+$/, "") || "";

  const { filters, products, pageMeta, isLoading, error, updateSearch, goToPage, refresh } =
    useClientProducts();
  const { categories, isLoading: isCategoriesLoading, refreshCategories } = useClientCategories();
  const { cartCount, isMutatingCart, error: cartError, success: cartSuccess, addToCart } = useCart({
    enabled: !publicMode,
  });

  const [homeSliders, setHomeSliders] = useState([]);
  const [sliderError, setSliderError] = useState("");

  const loadHomeSliders = useCallback(async () => {
    setSliderError("");
    try {
      const response = await homeSliderApi.getActiveSliders();
      const data = Array.isArray(response?.data?.data) ? response.data.data : [];
      setHomeSliders(data);
    } catch (err) {
      setHomeSliders([]);
      setSliderError(getApiErrorMessage(err, "Unable to load homepage sliders."));
    }
  }, []);

  useEffect(() => {
    loadHomeSliders();
  }, [loadHomeSliders]);

  const openSliderTarget = useCallback(
    (targetUrl) => {
      const normalized = String(targetUrl || "").trim();
      if (!normalized) return;
      if (/^https?:\/\//i.test(normalized)) {
        window.location.href = normalized;
        return;
      }
      navigate(normalized);
    },
    [navigate],
  );

  const flashProducts = useMemo(
    () => products.filter((p) => p?.productTag === "FLASH_SALES"),
    [products],
  );
  const trendingProducts = useMemo(
    () => products.filter((p) => p?.productTag === "TRENDING_PRODUCTS"),
    [products],
  );
  const categoryTiles = useMemo(() => categories.slice(0, 8), [categories]);

  const limitedOfferSlides = useMemo(
    () => homeSliders.filter((s) => s?.placementTag === "LIMITED_OFFER"),
    [homeSliders],
  );
  const categoryHighlightSlides = useMemo(
    () => homeSliders.filter((s) => s?.placementTag === "CATEGORY_HIGHLIGHT"),
    [homeSliders],
  );

  const limitedOfferSlider = useAutoSlider(limitedOfferSlides);
  const categoryHighlightSlider = useAutoSlider(categoryHighlightSlides);

  const limitedOffer = limitedOfferSlider.active || LIMITED_OFFER_FALLBACK;
  const categoryHighlight = categoryHighlightSlider.active || CATEGORY_HIGHLIGHT_FALLBACK;

  const handleAddToCart = useCallback(
    (productId) => {
      if (publicMode && !authenticated) {
        navigate("/login");
        return;
      }
      addToCart(productId);
    },
    [addToCart, authenticated, navigate, publicMode],
  );

  const resolvePrimaryEntryPath = () => {
    if (authenticated && roleHomePath !== "/login") return roleHomePath;
    return "/login";
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <ClientTopNav
        title="Villpo Store"
        eyebrow={publicMode ? "Public Home" : ""}
        quickLinks={[
          { label: "Discover", href: "#discover" },
          { label: "Categories", href: "#categories" },
          { label: "Flash Sales", href: "#flash" },
          { label: "Trending", href: "#trending" },
        ]}
        showSearch
        showNavActions={!publicMode}
        searchValue={filters.q}
        onSearchChange={updateSearch}
        onSearchSubmit={refresh}
        cartCount={cartCount}
        rightActions={
          publicMode ? (
            <div className="flex gap-2">
              {authenticated && roleHomePath !== "/login" ? (
                <button
                  type="button"
                  onClick={() => navigate(roleHomePath)}
                  className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  Dashboard
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => navigate(resolvePrimaryEntryPath())}
                className="h-9 rounded-xl bg-blue-600 px-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                {authenticated ? "Go to App" : "Login"}
              </button>
            </div>
          ) : null
        }
      />

      {/* ── HERO SECTION ── */}
      <section id="discover" className="px-4 pt-6 pb-0 md:px-6">
        {sliderError && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
            {sliderError}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          {/* Main banner */}
          <article
            className="relative min-h-[280px] overflow-hidden rounded-3xl shadow-xl md:min-h-[360px]"
            style={withBannerBackground(
              limitedOffer.imageUrl,
              "linear-gradient(135deg, #0f172a 0%, #1e1b4b 45%, #1d4ed8 100%)",
            )}
          >
            <div className="relative z-10 flex h-full flex-col justify-end p-6 md:p-10">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-300">
                {limitedOffer.subtitle || "Limited offer"}
              </p>
              <h2 className="mt-2 max-w-lg text-3xl font-bold leading-tight text-white md:text-4xl">
                {limitedOffer.title}
              </h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-blue-100">
                {limitedOffer.description || "Discover the latest picks from our catalog."}
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => openSliderTarget(limitedOffer.targetUrl)}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-blue-700 shadow-lg transition hover:bg-blue-50"
                >
                  {limitedOffer.ctaLabel || "Start Shopping"}
                  <SvgIcon path="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" className="h-4 w-4 fill-current" />
                </button>
              </div>
            </div>

            {/* Slider nav arrows */}
            {limitedOfferSlider.hasMultiple && (
              <>
                <button
                  type="button"
                  onClick={limitedOfferSlider.prev}
                  className="absolute left-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition hover:bg-black/60"
                  aria-label="Previous slide"
                >
                  <SvgIcon path="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" className="h-5 w-5 fill-current" />
                </button>
                <button
                  type="button"
                  onClick={limitedOfferSlider.next}
                  className="absolute right-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition hover:bg-black/60"
                  aria-label="Next slide"
                >
                  <SvgIcon path="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" className="h-5 w-5 fill-current" />
                </button>
                <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-1.5">
                  {Array.from({ length: limitedOfferSlider.count }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => limitedOfferSlider.goTo(i)}
                      className={`h-1.5 rounded-full transition-all ${
                        i === limitedOfferSlider.index ? "w-6 bg-white" : "w-1.5 bg-white/40"
                      }`}
                      aria-label={`Go to slide ${i + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </article>

          {/* Stats / promo card */}
          <article className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <span className="inline-block rounded-full bg-violet-100 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-violet-600">
                Featured Collection
              </span>
              <h3 className="mt-4 text-2xl font-bold text-slate-900">Shop Now</h3>
              <p className="mt-2 text-sm text-slate-500">
                Fresh products added regularly. Find what you love.
              </p>
            </div>
            <div className="mt-6">
              <p className="text-5xl font-extrabold text-slate-900">
                {isLoading ? "—" : pageMeta.totalElements}
              </p>
              <p className="mt-1 text-sm font-medium text-slate-500">
                {isLoading ? "Loading catalog..." : "Products available"}
              </p>
              <a
                href="#flash"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700"
              >
                Browse All Products
                <SvgIcon path="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" className="h-4 w-4 fill-current" />
              </a>
            </div>
          </article>
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <section id="categories" className="mt-12 px-4 md:px-6">
        <SectionTitle
          eyebrow="Browse"
          title="Shop by Category"
          action={
            isCategoriesLoading ? (
              <p className="text-sm text-slate-400">Loading...</p>
            ) : null
          }
        />

        {/* Mobile: horizontal scroll | Desktop: grid */}
        <div className="flex gap-3 overflow-x-auto pb-3 md:grid md:grid-cols-4 md:overflow-visible md:pb-0 lg:grid-cols-8">
          {categoryTiles.map((category, idx) => {
            const colorClass = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
            const imageUrl = getCategoryImageUrl(apiBase, category);
            return (
              <button
                key={`${category?.categoryId || "cat"}-${category?.categoryName || "unknown"}`}
                type="button"
                onClick={() => updateSearch(category?.categoryName || "")}
                className={`flex w-28 shrink-0 flex-col items-center rounded-2xl border bg-gradient-to-b p-3 text-center transition hover:scale-105 hover:shadow-md md:w-auto ${colorClass}`}
              >
                {imageUrl ? (
                  <div
                    className="mb-2.5 h-14 w-14 rounded-xl border border-white/60 bg-cover bg-center shadow-sm"
                    style={{ backgroundImage: `url(${imageUrl})` }}
                  />
                ) : (
                  <div className="mb-2.5 flex h-14 w-14 items-center justify-center rounded-xl bg-white/60 text-xl font-bold shadow-sm">
                    {(category?.categoryName || "C").charAt(0).toUpperCase()}
                  </div>
                )}
                <p className="line-clamp-2 text-[11px] font-semibold leading-tight">
                  {category?.categoryName || "Category"}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── FLASH SALES ── */}
      <section id="flash" className="mt-14 px-4 md:px-6">
        <SectionTitle
          eyebrow="Today Only"
          title="Flash Sales"
          action={
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-600">
              {isLoading ? "Loading..." : `${flashProducts.length} deals`}
            </span>
          }
        />

        {error && (
          <p className="mb-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
        )}
        {!publicMode && cartError && (
          <p className="mb-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{cartError}</p>
        )}
        {!publicMode && cartSuccess && (
          <p className="mb-4 rounded-xl bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
            {cartSuccess}
          </p>
        )}
        {publicMode && (
          <p className="mb-5 rounded-xl bg-blue-50 px-4 py-2.5 text-sm text-blue-700">
            Browse products freely.{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="font-semibold underline"
            >
              Login
            </button>{" "}
            to add items to your cart.
          </p>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl bg-white p-4">
                <div className="aspect-square rounded-xl bg-slate-100" />
                <div className="mt-3 h-3 rounded bg-slate-100" />
                <div className="mt-2 h-3 w-2/3 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        ) : flashProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {flashProducts.map((product) => (
              <ProductCard
                key={`${product.productId}-flash`}
                product={product}
                onAddToCart={handleAddToCart}
                isAddingToCart={isMutatingCart}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center">
            <p className="text-slate-400">No Flash Sale products available right now.</p>
          </div>
        )}
      </section>

      {/* ── MID-PAGE CATEGORY HIGHLIGHT BANNER ── */}
      <section className="mt-16 px-4 md:px-6">
        <article
          className="relative min-h-[220px] overflow-hidden rounded-3xl shadow-xl md:min-h-[280px]"
          style={withBannerBackground(
            categoryHighlight.imageUrl,
            "linear-gradient(120deg, #0b1120 0%, #1e293b 50%, #1d4ed8 100%)",
          )}
        >
          <div className="relative z-10 flex h-full flex-col justify-end p-6 md:p-10">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-300">
              {categoryHighlight.subtitle || "Category highlight"}
            </p>
            <h2 className="mt-2 max-w-lg text-2xl font-bold text-white md:text-3xl">
              {categoryHighlight.title}
            </h2>
            <p className="mt-2 max-w-md text-sm text-blue-100">
              {categoryHighlight.description || "Discover category-focused picks curated for your needs."}
            </p>
            <div className="mt-5">
              <button
                type="button"
                onClick={() => openSliderTarget(categoryHighlight.targetUrl)}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-5 py-2.5 text-sm font-bold text-emerald-950 transition hover:bg-emerald-300"
              >
                {categoryHighlight.ctaLabel || "Explore"}
                <SvgIcon path="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" className="h-4 w-4 fill-current" />
              </button>
            </div>
          </div>

          {categoryHighlightSlider.hasMultiple && (
            <>
              <button
                type="button"
                onClick={categoryHighlightSlider.prev}
                className="absolute left-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition hover:bg-black/60"
                aria-label="Previous"
              >
                <SvgIcon path="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" className="h-5 w-5 fill-current" />
              </button>
              <button
                type="button"
                onClick={categoryHighlightSlider.next}
                className="absolute right-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition hover:bg-black/60"
                aria-label="Next"
              >
                <SvgIcon path="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" className="h-5 w-5 fill-current" />
              </button>
              <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-1.5">
                {Array.from({ length: categoryHighlightSlider.count }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => categoryHighlightSlider.goTo(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      i === categoryHighlightSlider.index ? "w-6 bg-white" : "w-1.5 bg-white/40"
                    }`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </article>
      </section>

      {/* ── TRENDING PRODUCTS ── */}
      <section id="trending" className="mt-14 px-4 md:px-6">
        <SectionTitle
          eyebrow="Discover"
          title="Trending Products"
          action={
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pageMeta.first}
                onClick={() => goToPage(Math.max(pageMeta.page - 1, 0))}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous page"
              >
                <SvgIcon path="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" className="h-4 w-4 fill-current" />
              </button>
              <span className="text-sm font-medium text-slate-500">
                {pageMeta.page + 1} / {Math.max(pageMeta.totalPages, 1)}
              </span>
              <button
                type="button"
                disabled={pageMeta.last}
                onClick={() => goToPage(pageMeta.page + 1)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next page"
              >
                <SvgIcon path="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" className="h-4 w-4 fill-current" />
              </button>
            </div>
          }
        />

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl bg-white p-4">
                <div className="aspect-square rounded-xl bg-slate-100" />
                <div className="mt-3 h-3 rounded bg-slate-100" />
                <div className="mt-2 h-3 w-2/3 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        ) : trendingProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {trendingProducts.map((product) => (
              <ProductCard
                key={`${product.productId}-trend`}
                product={product}
                onAddToCart={handleAddToCart}
                isAddingToCart={isMutatingCart}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center">
            <p className="text-slate-400">No Trending products available right now.</p>
          </div>
        )}
      </section>

      {/* ── FOOTER ── */}
      <footer className="mt-20 bg-slate-900 text-white">
        <div className="grid gap-8 px-4 py-12 md:grid-cols-4 md:px-6">
          <div>
            <h4 className="text-xl font-extrabold tracking-tight">Villpo Store</h4>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Smart products. Better prices. Modern shopping experience.
            </p>
          </div>
          <div>
            <h5 className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Contact</h5>
            <p className="mt-3 text-sm text-slate-300">admin@astraval.com</p>
            <p className="mt-1 text-sm text-slate-300">+91 9043368684</p>
          </div>
          <div>
            <h5 className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Quick Links</h5>
            <div className="mt-3 space-y-2">
              {[
                { label: "My Account", path: "/client/account" },
                { label: "My Cart", path: "/client/cart" },
                { label: "My Orders", path: "/client/orders" },
              ].map((item) => (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className="block text-sm text-slate-300 transition hover:text-white"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h5 className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Policies</h5>
            <div className="mt-3 space-y-2">
              {[
                { label: "Privacy Policy", path: "/legal/privacy" },
                { label: "Terms of Use", path: "/legal/terms" },
                { label: "Returns & Refunds", path: "/legal/returns" },
              ].map((item) => (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className="block text-sm text-slate-300 transition hover:text-white"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-slate-800 py-4 text-center text-xs text-slate-500">
          &copy; {new Date().getFullYear()} Villpo Store. All rights reserved.
        </div>
      </footer>
    </main>
  );
};

export default ClientHomeView;
