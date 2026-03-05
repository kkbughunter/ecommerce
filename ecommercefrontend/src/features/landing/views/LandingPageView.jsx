import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import loginImage from "../../../core/assets/images/login/login.png";
import homeSliderApi from "../../../core/api/homeSliderApi";
import mainBannerApi from "../../../core/api/mainBannerApi";
import productApi from "../../../core/api/productApi";
import { getHomePathByRole, isAuthenticated } from "../../../core/auth/session";
import ENV from "../../../core/config/env";
import getApiErrorMessage from "../../../core/utils/apiError";

const FALLBACK_CATEGORY_CAMPAIGN = {
  homeSliderId: "fallback-category",
  title: "Enhance your music experience",
  subtitle: "Category highlight",
  description: "Featured category campaigns are shown from active slider records.",
  imageUrl: null,
  ctaLabel: "Explore",
  targetUrl: "/client",
  placementTag: "CATEGORY_HIGHLIGHT",
};

const FALLBACK_MAIN_BANNER = {
  homeSliderId: "main-banner-default",
  title: "Welcome to Villpo Store's online store!",
  subtitle: "Main Banner",
  description: "Discover curated products, flash sales, and trending picks in one place.",
  imageUrl: loginImage,
  ctaLabel: "Start Shopping",
  targetUrl: "/client",
  secondaryCtaLabel: "Sign In",
  secondaryCtaUrl: "/login",
  placementTag: "MAIN_BANNER",
  badgeText: "Main Banner",
};

const FALLBACK_MENU_CATEGORIES = [
  "Women's Fashion",
  "Men's Fashion",
  "Electronics",
  "Home & Lifestyle",
  "Medicine",
  "Sports & Outdoor",
  "Groceries",
  "Books & Stationery",
];


const formatMoney = (value, currency = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const resolveTargetUrl = (targetUrl, fallbackUrl) => {
  const normalized = String(targetUrl || "").trim();
  return normalized || fallbackUrl;
};

const navigateByTarget = (navigate, targetUrl) => {
  const normalized = String(targetUrl || "").trim();
  if (!normalized) {
    return;
  }
  if (/^https?:\/\//i.test(normalized)) {
    window.location.href = normalized;
    return;
  }
  navigate(normalized);
};

const pickWithFallback = (primary, fallbackPool, size) => {
  const selected = [];
  const used = new Set();

  const addItem = (item) => {
    if (!item?.productId || used.has(item.productId) || selected.length >= size) {
      return;
    }
    used.add(item.productId);
    selected.push(item);
  };

  (primary || []).forEach(addItem);
  (fallbackPool || []).forEach(addItem);

  return selected;
};

const getProductTagLabel = (tag) => {
  if (tag === "FLASH_SALES") {
    return "Flash";
  }
  if (tag === "TRENDING_PRODUCTS") {
    return "Trending";
  }
  return "Featured";
};

const getCampaignLabel = (tag) => {
  if (tag === "LIMITED_OFFER") {
    return "Limited Offer";
  }
  if (tag === "CATEGORY_HIGHLIGHT") {
    return "Category Highlight";
  }
  return "Campaign";
};

const buildCountdown = () => {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(23, 59, 59, 999);
  const remainingMs = Math.max(midnight.getTime() - now.getTime(), 0);
  const totalSeconds = Math.floor(remainingMs / 1000);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return { hours, minutes, seconds };
};

const SectionHeader = ({ eyebrow, title, rightAction }) => (
  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#db4444]">
        {eyebrow}
      </p>
      <h2 className="mt-1 text-[28px] font-semibold text-[#111827]">{title}</h2>
    </div>
    {rightAction}
  </div>
);

const ProductTile = ({
  product,
  imageUrl,
  onOpen,
  compact = false,
}) => {
  const price = formatMoney(product?.price, "INR");
  const maxPrice = Number(product?.maxPrice || 0);
  const hasDiscount = maxPrice > Number(product?.price || 0);

  return (
    <article className="overflow-hidden rounded-xl border border-[#eceff3] bg-white transition hover:border-[#db4444]/40 hover:shadow-[0_14px_30px_rgba(17,24,39,0.08)]">
      <button
        type="button"
        onClick={() => onOpen(product?.productId)}
        className="w-full text-left"
      >
        <div className={`relative bg-[#f5f6f8] ${compact ? "h-36" : "h-44"}`}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product?.name || "Product"}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-[#6b7280]">
              No image
            </div>
          )}
          <span className="absolute left-2 top-2 rounded-md bg-[#db4444] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-white">
            {getProductTagLabel(product?.productTag)}
          </span>
        </div>
        <div className="space-y-1.5 p-3">
          <p className="line-clamp-1 text-[14px] font-semibold text-[#111827]">
            {product?.name || "-"}
          </p>
          <p className="line-clamp-1 text-[12px] text-[#6b7280]">
            {product?.categoryName || "Category"}
          </p>
          <p className="line-clamp-2 text-[12px] text-[#4b5563]">
            {product?.description || "Product details available on product page."}
          </p>
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <p className="text-[14px] font-semibold text-[#111827]">{price}</p>
              {hasDiscount ? (
                <p className="text-[12px] text-[#9ca3af] line-through">
                  {formatMoney(product?.maxPrice, "INR")}
                </p>
              ) : null}
            </div>
            <p className="text-[11px] text-[#6b7280]">Stock {product?.stockQuantity ?? 0}</p>
          </div>
        </div>
      </button>
    </article>
  );
};

const LandingPageView = () => {
  const navigate = useNavigate();
  const apiBase = ENV.API_BASE_URL?.replace(/\/+$/, "") || "";
  const authenticated = isAuthenticated();
  const roleHomePath = getHomePathByRole();

  const [mainBanners, setMainBanners] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [products, setProducts] = useState([]);
  const [categoryBlocks, setCategoryBlocks] = useState([]);
  const [search, setSearch] = useState("");
  const [heroIndex, setHeroIndex] = useState(0);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [countdown, setCountdown] = useState(buildCountdown());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const entryPath = authenticated && roleHomePath !== "/login" ? roleHomePath : "/login";

  useEffect(() => {
    const extractBannerItems = (source) => {
      const payload = source?.data?.data ?? source?.data ?? source;
      if (Array.isArray(payload)) {
        return payload;
      }
      if (Array.isArray(payload?.content)) {
        return payload.content;
      }
      if (Array.isArray(payload?.items)) {
        return payload.items;
      }
      if (Array.isArray(payload?.data)) {
        return payload.data;
      }
      if (payload && typeof payload === "object" && payload.mainBannerId) {
        return [payload];
      }
      return [];
    };

    const mergeUniqueBanners = (banners) => {
      const uniqueById = new Map();
      banners.forEach((banner) => {
        if (!banner || banner.mainBannerId == null) {
          return;
        }
        uniqueById.set(banner.mainBannerId, banner);
      });
      return [...uniqueById.values()].sort(
        (a, b) => Number(a?.displayOrder ?? 0) - Number(b?.displayOrder ?? 0),
      );
    };

    const resolveBannerList = async () => {
      let fromList = [];
      try {
        const listResponse = await mainBannerApi.getActiveMainBanners();
        fromList = extractBannerItems(listResponse);
      } catch (error) {
        fromList = [];
      }

      let fromSingle = [];
      try {
        const singleResponse = await mainBannerApi.getActiveMainBanner();
        fromSingle = extractBannerItems(singleResponse);
      } catch (error) {
        fromSingle = [];
      }

      return mergeUniqueBanners([...fromList, ...fromSingle]);
    };

    const loadLandingData = async () => {
      setIsLoading(true);
      setError("");

      try {
        const [bannerData, campaignResult, productsResult, categoriesResult] = await Promise.allSettled([
          resolveBannerList(),
          homeSliderApi.getActiveSliders(),
          productApi.getActiveProducts({ page: 0, size: 32 }),
          productApi.getActiveCategoriesWithProducts({ page: 0, size: 16 }),
        ]);

        const resolvedBanners = bannerData.status === "fulfilled" ? bannerData.value || [] : [];
        const campaignData =
          campaignResult.status === "fulfilled"
            ? campaignResult.value?.data?.data || []
            : [];
        const productData =
          productsResult.status === "fulfilled"
            ? productsResult.value?.data?.data?.content || []
            : [];
        const categoryData =
          categoriesResult.status === "fulfilled"
            ? categoriesResult.value?.data?.data?.content || []
            : [];

        setMainBanners(Array.isArray(resolvedBanners) ? resolvedBanners : []);
        setCampaigns(Array.isArray(campaignData) ? campaignData : []);
        setProducts(Array.isArray(productData) ? productData : []);
        setCategoryBlocks(Array.isArray(categoryData) ? categoryData : []);

        const allFailed = [bannerData, campaignResult, productsResult, categoriesResult].every(
          (result) => result.status === "rejected",
        );
        if (allFailed) {
          setError("Unable to load landing data right now.");
        }
      } catch (err) {
        setError(getApiErrorMessage(err, "Unable to load landing data right now."));
      } finally {
        setIsLoading(false);
      }
    };

    loadLandingData();
  }, []);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setCountdown(buildCountdown());
    }, 1000);
    return () => window.clearInterval(timerId);
  }, []);

  const categoryHighlightSlides = useMemo(() => {
    const items = campaigns.filter((campaign) => campaign?.placementTag === "CATEGORY_HIGHLIGHT");
    return items.length ? items : [FALLBACK_CATEGORY_CAMPAIGN];
  }, [campaigns]);

  const heroSlides = useMemo(
    () => {
      if (!mainBanners.length) {
        return [FALLBACK_MAIN_BANNER];
      }
      return mainBanners.map((banner) => ({
        homeSliderId: `main-banner-${banner.mainBannerId}`,
        title: banner?.headline || "",
        subtitle: banner?.subheadline || "",
        description: banner?.description || "",
        imageUrl: banner?.imageUrl || "",
        ctaLabel: banner?.primaryCtaLabel || "Start Shopping",
        targetUrl: resolveTargetUrl(banner?.primaryCtaUrl, "/client"),
        secondaryCtaLabel: banner?.secondaryCtaLabel || "Sign In",
        secondaryCtaUrl: resolveTargetUrl(banner?.secondaryCtaUrl, "/login"),
        placementTag: "MAIN_BANNER",
        badgeText: banner?.badgeText || "Main Banner",
      }));
    },
    [mainBanners],
  );

  useEffect(() => {
    if (heroIndex > heroSlides.length - 1) {
      setHeroIndex(0);
    }
  }, [heroIndex, heroSlides.length]);

  useEffect(() => {
    if (highlightIndex > categoryHighlightSlides.length - 1) {
      setHighlightIndex(0);
    }
  }, [categoryHighlightSlides.length, highlightIndex]);

  useEffect(() => {
    if (heroSlides.length <= 1) {
      return undefined;
    }
    const timerId = window.setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => window.clearInterval(timerId);
  }, [heroSlides.length]);

  useEffect(() => {
    if (categoryHighlightSlides.length <= 1) {
      return undefined;
    }
    const timerId = window.setInterval(() => {
      setHighlightIndex((prev) => (prev + 1) % categoryHighlightSlides.length);
    }, 7000);
    return () => window.clearInterval(timerId);
  }, [categoryHighlightSlides.length]);

  const activeHero = heroSlides[heroIndex] || heroSlides[0] || FALLBACK_MAIN_BANNER;
  const activeHighlight =
    categoryHighlightSlides[highlightIndex] ||
    categoryHighlightSlides[0] ||
    FALLBACK_CATEGORY_CAMPAIGN;

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return products;
    }
    return products.filter((product) =>
      [product?.name, product?.description, product?.categoryName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [products, search]);

  const flashProducts = useMemo(
    () => filteredProducts.filter((product) => product?.productTag === "FLASH_SALES"),
    [filteredProducts],
  );

  const trendingProducts = useMemo(
    () => filteredProducts.filter((product) => product?.productTag === "TRENDING_PRODUCTS"),
    [filteredProducts],
  );

  const flashShowcase = useMemo(
    () => pickWithFallback(flashProducts, filteredProducts, 6),
    [filteredProducts, flashProducts],
  );

  const bestSellingProducts = useMemo(
    () => pickWithFallback(trendingProducts, filteredProducts, 4),
    [filteredProducts, trendingProducts],
  );

  const exploreProducts = useMemo(() => filteredProducts.slice(0, 8), [filteredProducts]);

  const newestProducts = useMemo(() => {
    const cloned = [...filteredProducts];
    cloned.sort(
      (a, b) =>
        new Date(b?.createdDt || 0).getTime() - new Date(a?.createdDt || 0).getTime(),
    );
    return cloned.slice(0, 4);
  }, [filteredProducts]);

  const categoryHighlights = useMemo(() => categoryBlocks.slice(0, 6), [categoryBlocks]);
  const menuCategories = useMemo(() => {
    if (categoryBlocks.length) {
      return categoryBlocks
        .map((item) => item?.categoryName)
        .filter(Boolean)
        .slice(0, 8);
    }
    return FALLBACK_MENU_CATEGORIES;
  }, [categoryBlocks]);

  const openProduct = (productId) => {
    if (!productId) {
      return;
    }
    if (!authenticated) {
      navigate("/login");
      return;
    }
    navigate(`/products/${productId}`);
  };

  const getProductImageUrl = (product) => {
    if (!apiBase || !product?.productId || !product?.mainImageUploadId) {
      return null;
    }
    return `${apiBase}/products/${product.productId}/images/${product.mainImageUploadId}/file`;
  };

  const getCategoryPreviewImage = (categoryBlock) => {
    const firstImageProduct = (categoryBlock?.products || []).find(
      (product) => product?.productId && product?.mainImageUploadId,
    );
    return getProductImageUrl(firstImageProduct);
  };

  const goToEntry = () => navigate(entryPath);

  return (
    <main className="min-h-screen bg-[#f5f6f8] text-[#111827] [font-family:'Manrope','Segoe_UI',sans-serif]">
      <div className="bg-black px-3 py-2 text-center text-[11px] font-medium text-white">
        Summer Sale For All Swim Suits And Free Delivery - OFF 50%
      </div>

      <header className="border-b border-[#e6e9ee] bg-white">
        <div className="mx-auto flex w-full max-w-[1160px] flex-wrap items-center justify-between gap-3 px-3 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#db4444]">
              Astraval
            </p>
            <h1 className="text-[24px] font-bold tracking-tight text-[#111827]">Villpo Store</h1>
          </div>

          <nav className="hidden items-center gap-6 text-[13px] text-[#374151] md:flex">
            <a href="#flash" className="transition hover:text-[#db4444]">Flash Sales</a>
            <a href="#categories" className="transition hover:text-[#db4444]">Categories</a>
            <a href="#explore" className="transition hover:text-[#db4444]">Explore</a>
            <a href="#new-arrival" className="transition hover:text-[#db4444]">New Arrival</a>
          </nav>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="What are you looking for?"
              className="h-10 w-64 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-3 text-[12px] text-[#1f2937] outline-none focus:border-[#db4444]"
            />
            <button
              type="button"
              onClick={goToEntry}
              className="h-10 rounded-lg bg-[#db4444] px-4 text-[12px] font-semibold text-white transition hover:brightness-95"
            >
              {authenticated ? "Go To App" : "Sign In"}
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto w-full max-w-[1160px] px-3 py-5">
        {error ? (
          <div className="mb-4 rounded-lg border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-sm text-[#b91c1c]">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[230px_1fr]">
          <aside className="rounded-xl border border-[#e6e9ee] bg-white p-3">
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.1em] text-[#6b7280]">
              Shop Categories
            </p>
            <div className="space-y-1">
              {menuCategories.map((categoryName, index) => (
                <button
                  key={`${categoryName}-${index}`}
                  type="button"
                  onClick={goToEntry}
                  className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-[13px] text-[#111827] transition hover:bg-[#f5f6f8]"
                >
                  <span className="line-clamp-1">{categoryName}</span>
                  <span className="text-[#9ca3af]">{">"}</span>
                </button>
              ))}
            </div>
          </aside>

          <article className="relative overflow-hidden rounded-xl border border-[#dde3ec] bg-black">
            {activeHero ? (
              <>
                <img
                  src={activeHero?.imageUrl || loginImage}
                  alt={activeHero?.title || "Landing banner"}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.84),rgba(0,0,0,0.52),rgba(0,0,0,0.18))]" />

                <div className="relative z-10 flex min-h-[350px] flex-col justify-center p-6 text-white md:p-8">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#fca5a5]">
                    {activeHero?.badgeText || activeHero?.subtitle || getCampaignLabel(activeHero?.placementTag)}
                  </p>
                  <h2 className="mt-2 max-w-[560px] text-[36px] font-semibold leading-[1.12] md:text-[44px]">
                    {activeHero?.title || "Main Banner"}
                  </h2>
                  <p className="mt-3 max-w-[560px] text-[14px] text-[#f3f4f6]">
                    {activeHero?.description || "-"}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        navigateByTarget(
                          navigate,
                          resolveTargetUrl(activeHero?.targetUrl, "/client"),
                        )
                      }
                      className="rounded-lg bg-[#db4444] px-4 py-2 text-[13px] font-semibold text-white transition hover:brightness-95"
                    >
                      {activeHero?.ctaLabel || "Shop Now"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        navigateByTarget(
                          navigate,
                          resolveTargetUrl(activeHero?.secondaryCtaUrl, "/login"),
                        )
                      }
                      className="rounded-lg border border-white/40 bg-white/10 px-4 py-2 text-[13px] font-semibold text-white backdrop-blur"
                    >
                      {activeHero?.secondaryCtaLabel || "Sign In"}
                    </button>
                  </div>

                  <div className="mt-6 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5">
                      {heroSlides.map((slide, index) => (
                        <button
                          key={slide.homeSliderId || `hero-slide-${index}`}
                          type="button"
                          onClick={() => setHeroIndex(index)}
                          className={`h-2.5 w-2.5 rounded-full ${
                            heroIndex === index ? "bg-[#db4444]" : "bg-white/50"
                          }`}
                          aria-label={`Go to hero slide ${index + 1}`}
                        />
                      ))}
                    </div>
                    {heroSlides.length > 1 ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setHeroIndex((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)
                          }
                          className="rounded-md border border-white/35 bg-white/10 px-2 py-1 text-[11px] font-semibold text-white"
                        >
                          Prev
                        </button>
                        <button
                          type="button"
                          onClick={() => setHeroIndex((prev) => (prev + 1) % heroSlides.length)}
                          className="rounded-md border border-white/35 bg-white/10 px-2 py-1 text-[11px] font-semibold text-white"
                        >
                          Next
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex min-h-[350px] items-center justify-center p-6 text-center text-white">
                <div>
                  <p className="text-[12px] uppercase tracking-[0.12em] text-[#fca5a5]">Main Banner</p>
                  <h2 className="mt-2 text-[28px] font-semibold">No banner added</h2>
                  <p className="mt-2 text-[13px] text-[#e5e7eb]">
                    Admin has not added an active main banner yet.
                  </p>
                </div>
              </div>
            )}
          </article>
        </div>

        <section id="flash" className="mt-10">
          <SectionHeader
            eyebrow="Today's"
            title="Flash Sales"
            rightAction={
              <div className="flex items-center gap-2 text-[13px] font-semibold text-[#111827]">
                <span>Ends In</span>
                <span className="rounded-md bg-white px-2 py-1">{countdown.hours}</span>
                <span>:</span>
                <span className="rounded-md bg-white px-2 py-1">{countdown.minutes}</span>
                <span>:</span>
                <span className="rounded-md bg-white px-2 py-1">{countdown.seconds}</span>
              </div>
            }
          />

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {flashShowcase.map((product) => (
              <ProductTile
                key={`flash-${product.productId}`}
                product={product}
                imageUrl={getProductImageUrl(product)}
                onOpen={openProduct}
                compact
              />
            ))}
          </div>

          {!flashShowcase.length && !isLoading ? (
            <p className="text-sm text-[#6b7280]">No flash products are available right now.</p>
          ) : null}

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={goToEntry}
              className="rounded-lg bg-[#db4444] px-6 py-2.5 text-[13px] font-semibold text-white transition hover:brightness-95"
            >
              View All Products
            </button>
          </div>
        </section>

        <section id="categories" className="mt-12">
          <SectionHeader eyebrow="Categories" title="Browse By Category" />
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {categoryHighlights.map((category, index) => (
              <button
                key={category?.categoryId || `category-${index}`}
                type="button"
                onClick={goToEntry}
                className="rounded-xl border border-[#e5e7eb] bg-white p-3 text-left transition hover:border-[#db4444] hover:shadow-[0_10px_24px_rgba(17,24,39,0.08)]"
              >
                {getCategoryPreviewImage(category) ? (
                  <div
                    className="mb-3 h-20 rounded-lg border border-[#edf0f5] bg-cover bg-center"
                    style={{ backgroundImage: `url(${getCategoryPreviewImage(category)})` }}
                  />
                ) : (
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#f3f4f6] text-[14px] font-semibold text-[#111827]">
                    {(category?.categoryName || "C").charAt(0).toUpperCase()}
                  </div>
                )}
                <p className="line-clamp-1 text-[13px] font-semibold text-[#111827]">
                  {category?.categoryName || "Category"}
                </p>
                <p className="mt-1 text-[11px] text-[#6b7280]">
                  {(category?.products || []).length} active products
                </p>
              </button>
            ))}
          </div>

          {!categoryHighlights.length && !isLoading ? (
            <p className="text-sm text-[#6b7280]">No category highlights are available yet.</p>
          ) : null}
        </section>

        <section className="mt-12">
          <SectionHeader
            eyebrow="This Month"
            title="Best Selling Products"
            rightAction={
              <button
                type="button"
                onClick={goToEntry}
                className="rounded-md bg-[#db4444] px-4 py-2 text-[12px] font-semibold text-white transition hover:brightness-95"
              >
                View All
              </button>
            }
          />

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {bestSellingProducts.map((product) => (
              <ProductTile
                key={`best-${product.productId}`}
                product={product}
                imageUrl={getProductImageUrl(product)}
                onOpen={openProduct}
              />
            ))}
          </div>

          {!bestSellingProducts.length && !isLoading ? (
            <p className="text-sm text-[#6b7280]">No best-selling products available.</p>
          ) : null}
        </section>

        <section className="mt-12 overflow-hidden rounded-2xl border border-[#dbe1ea] bg-black">
          <div className="relative min-h-[280px] p-6 text-white md:p-8">
            <img
              src={activeHighlight?.imageUrl || loginImage}
              alt={activeHighlight?.title || "Category highlight"}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.9),rgba(0,0,0,0.58),rgba(0,0,0,0.24))]" />

            <div className="relative z-10 max-w-[560px]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#86efac]">
                {activeHighlight?.subtitle || getCampaignLabel(activeHighlight?.placementTag)}
              </p>
              <h3 className="mt-2 text-[36px] font-semibold leading-[1.12]">
                {activeHighlight?.title || FALLBACK_CATEGORY_CAMPAIGN.title}
              </h3>
              <p className="mt-3 text-[14px] text-[#e5e7eb]">
                {activeHighlight?.description || FALLBACK_CATEGORY_CAMPAIGN.description}
              </p>

              <div className="mt-5 flex items-center gap-2">
                {categoryHighlightSlides.map((slide, index) => (
                  <button
                    key={slide.homeSliderId || `highlight-${index}`}
                    type="button"
                    onClick={() => setHighlightIndex(index)}
                    className={`h-2.5 w-2.5 rounded-full ${
                      highlightIndex === index ? "bg-[#22c55e]" : "bg-white/45"
                    }`}
                    aria-label={`Go to category highlight ${index + 1}`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() =>
                  navigateByTarget(
                    navigate,
                    resolveTargetUrl(activeHighlight?.targetUrl, "/client"),
                  )
                }
                className="mt-5 rounded-lg bg-[#22c55e] px-5 py-2.5 text-[13px] font-semibold text-[#052e16]"
              >
                {activeHighlight?.ctaLabel || "Explore"}
              </button>
            </div>
          </div>
        </section>

        <section id="explore" className="mt-12">
          <SectionHeader eyebrow="Our Products" title="Explore Our Products" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {exploreProducts.map((product) => (
              <ProductTile
                key={`explore-${product.productId}`}
                product={product}
                imageUrl={getProductImageUrl(product)}
                onOpen={openProduct}
              />
            ))}
          </div>

          {!exploreProducts.length && !isLoading ? (
            <p className="text-sm text-[#6b7280]">No products available for this search.</p>
          ) : null}

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={goToEntry}
              className="rounded-lg bg-[#db4444] px-6 py-2.5 text-[13px] font-semibold text-white transition hover:brightness-95"
            >
              View All Products
            </button>
          </div>
        </section>

        <section id="new-arrival" className="mt-12">
          <SectionHeader eyebrow="Featured" title="New Arrival" />

          {newestProducts.length ? (
            <div className="grid gap-3 lg:grid-cols-[1.2fr_1fr]">
              <article className="relative overflow-hidden rounded-xl border border-[#e5e7eb] bg-black">
                <img
                  src={getProductImageUrl(newestProducts[0]) || loginImage}
                  alt={newestProducts[0]?.name || "New arrival"}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.2),rgba(0,0,0,0.78))]" />
                <div className="relative flex min-h-[360px] flex-col justify-end p-5 text-white">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-[#fca5a5]">New Arrival</p>
                  <h3 className="mt-1 text-[24px] font-semibold">{newestProducts[0]?.name || "Latest Product"}</h3>
                  <p className="mt-1 line-clamp-2 text-[13px] text-[#d1d5db]">
                    {newestProducts[0]?.description || "Freshly added to our public catalog."}
                  </p>
                  <button
                    type="button"
                    onClick={() => openProduct(newestProducts[0]?.productId)}
                    className="mt-4 w-fit rounded-md bg-white px-4 py-2 text-[12px] font-semibold text-black"
                  >
                    Shop Now
                  </button>
                </div>
              </article>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {newestProducts.slice(1).map((product) => (
                  <article
                    key={`arrival-${product.productId}`}
                    className="relative overflow-hidden rounded-xl border border-[#e5e7eb] bg-black"
                  >
                    <img
                      src={getProductImageUrl(product) || loginImage}
                      alt={product?.name || "New arrival product"}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.28),rgba(0,0,0,0.8))]" />
                    <div className="relative flex min-h-[116px] flex-col justify-end p-4 text-white">
                      <h4 className="line-clamp-1 text-[16px] font-semibold">{product?.name || "-"}</h4>
                      <button
                        type="button"
                        onClick={() => openProduct(product?.productId)}
                        className="mt-2 w-fit rounded-md border border-white/50 bg-white/10 px-3 py-1 text-[11px] font-semibold backdrop-blur"
                      >
                        Shop Now
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-[#6b7280]">No newly added products available.</p>
          )}
        </section>

       
      </section>

      <footer className="mt-12 bg-black text-white">
        <div className="mx-auto grid w-full max-w-[1160px] gap-8 px-3 py-12 md:grid-cols-5">
          <div>
            <h3 className="text-[22px] font-semibold">Villpo Store</h3>
            <p className="mt-3 text-[12px] text-[#9ca3af]">Subscribe for offer updates and featured campaign drops.</p>
          </div>
          <div>
            <h4 className="text-[13px] font-semibold uppercase tracking-[0.08em]">Support</h4>
            <p className="mt-3 text-[12px] text-[#9ca3af]">support@villpostore.com</p>
            <p className="mt-1 text-[12px] text-[#9ca3af]">+91 98765 43210</p>
          </div>
          <div>
            <h4 className="text-[13px] font-semibold uppercase tracking-[0.08em]">Account</h4>
            <p className="mt-3 text-[12px] text-[#9ca3af]">My Account</p>
            <p className="mt-1 text-[12px] text-[#9ca3af]">Login / Register</p>
            <p className="mt-1 text-[12px] text-[#9ca3af]">Cart</p>
          </div>
          <div>
            <h4 className="text-[13px] font-semibold uppercase tracking-[0.08em]">Quick Link</h4>
            <p className="mt-3 text-[12px] text-[#9ca3af]">Privacy Policy</p>
            <p className="mt-1 text-[12px] text-[#9ca3af]">Terms Of Use</p>
            <p className="mt-1 text-[12px] text-[#9ca3af]">FAQ</p>
          </div>
          <div>
            <h4 className="text-[13px] font-semibold uppercase tracking-[0.08em]">Storefront</h4>
            <p className="mt-3 text-[12px] text-[#9ca3af]">
              Public APIs drive banners, sliders, products, and category highlights.
            </p>
          </div>
        </div>
        <p className="border-t border-[#202530] py-4 text-center text-[12px] text-[#6b7280]">
          (c) {new Date().getFullYear()} Villpo Store. All rights reserved.
        </p>
      </footer>
    </main>
  );
};

export default LandingPageView;
