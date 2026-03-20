import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import categoryApi from "../../../core/api/categoryApi";
import productApi from "../../../core/api/productApi";
import { clearAuthSession, getHomePathByRole, hasAnyRole } from "../../../core/auth/session";
import ENV from "../../../core/config/env";
import getApiErrorMessage from "../../../core/utils/apiError";
import ProductCard from "../../client/components/ProductCard";
import useCart from "../../client/hooks/useCart";

const formatMoney = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const formatDateTime = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getTagLabel = (tag) => {
  if (tag === "FLASH_SALES") return "Flash Sales";
  if (tag === "TRENDING_PRODUCTS") return "Trending";
  return null;
};

const SvgIcon = ({ path, className = "h-5 w-5 fill-current" }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
    <path d={path} />
  </svg>
);

const SpecRow = ({ label, value }) => (
  <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-2.5 last:border-0">
    <span className="text-sm text-slate-500">{label}</span>
    <span className="text-right text-sm font-medium text-slate-800">{value}</span>
  </div>
);

const ProductDetailView = () => {
  const navigate = useNavigate();
  const { productId } = useParams();
  const isAdmin = hasAnyRole(["ADMIN"]);

  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const descriptionRef = useRef(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    price: "",
    maxPrice: "",
    gstPercentage: "",
    stockQuantity: "",
    widthCm: "",
    heightCm: "",
    weightKg: "",
    categoryId: "",
    mainImageUploadId: "",
    productTag: "",
  });

  const { addToCart, isMutatingCart, error: cartError, success: cartSuccess } = useCart({
    enabled: !isAdmin,
  });

  const applyDescriptionFormat = (type) => {
    const input = descriptionRef.current;
    if (!input) return;
    const current = editForm.description || "";
    const start = input.selectionStart ?? current.length;
    const end = input.selectionEnd ?? current.length;
    const selected = current.slice(start, end);
    let formatted = selected;
    if (type === "bold") formatted = `**${selected || "text"}**`;
    else if (type === "italic") formatted = `*${selected || "text"}*`;
    else if (type === "bullet") formatted = `- ${selected || "item"}`;
    else if (type === "number") formatted = `1. ${selected || "item"}`;
    const nextValue = `${current.slice(0, start)}${formatted}${current.slice(end)}`;
    setEditForm((prev) => ({ ...prev, description: nextValue }));
    requestAnimationFrame(() => {
      input.focus();
      const caret = start + formatted.length;
      input.setSelectionRange(caret, caret);
    });
  };

  const buildImageFileUrl = useCallback(
    (uploadId) => {
      const base = ENV.API_BASE_URL?.replace(/\/+$/, "") || "";
      return `${base}/products/${productId}/images/${uploadId}/file`;
    },
    [productId],
  );

  const galleryImages = useMemo(() => {
    if (!product?.productId) return [];
    const images = Array.isArray(product?.images) ? product.images : [];
    const existingIds = new Set(images.map((img) => img?.uploadId).filter(Boolean));
    const normalized = images
      .filter((img) => Boolean(img?.uploadId))
      .map((img) => ({
        uploadId: img.uploadId,
        filename: img?.filename || "Product image",
        url: buildImageFileUrl(img.uploadId),
      }));
    if (product?.mainImageUploadId && !existingIds.has(product.mainImageUploadId)) {
      normalized.unshift({
        uploadId: product.mainImageUploadId,
        filename: product?.name || "Product image",
        url: buildImageFileUrl(product.mainImageUploadId),
      });
    }
    return normalized;
  }, [buildImageFileUrl, product]);

  useEffect(() => {
    if (!galleryImages.length) {
      setSelectedImageIndex(0);
      return;
    }
    setSelectedImageIndex((prev) => Math.min(prev, galleryImages.length - 1));
  }, [galleryImages]);

  const syncProductState = (data) => {
    setProduct(data);
    setEditForm({
      name: data?.name || "",
      description: data?.description || "",
      price: data?.price ?? "",
      maxPrice: data?.maxPrice ?? data?.price ?? "",
      gstPercentage: data?.gstPercentage ?? "",
      stockQuantity: data?.stockQuantity ?? "",
      widthCm: data?.widthCm ?? "",
      heightCm: data?.heightCm ?? "",
      weightKg: data?.weightKg ?? "",
      categoryId: data?.categoryId ?? "",
      mainImageUploadId: data?.mainImageUploadId || "",
      productTag: data?.productTag || "",
    });
  };

  const loadProduct = useCallback(
    async ({ withLoader = false } = {}) => {
      if (withLoader) setIsLoading(true);
      try {
        const response = await productApi.getProductDetails(productId);
        syncProductState(response?.data?.data || null);
      } catch (err) {
        setError(getApiErrorMessage(err, "Unable to load product details."));
      } finally {
        if (withLoader) setIsLoading(false);
      }
    },
    [productId],
  );

  useEffect(() => {
    loadProduct({ withLoader: true });
  }, [loadProduct]);

  useEffect(() => {
    if (!isAdmin) return;
    const loadCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const response = await categoryApi.getAllCategories();
        const list = Array.isArray(response?.data?.data) ? response.data.data : [];
        setCategories(
          list
            .map((item) => ({
              categoryId: Number(item?.categoryId),
              categoryName: String(item?.categoryName || "").trim(),
            }))
            .filter((item) => Number.isFinite(item.categoryId) && item.categoryName),
        );
      } catch {
        setCategories([]);
      } finally {
        setIsLoadingCategories(false);
      }
    };
    loadCategories();
  }, [isAdmin]);

  useEffect(() => {
    const loadRelated = async () => {
      if (!product?.categoryId) {
        setRelatedProducts([]);
        return;
      }
      try {
        const response = await productApi.getActiveProductsByCategory(product.categoryId, {
          page: 0,
          size: 8,
        });
        const items = response?.data?.data?.content || [];
        setRelatedProducts(
          items
            .filter((item) => Number(item?.productId) !== Number(product.productId))
            .slice(0, 4),
        );
      } catch {
        setRelatedProducts([]);
      }
    };
    loadRelated();
  }, [product?.categoryId, product?.productId]);

  const handleLogout = () => {
    clearAuthSession();
    navigate("/login", { replace: true });
  };

  const handleBack = () => {
    navigate(getHomePathByRole(), { replace: true });
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    if (error || success) {
      setError("");
      setSuccess("");
    }
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsUpdating(true);
    try {
      const payload = {
        name: editForm.name.trim(),
        description: editForm.description.trim() || null,
        price: Number(editForm.price),
        maxPrice: editForm.maxPrice ? Number(editForm.maxPrice) : Number(editForm.price),
        gstPercentage: Number(editForm.gstPercentage),
        stockQuantity: Number(editForm.stockQuantity),
        widthCm: Number(editForm.widthCm),
        heightCm: Number(editForm.heightCm),
        weightKg: Number(editForm.weightKg),
        categoryId: editForm.categoryId ? Number(editForm.categoryId) : null,
        mainImageUploadId: editForm.mainImageUploadId.trim() || null,
        productTag: editForm.productTag || null,
      };
      await productApi.updateProduct(productId, payload);
      setSuccess("Product updated successfully.");
      setIsEditMode(false);
      await loadProduct();
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to update product."));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFileChange = (event) => {
    setSelectedFiles(Array.from(event.target.files || []));
    if (error || success) {
      setError("");
      setSuccess("");
    }
  };

  const handleUploadImages = async (event) => {
    event.preventDefault();
    if (!selectedFiles.length) {
      setError("Please select one or more image files.");
      return;
    }
    setError("");
    setSuccess("");
    setIsUploading(true);
    try {
      const response = await productApi.uploadProductImages(productId, selectedFiles);
      const uploaded = response?.data?.data || [];
      setSelectedFiles([]);
      setSuccess(`Uploaded ${uploaded.length} image(s) successfully.`);
      await loadProduct();
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to upload images."));
    } finally {
      setIsUploading(false);
    }
  };

  const price = Number(product?.price || 0);
  const maxPrice = Number(product?.maxPrice || product?.price || 0);
  const savePercentage =
    maxPrice > price && maxPrice > 0 ? Math.round(((maxPrice - price) / maxPrice) * 100) : 0;
  const hasMultipleImages = galleryImages.length > 1;
  const activeImage = galleryImages[selectedImageIndex] || null;
  const isInStock = Number(product?.stockQuantity || 0) > 0;
  const tagLabel = getTagLabel(product?.productTag);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── TOP NAV ── */}
      {isAdmin ? (
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-md">
          <div className="flex h-14 items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                <SvgIcon path="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" className="h-4 w-4 fill-current" />
                Back
              </button>
              <span className="hidden rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700 sm:inline">
                Admin Product Studio
              </span>
            </div>
            <span className="text-sm font-semibold text-slate-500">Product #{productId}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              <SvgIcon
                path="M10 17l1.41-1.41L8.83 13H20v-2H8.83l2.58-2.59L10 7l-5 5 5 5zm-6 3h8v-2H4V6h8V4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2z"
                className="h-4 w-4 fill-current"
              />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>
      ) : (
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-md">
          <div className="flex h-14 items-center justify-between px-4 md:px-6">
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              <SvgIcon path="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" className="h-4 w-4 fill-current" />
              Back
            </button>
            <button
              type="button"
              onClick={() => navigate("/client")}
              className="text-lg font-extrabold tracking-tight text-slate-900"
            >
              Villpo Store
            </button>
            <button
              type="button"
              onClick={() => navigate("/client/cart")}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              aria-label="Cart"
            >
              <SvgIcon
                path="M7 18c-1.1 0-1.99.9-1.99 2A2 2 0 0 0 7 22a2 2 0 0 0 0-4zm10 0a2 2 0 1 0 2 2 2 2 0 0 0-2-2zM7.17 14h9.9a2 2 0 0 0 1.92-1.45L21 6H6.21l-.47-2H2v2h2l2.6 10a2 2 0 0 0 1.94 1.5H19v-2H8.53a.5.5 0 0 1-.48-.36L7.17 14z"
                className="h-5 w-5 fill-current"
              />
              <span className="hidden sm:inline">Cart</span>
            </button>
          </div>
        </header>
      )}

      <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        {isLoading ? (
          <div className="animate-pulse">
            <div className="grid gap-8 lg:grid-cols-2">
              <div className="aspect-square rounded-3xl bg-slate-200" />
              <div className="space-y-4">
                <div className="h-5 w-24 rounded-full bg-slate-200" />
                <div className="h-8 w-3/4 rounded-xl bg-slate-200" />
                <div className="h-5 w-1/2 rounded-xl bg-slate-200" />
                <div className="h-12 w-40 rounded-xl bg-slate-200" />
                <div className="h-12 w-full rounded-2xl bg-slate-200" />
              </div>
            </div>
          </div>
        ) : error && !product ? (
          <div className="rounded-2xl bg-red-50 p-6 text-center">
            <p className="text-red-600">{error}</p>
            <button
              type="button"
              onClick={() => loadProduct({ withLoader: true })}
              className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Try Again
            </button>
          </div>
        ) : product ? (
          <>
            {/* ── MAIN PRODUCT LAYOUT ── */}
            <div className="grid gap-8 lg:grid-cols-[45%_55%]">
              {/* LEFT: Image Gallery */}
              <div className="space-y-3">
                <div className="relative aspect-square overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-sm">
                  {activeImage ? (
                    <img
                      src={activeImage.url}
                      alt={activeImage.filename || product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-400">
                      <div className="text-center">
                        <SvgIcon
                          path="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
                          className="mx-auto h-12 w-12 fill-slate-300"
                        />
                        <p className="mt-2 text-sm text-slate-400">No image</p>
                      </div>
                    </div>
                  )}

                  {tagLabel && (
                    <span
                      className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                        product.productTag === "FLASH_SALES"
                          ? "bg-red-500 text-white"
                          : "bg-violet-600 text-white"
                      }`}
                    >
                      {tagLabel}
                    </span>
                  )}

                  <span
                    className={`absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-bold ${
                      isInStock
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-900 text-white"
                    }`}
                  >
                    {isInStock ? "In Stock" : "Out of Stock"}
                  </span>

                  {hasMultipleImages && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedImageIndex((prev) =>
                            prev === 0 ? galleryImages.length - 1 : prev - 1,
                          )
                        }
                        className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/70"
                        aria-label="Previous image"
                      >
                        <SvgIcon path="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" className="h-4 w-4 fill-current" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedImageIndex((prev) =>
                            prev === galleryImages.length - 1 ? 0 : prev + 1,
                          )
                        }
                        className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/70"
                        aria-label="Next image"
                      >
                        <SvgIcon path="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" className="h-4 w-4 fill-current" />
                      </button>
                      <p className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white">
                        {selectedImageIndex + 1} / {galleryImages.length}
                      </p>
                    </>
                  )}
                </div>

                {hasMultipleImages && (
                  <div className="grid grid-cols-5 gap-2">
                    {galleryImages.map((img, idx) => (
                      <button
                        key={img.uploadId}
                        type="button"
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`overflow-hidden rounded-xl border-2 transition ${
                          idx === selectedImageIndex
                            ? "border-blue-500 shadow-md"
                            : "border-transparent hover:border-slate-300"
                        }`}
                      >
                        <img
                          src={img.url}
                          alt={img.filename || `Image ${idx + 1}`}
                          className="aspect-square w-full object-cover"
                          loading="lazy"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* RIGHT: Product Info */}
              <div className="flex flex-col gap-5">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <button
                    type="button"
                    onClick={() => navigate(isAdmin ? "/admin" : "/client")}
                    className="hover:text-blue-600"
                  >
                    {isAdmin ? "Admin" : "Home"}
                  </button>
                  <SvgIcon path="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" className="h-3.5 w-3.5 fill-slate-300" />
                  {product.categoryName && (
                    <>
                      <span className="text-slate-500">{product.categoryName}</span>
                      <SvgIcon path="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" className="h-3.5 w-3.5 fill-slate-300" />
                    </>
                  )}
                  <span className="line-clamp-1 text-slate-700">{product.name}</span>
                </div>

                {/* Product name */}
                <div>
                  <h1 className="text-2xl font-bold leading-snug text-slate-900 md:text-3xl">
                    {product.name}
                  </h1>
                  {product.description && (
                    <p className="mt-2 text-sm leading-relaxed text-slate-500">
                      {product.description}
                    </p>
                  )}
                </div>

                {/* Price section */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-baseline gap-3">
                    <span className="text-3xl font-extrabold text-slate-900">
                      {formatMoney(price)}
                    </span>
                    {maxPrice > price && (
                      <span className="text-lg text-slate-400 line-through">
                        {formatMoney(maxPrice)}
                      </span>
                    )}
                    {savePercentage > 0 && (
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-700">
                        Save {savePercentage}%
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs text-slate-400">
                    Inclusive of all taxes (GST {product.gstPercentage}%)
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${isInStock ? "bg-emerald-500" : "bg-slate-400"}`}
                    />
                    <span
                      className={`text-sm font-medium ${
                        isInStock ? "text-emerald-700" : "text-slate-500"
                      }`}
                    >
                      {isInStock
                        ? `${product.stockQuantity} units available`
                        : "Currently out of stock"}
                    </span>
                  </div>
                </div>

                {/* Add to Cart / Admin controls */}
                {!isAdmin ? (
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => addToCart(product?.productId)}
                      disabled={isMutatingCart || !isInStock}
                      className={`flex h-13 w-full items-center justify-center gap-2 rounded-2xl text-base font-bold shadow-md transition ${
                        isInStock
                          ? "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]"
                          : "cursor-not-allowed bg-slate-200 text-slate-400"
                      } disabled:opacity-70`}
                    >
                      <SvgIcon
                        path="M7 18c-1.1 0-1.99.9-1.99 2A2 2 0 0 0 7 22a2 2 0 0 0 0-4zm10 0a2 2 0 1 0 2 2 2 2 0 0 0-2-2zM7.17 14h9.9a2 2 0 0 0 1.92-1.45L21 6H6.21l-.47-2H2v2h2l2.6 10a2 2 0 0 0 1.94 1.5H19v-2H8.53a.5.5 0 0 1-.48-.36L7.17 14z"
                        className="h-5 w-5 fill-current"
                      />
                      {isMutatingCart ? "Adding to Cart..." : isInStock ? "Add to Cart" : "Out of Stock"}
                    </button>
                    {cartError && (
                      <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{cartError}</p>
                    )}
                    {cartSuccess && (
                      <p className="rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700">
                        {cartSuccess}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-4 flex items-center justify-between gap-2">
                      <h2 className="font-semibold text-slate-900">Admin Controls</h2>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setIsEditMode(false)}
                          className={`h-8 rounded-lg px-3 text-xs font-semibold transition ${
                            !isEditMode
                              ? "bg-slate-900 text-white"
                              : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          Overview
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditMode(true)}
                          className={`h-8 rounded-lg px-3 text-xs font-semibold transition ${
                            isEditMode
                              ? "bg-slate-900 text-white"
                              : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          Edit
                        </button>
                      </div>
                    </div>

                    {!isEditMode ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            Pricing
                          </p>
                          <SpecRow label="Selling Price" value={formatMoney(price)} />
                          <SpecRow label="Max Price" value={formatMoney(maxPrice)} />
                          <SpecRow label="Discount" value={`${savePercentage}%`} />
                        </div>
                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            Inventory
                          </p>
                          <SpecRow label="Stock" value={product?.stockQuantity} />
                          <SpecRow label="GST" value={`${product?.gstPercentage}%`} />
                          <SpecRow label="Weight" value={`${product?.weightKg} kg`} />
                          <SpecRow label="Dimensions" value={`${product?.widthCm} × ${product?.heightCm} cm`} />
                        </div>
                      </div>
                    ) : (
                      <>
                        <form className="grid gap-3" onSubmit={handleUpdate}>
                          <label className="space-y-1">
                            <span className="text-xs font-semibold text-slate-600">Product Name</span>
                            <input
                              type="text"
                              name="name"
                              value={editForm.name}
                              onChange={handleEditChange}
                              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                              placeholder="Product name"
                              required
                            />
                          </label>
                          <label className="space-y-1">
                            <span className="text-xs font-semibold text-slate-600">Description</span>
                            <div className="mb-1 flex flex-wrap gap-1">
                              {["bold", "italic", "bullet", "number"].map((type) => (
                                <button
                                  key={type}
                                  type="button"
                                  onClick={() => applyDescriptionFormat(type)}
                                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold capitalize text-slate-600 hover:bg-slate-50"
                                >
                                  {type}
                                </button>
                              ))}
                            </div>
                            <textarea
                              ref={descriptionRef}
                              name="description"
                              value={editForm.description}
                              onChange={handleEditChange}
                              rows={3}
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                              placeholder="Product description"
                            />
                          </label>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {[
                              { name: "price", label: "Price", type: "number", min: "0", step: "0.01" },
                              { name: "maxPrice", label: "Max Price", type: "number", min: "0", step: "0.01" },
                              { name: "gstPercentage", label: "GST %", type: "number", min: "0", max: "100", step: "0.01" },
                              { name: "stockQuantity", label: "Stock", type: "number", min: "0", step: "1" },
                              { name: "widthCm", label: "Width (cm)", type: "number", min: "0", step: "0.01" },
                              { name: "heightCm", label: "Height (cm)", type: "number", min: "0", step: "0.01" },
                              { name: "weightKg", label: "Weight (kg)", type: "number", min: "0", step: "0.001" },
                            ].map((field) => (
                              <label key={field.name} className="space-y-1">
                                <span className="text-xs font-semibold text-slate-600">{field.label}</span>
                                <input
                                  type={field.type}
                                  name={field.name}
                                  value={editForm[field.name]}
                                  onChange={handleEditChange}
                                  min={field.min}
                                  max={field.max}
                                  step={field.step}
                                  className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500"
                                  required={["price", "gstPercentage", "stockQuantity", "widthCm", "heightCm", "weightKg"].includes(field.name)}
                                />
                              </label>
                            ))}
                            <label className="space-y-1">
                              <span className="text-xs font-semibold text-slate-600">Category</span>
                              <select
                                name="categoryId"
                                value={editForm.categoryId}
                                onChange={handleEditChange}
                                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500"
                              >
                                <option value="">
                                  {isLoadingCategories ? "Loading..." : "Select category"}
                                </option>
                                {categories.map((cat) => (
                                  <option key={cat.categoryId} value={cat.categoryId}>
                                    {cat.categoryName}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="space-y-1">
                              <span className="text-xs font-semibold text-slate-600">Product Tag</span>
                              <select
                                name="productTag"
                                value={editForm.productTag}
                                onChange={handleEditChange}
                                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500"
                              >
                                <option value="">No tag</option>
                                <option value="FLASH_SALES">Flash Sales</option>
                                <option value="TRENDING_PRODUCTS">Trending Products</option>
                              </select>
                            </label>
                          </div>
                          <label className="space-y-1">
                            <span className="text-xs font-semibold text-slate-600">Main Image Upload ID</span>
                            <input
                              type="text"
                              name="mainImageUploadId"
                              value={editForm.mainImageUploadId}
                              onChange={handleEditChange}
                              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500"
                              placeholder="Paste upload ID"
                            />
                          </label>
                          {success && (
                            <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                              {success}
                            </p>
                          )}
                          {error && (
                            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
                              {error}
                            </p>
                          )}
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setIsEditMode(false)}
                              className="h-10 flex-1 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={isUpdating}
                              className="h-10 flex-1 rounded-xl bg-slate-900 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
                            >
                              {isUpdating ? "Saving..." : "Save Changes"}
                            </button>
                          </div>
                        </form>

                        <div className="mt-4 border-t border-slate-100 pt-4">
                          <h3 className="mb-3 text-sm font-semibold text-slate-900">Upload Images</h3>
                          <form className="space-y-3" onSubmit={handleUploadImages}>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={handleFileChange}
                              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-blue-700"
                            />
                            <button
                              type="submit"
                              disabled={isUploading}
                              className="h-10 w-full rounded-xl bg-blue-600 text-sm font-semibold text-white disabled:opacity-60"
                            >
                              {isUploading ? "Uploading..." : "Upload Images"}
                            </button>
                          </form>

                          {(product?.images || []).length > 0 && (
                            <div className="mt-4">
                              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
                                Uploaded Images — click to set as main
                              </p>
                              <div className="grid grid-cols-3 gap-2">
                                {(product?.images || []).map((img) => (
                                  <button
                                    key={img.uploadId}
                                    type="button"
                                    onClick={() =>
                                      setEditForm((prev) => ({
                                        ...prev,
                                        mainImageUploadId: img.uploadId,
                                      }))
                                    }
                                    className={`overflow-hidden rounded-xl border-2 transition ${
                                      editForm.mainImageUploadId === img.uploadId
                                        ? "border-blue-500"
                                        : "border-transparent hover:border-slate-300"
                                    }`}
                                    title="Click to set as main image"
                                  >
                                    <img
                                      src={buildImageFileUrl(img.uploadId)}
                                      alt={img.filename || "Product image"}
                                      className="aspect-square w-full object-cover"
                                      loading="lazy"
                                    />
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Customer-only: product details */}
                {!isAdmin && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="mb-4 text-base font-bold text-slate-900">Product Details</h2>
                    <SpecRow label="Category" value={product.categoryName || "—"} />
                    <SpecRow label="Weight" value={`${product?.weightKg} kg`} />
                    <SpecRow
                      label="Dimensions"
                      value={`${product?.widthCm} × ${product?.heightCm} cm`}
                    />
                    <SpecRow label="GST" value={`${product.gstPercentage}%`} />
                    {tagLabel && <SpecRow label="Collection" value={tagLabel} />}
                    <SpecRow label="Added" value={formatDateTime(product.createdDt)} />
                  </div>
                )}

                {isAdmin && (
                  <p className="text-xs text-slate-400">
                    Created {formatDateTime(product.createdDt)} &middot; Updated {formatDateTime(product.modifiedDt)}
                  </p>
                )}
              </div>
            </div>

            {/* ── RELATED PRODUCTS ── */}
            {relatedProducts.length > 0 && (
              <section className="mt-14">
                <div className="mb-6">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-violet-500">
                    You may also like
                  </p>
                  <h2 className="text-2xl font-bold text-slate-900">Related Products</h2>
                </div>
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  {relatedProducts.map((item) => (
                    <ProductCard
                      key={`related-${item.productId}`}
                      product={item}
                      onAddToCart={addToCart}
                      isAddingToCart={isMutatingCart}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 py-16 text-center">
            <p className="text-slate-400">Product not found.</p>
            <button
              type="button"
              onClick={handleBack}
              className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Go Back
            </button>
          </div>
        )}
      </div>

      <footer className="mt-16 border-t border-slate-200 bg-white">
        <div className="px-4 py-5 text-center text-xs text-slate-400 md:px-6">
          &copy; {new Date().getFullYear()} Villpo Store. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default ProductDetailView;
