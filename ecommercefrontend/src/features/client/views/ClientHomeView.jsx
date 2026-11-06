import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  getHomePathByRole,
  hasAnyRole,
  isAuthenticated,
} from "../../../core/auth/session";
import mainBannerApi from "../../../core/api/mainBannerApi";
import homeSliderApi from "../../../core/api/homeSliderApi";
import ClientTopNav from "../components/ClientTopNav";
import StoreFooter from "../components/StoreFooter";
import StoreIcon from "../components/StoreIcon";
import ProductImage from "../components/ProductImage";
import ProductCard from "../components/ProductCard";
import useClientCategories from "../hooks/useClientCategories";
import useClientProducts from "../hooks/useClientProducts";
import useCart from "../hooks/useCart";

const normalizeBanners = (payload) =>
  Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.content)
      ? payload.content
      : payload?.mainBannerId
        ? [payload]
        : [];
const scrollToProducts = () =>
  document
    .getElementById("products")
    ?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
      block: "start",
    });

export default function ClientHomeView() {
  const navigate = useNavigate();
  const location = useLocation();
  const authenticated = isAuthenticated();
  const customer = authenticated && hasAnyRole(["USER"]);
  const {
    filters,
    products,
    pageMeta,
    isLoading,
    error,
    updateSearch,
    updateCategory,
    clearFilters,
    goToPage,
    refresh,
  } = useClientProducts();
  const { categories, isLoading: loadingCategories } = useClientCategories();
  const {
    cartCount,
    isMutatingCart,
    error: cartError,
    success: cartSuccess,
    addToCart,
  } = useCart({ enabled: customer });
  const [banners, setBanners] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [showAllCollections, setShowAllCollections] = useState(false);
  const filtered = Boolean(filters.q || filters.categoryId);
  const banner = banners[bannerIndex];
  const category = categories.find(
    (item) => String(item.categoryId) === filters.categoryId,
  );

  useEffect(() => {
    let active = true;
    const load = async () => {
      const [main, sliders] = await Promise.allSettled([
        mainBannerApi.getActiveMainBanners(),
        homeSliderApi.getActiveSliders(),
      ]);
      let next =
        main.status === "fulfilled"
          ? normalizeBanners(main.value?.data?.data)
          : [];
      if (!next.length) {
        try {
          const response = await mainBannerApi.getActiveMainBanner();
          next = normalizeBanners(response?.data?.data);
        } catch {
          /* Optional campaigns don't block shopping. */
        }
      }
      if (!active) return;
      setBanners(next);
      setCampaigns(
        sliders.status === "fulfilled" &&
          Array.isArray(sliders.value?.data?.data)
          ? sliders.value.data.data
          : [],
      );
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!location.hash) return;
    const timer = window.setTimeout(
      () =>
        document
          .getElementById(location.hash.slice(1))
          ?.scrollIntoView({ block: "start" }),
      100,
    );
    return () => window.clearTimeout(timer);
  }, [location.hash]);

  const add = async (id) => {
    if (!customer) {
      navigate(authenticated ? getHomePathByRole() : "/login");
      return;
    }
    await addToCart(id);
  };
  const openCampaign = (target) => {
    const url = String(target || "").trim();
    if (/^https?:\/\//i.test(url)) {
      window.location.assign(url);
      return;
    }
    if (url.startsWith("/") && !url.startsWith("//")) {
      navigate(url);
      return;
    }
    scrollToProducts();
  };
  const selectCategory = (id) => {
    updateCategory(id == null ? "" : String(id));
    scrollToProducts();
  };

  return (
    <div className="storefront">
      <ClientTopNav
        showSearch
        searchValue={filters.q}
        onSearchChange={updateSearch}
        onSearchSubmit={scrollToProducts}
        cartCount={customer ? cartCount : null}
      />
      <main id="main-content" className="store-container" tabIndex="-1">
        {!filtered && (
          <section className="store-hero" aria-label="Welcome to Villpo">
            <div className="store-hero-copy">
              <p className="store-eyebrow">
                <span />
                {banner?.badgeText ||
                  banner?.subheadline ||
                  "FOR THE MAKERS. THE THINKERS. THE BUILDERS."}
              </p>
              <h1>
                {banner?.headline || (
                  <>
                    Your next big idea.
                    <br />
                    <em>Starts with a small part.</em>
                  </>
                )}
              </h1>
              <p className="store-hero-description">
                {banner?.description ||
                  "Boards, sensors, modules and everything in between. Bring your next project to life, one component at a time."}
              </p>
              <div className="store-hero-actions">
                <button
                  type="button"
                  className="store-button"
                  onClick={() =>
                    banner
                      ? openCampaign(banner.primaryCtaUrl)
                      : scrollToProducts()
                  }
                >
                  {banner?.primaryCtaLabel || "Explore components"}
                  <StoreIcon name="arrow" />
                </button>
                {banner?.secondaryCtaLabel && banner?.secondaryCtaUrl ? (
                  <button
                    type="button"
                    className="store-text-link"
                    onClick={() => openCampaign(banner.secondaryCtaUrl)}
                  >
                    {banner.secondaryCtaLabel}
                  </button>
                ) : (
                  <a href="#categories" className="store-text-link">
                    Browse categories
                  </a>
                )}
              </div>
              {banners.length > 1 && (
                <div className="store-slider-controls" aria-label="Promotions">
                  {banners.map((item, index) => (
                    <button
                      key={item.mainBannerId || index}
                      type="button"
                      aria-label={`Show promotion ${index + 1}`}
                      aria-pressed={index === bannerIndex}
                      onClick={() => setBannerIndex(index)}
                    >
                      <span />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div
              className={`store-hero-visual ${banner?.imageUrl ? "has-image" : ""}`}
            >
              {banner?.imageUrl ? (
                <ProductImage
                  src={banner.imageUrl}
                  alt={banner.headline || "Featured collection"}
                  loading="eager"
                />
              ) : (
                <div className="store-circuit" aria-hidden="true">
                  <div className="store-circuit-ring ring-one" />
                  <div className="store-circuit-ring ring-two" />
                  <div className="store-circuit-line line-one" />
                  <div className="store-circuit-line line-two" />
                  <span className="store-circuit-label label-one">
                    CREATE. CONNECT. BUILD.
                  </span>
                  <div className="store-chip">
                    <StoreIcon name="chip" />
                    <span>
                      IDEAS
                      <br />
                      START HERE
                    </span>
                  </div>
                  <span className="store-circuit-label label-two">
                    <span /> READY FOR YOUR NEXT PROJECT
                  </span>
                </div>
              )}
            </div>
          </section>
        )}

        {!filtered && (
          <div className="store-benefits">
            <div>
              <StoreIcon name="chip" />
              <span>Components for every build</span>
            </div>
            <div>
              <StoreIcon name="search" />
              <span>Find your part, faster</span>
            </div>
            <div>
              <StoreIcon name="box" />
              <span>Follow your order</span>
            </div>
            <a href="mailto:admin@astraval.com">
              <StoreIcon name="help" />
              <span>A little help, when you need it</span>
            </a>
          </div>
        )}

        <section id="categories" className="store-section store-categories">
          <div className="store-section-heading">
            <div>
              <p className="store-eyebrow">FIND YOUR BUILDING BLOCKS</p>
              <h2>Our collections</h2>
            </div>
            <button type="button" className="store-text-link" onClick={() => setShowAllCollections(!showAllCollections)} aria-expanded={showAllCollections}>
              {showAllCollections ? "Show less" : "View all"} <StoreIcon name="arrow" />
            </button>
          </div>
          <div className="store-collections" aria-busy={loadingCategories}>
            {loadingCategories ? Array.from({ length: 6 }, (_, index) => <div key={index} className="store-collection-skeleton" />) :
              (showAllCollections ? categories : categories.slice(0, 6)).map((item, index) => (
                <button type="button" key={item.categoryId ?? item.categoryName} className="store-collection" aria-pressed={String(item.categoryId) === filters.categoryId} onClick={() => selectCategory(item.categoryId)}>
                  <span className={`store-collection-art collection-color-${index % 6}`}>
                    {item.categoryImageUrl ? <ProductImage src={item.categoryImageUrl} alt={item.categoryName} /> : <StoreIcon name={/sensor|wireless/i.test(item.categoryName) ? "bolt" : /tool|hardware/i.test(item.categoryName) ? "box" : /craft/i.test(item.categoryName) ? "grid" : "chip"} />}
                  </span>
                  <span>{item.categoryName}</span>
                </button>
              ))}
          </div>
          {!loadingCategories && !categories.length && <p className="store-collection-empty">Our collections are being updated. Explore all components below.</p>}
        </section>

        <section id="products" className="store-section store-catalog">
          <div className="store-section-heading">
            <div>
              <p className="store-eyebrow">
                {filtered
                  ? "LET’S FIND YOUR NEXT PART"
                  : "GOOD IDEAS NEED GREAT COMPONENTS"}
              </p>
              <h2>
                {filters.q
                  ? `Results for “${filters.q}”`
                  : category?.categoryName || "Small parts. Big possibilities."}
              </h2>
            </div>
            <span className="store-result-count" aria-live="polite">
              {isLoading
                ? "Finding components…"
                : error
                  ? "Catalog unavailable"
                  : `${pageMeta.totalElements} products`}
            </span>
          </div>
          <div className="store-catalog-toolbar">
            <div>
              <StoreIcon name="grid" />
              <span>{category?.categoryName || "All components"}</span>
              {filtered && (
                <button
                  type="button"
                  className="store-clear-filters"
                  onClick={clearFilters}
                >
                  Clear filters <StoreIcon name="close" />
                </button>
              )}
            </div>
            <span>Find it. Build it. Make it yours.</span>
          </div>
          {(cartError || cartSuccess) && (
            <p
              role={cartError ? "alert" : "status"}
              className={`store-notice ${cartError ? "is-error" : ""}`}
            >
              {cartError || cartSuccess}
              {cartSuccess && (
                <Link to="/client/cart">
                  View cart <StoreIcon name="arrow" />
                </Link>
              )}
            </p>
          )}
          {isLoading ? (
            <div
              className="store-product-grid"
              aria-label="Loading products"
              aria-busy="true"
            >
              {Array.from({ length: 8 }, (_, i) => (
                <div className="store-product-skeleton" key={i}>
                  <div />
                  <span />
                  <span />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="store-empty" role="alert">
              <StoreIcon name="help" />
              <h3>We couldn’t load the catalog</h3>
              <p>{error}</p>
              <button className="store-button" type="button" onClick={refresh}>
                Try again <StoreIcon name="arrow" />
              </button>
            </div>
          ) : products.length ? (
            <div className="store-product-grid">
              {products.map((product) => (
                <ProductCard
                  key={product.productId}
                  product={product}
                  onAddToCart={add}
                  isAddingToCart={isMutatingCart}
                />
              ))}
            </div>
          ) : (
            <div className="store-empty">
              <StoreIcon name="search" />
              <h3>
                {filtered
                  ? "No components found"
                  : "The next build is on its way"}
              </h3>
              <p>
                {filtered
                  ? "Try another part name or explore all components."
                  : "Our catalog is being updated. Check back soon."}
              </p>
              <button
                type="button"
                className="store-button"
                onClick={filtered ? clearFilters : refresh}
              >
                {filtered ? "Clear filters" : "Refresh catalog"}
                <StoreIcon name="arrow" />
              </button>
            </div>
          )}
          {!isLoading && !error && pageMeta.totalPages > 1 && (
            <nav className="store-pagination" aria-label="Product pages">
              <button
                type="button"
                disabled={pageMeta.first}
                onClick={() => {
                  goToPage(filters.page - 1);
                  scrollToProducts();
                }}
              >
                Previous
              </button>
              <span>
                Page {pageMeta.page + 1} of {pageMeta.totalPages}
              </span>
              <button
                type="button"
                disabled={pageMeta.last}
                onClick={() => {
                  goToPage(filters.page + 1);
                  scrollToProducts();
                }}
              >
                Next <StoreIcon name="arrow" />
              </button>
            </nav>
          )}
        </section>

        <section id="featured" className="store-section">
          {campaigns.length > 0 && (
            <div className="store-campaign-grid">
              {campaigns.map((item) => (
                <article className="store-campaign" key={item.homeSliderId}>
                  <div>
                    <p className="store-eyebrow">
                      {item.subtitle || "IN THE SPOTLIGHT"}
                    </p>
                    <h2>{item.title}</h2>
                    {item.description && <p>{item.description}</p>}
                    <button
                      className="store-text-link"
                      type="button"
                      onClick={() => openCampaign(item.targetUrl)}
                    >
                      {item.ctaLabel || "Explore collection"}
                      <StoreIcon name="arrow" />
                    </button>
                  </div>
                  {item.imageUrl && (
                    <ProductImage src={item.imageUrl} alt={item.title} />
                  )}
                </article>
              ))}
            </div>
          )}
          <div className="store-project-callout">
            <span className="store-project-icon">
              <StoreIcon name="bolt" />
            </span>
            <div>
              <p className="store-eyebrow">FROM “WHAT IF” TO “IT WORKS”</p>
              <h2>Your workbench is waiting.</h2>
              <p>Find the components for your next bright idea.</p>
            </div>
            <button
              type="button"
              className="store-button"
              onClick={() => {
                clearFilters();
                scrollToProducts();
              }}
            >
              Let’s build something <StoreIcon name="arrow" />
            </button>
          </div>
        </section>
      </main>
      <StoreFooter />
    </div>
  );
}
