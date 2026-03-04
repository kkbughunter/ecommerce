import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import productApi from "../../../core/api/productApi";
import { clearAuthSession, getHomePathByRole, hasAnyRole } from "../../../core/auth/session";
import ENV from "../../../core/config/env";
import getApiErrorMessage from "../../../core/utils/apiError";

const formatMoney = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const getTagLabel = (tag) => {
  if (tag === "FLASH_SALES") {
    return "Flash Sales";
  }
  if (tag === "TRENDING_PRODUCTS") {
    return "Trending Products";
  }
  return "No tag";
};

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
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    price: "",
    maxPrice: "",
    gstPercentage: "",
    stockQuantity: "",
    categoryId: "",
    mainImageUploadId: "",
    productTag: "",
  });

  const buildImageFileUrl = useCallback(
    (uploadId) => {
      const base = ENV.API_BASE_URL?.replace(/\/+$/, "") || "";
      return `${base}/products/${productId}/images/${uploadId}/file`;
    },
    [productId],
  );

  const galleryImages = useMemo(() => {
    if (!product?.productId) {
      return [];
    }

    const images = Array.isArray(product?.images) ? product.images : [];
    const existingIds = new Set(images.map((image) => image?.uploadId).filter(Boolean));

    const normalized = images
      .filter((image) => Boolean(image?.uploadId))
      .map((image) => ({
        uploadId: image.uploadId,
        filename: image?.filename || "Product image",
        url: buildImageFileUrl(image.uploadId),
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
      categoryId: data?.categoryId ?? "",
      mainImageUploadId: data?.mainImageUploadId || "",
      productTag: data?.productTag || "",
    });
  };

  const loadProduct = useCallback(
    async ({ withLoader = false } = {}) => {
      if (withLoader) {
        setIsLoading(true);
      }
      try {
        const response = await productApi.getProductDetails(productId);
        syncProductState(response?.data?.data || null);
      } catch (err) {
        setError(getApiErrorMessage(err, "Unable to load product details."));
      } finally {
        if (withLoader) {
          setIsLoading(false);
        }
      }
    },
    [productId],
  );

  useEffect(() => {
    loadProduct({ withLoader: true });
  }, [loadProduct]);

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
        categoryId: editForm.categoryId ? Number(editForm.categoryId) : null,
        mainImageUploadId: editForm.mainImageUploadId.trim() || null,
        productTag: editForm.productTag || null,
      };
      await productApi.updateProduct(productId, payload);
      setSuccess("Product updated successfully.");
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

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#eef2ff_0%,#f8fafc_52%,#f5f7fb_100%)] px-2 py-4 md:px-3">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleBack}
              className="h-9 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="h-9 rounded-lg bg-slate-900 px-3 text-sm font-medium text-white"
            >
              Logout
            </button>
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Product Details</p>
        </div>

        {isLoading ? (
          <p className="text-sm text-slate-500">Loading product details...</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : product ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <article>
              <div className="space-y-2">
                <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                  {activeImage ? (
                    <img
                      src={activeImage.url}
                      alt={activeImage.filename || product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-500">No main image</div>
                  )}

                  {hasMultipleImages && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedImageIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1))
                        }
                        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/55 px-2 py-1 text-xs font-semibold text-white"
                      >
                        Prev
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedImageIndex((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1))
                        }
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/55 px-2 py-1 text-xs font-semibold text-white"
                      >
                        Next
                      </button>
                      <p className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-1 text-[10px] font-semibold text-white">
                        {selectedImageIndex + 1}/{galleryImages.length}
                      </p>
                    </>
                  )}
                </div>

                {hasMultipleImages && (
                  <div className="grid grid-cols-5 gap-2">
                    {galleryImages.map((image, index) => (
                      <button
                        key={image.uploadId}
                        type="button"
                        onClick={() => setSelectedImageIndex(index)}
                        className={`overflow-hidden rounded-lg border ${
                          index === selectedImageIndex ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-200"
                        }`}
                      >
                        <img
                          src={image.url}
                          alt={image.filename || `Product image ${index + 1}`}
                          className="aspect-square w-full object-cover"
                          loading="lazy"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </article>

            <div className="space-y-4">
              <article className="rounded-2xl border border-[#dbe5ff] bg-[linear-gradient(135deg,#f8fbff,#eef4ff)] p-5 shadow-[0_10px_24px_rgba(59,130,246,0.12)]">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <h1 className="text-2xl font-semibold text-slate-900">{product.name}</h1>
                  <span className="rounded-full border border-[#bfdbfe] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#1d4ed8]">
                    {getTagLabel(product?.productTag)}
                  </span>
                </div>
                <p className="text-sm text-slate-600">{product.description || "-"}</p>
                <p className="mt-2 text-sm text-slate-600">
                  Category: <span className="font-medium">{product.categoryName || "-"}</span>
                </p>
                <div className="mt-3 flex items-baseline gap-2">
                  <p className="text-xl font-bold text-slate-900">{formatMoney(price)}</p>
                  {maxPrice > price && <p className="text-sm text-slate-500 line-through">{formatMoney(maxPrice)}</p>}
                </div>
                {maxPrice > price && <p className="mt-1 text-sm font-semibold text-emerald-600">Save {savePercentage}%</p>}
                <p className="mt-1 text-sm text-slate-600">GST {product.gstPercentage}% | Stock {product.stockQuantity}</p>
              </article>

              {isAdmin ? (
                <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h2 className="text-base font-semibold text-slate-900">Update Product</h2>
                  <form className="mt-4 grid gap-3" onSubmit={handleUpdate}>
                    <label className="space-y-1">
                      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-700">Product Name</span>
                      <input
                        type="text"
                        name="name"
                        value={editForm.name}
                        onChange={handleEditChange}
                        className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                        placeholder="Enter product name"
                        required
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-700">Description</span>
                      <textarea
                        name="description"
                        value={editForm.description}
                        onChange={handleEditChange}
                        rows={3}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        placeholder="Enter product description"
                      />
                    </label>
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="space-y-1">
                        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-700">Price</span>
                        <input
                          type="number"
                          name="price"
                          value={editForm.price}
                          onChange={handleEditChange}
                          min="0"
                          step="0.01"
                          className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                          placeholder="0.00"
                          required
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-700">Max Price</span>
                        <input
                          type="number"
                          name="maxPrice"
                          value={editForm.maxPrice}
                          onChange={handleEditChange}
                          min="0"
                          step="0.01"
                          className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                          placeholder="0.00"
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-700">GST %</span>
                        <input
                          type="number"
                          name="gstPercentage"
                          value={editForm.gstPercentage}
                          onChange={handleEditChange}
                          min="0"
                          max="100"
                          step="0.01"
                          className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                          placeholder="0.00"
                          required
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-700">Stock Quantity</span>
                        <input
                          type="number"
                          name="stockQuantity"
                          value={editForm.stockQuantity}
                          onChange={handleEditChange}
                          min="0"
                          step="1"
                          className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                          placeholder="0"
                          required
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-700">Category ID</span>
                        <input
                          type="number"
                          name="categoryId"
                          value={editForm.categoryId}
                          onChange={handleEditChange}
                          min="1"
                          step="1"
                          className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                          placeholder="Category ID"
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-700">Product Tag</span>
                        <select
                          name="productTag"
                          value={editForm.productTag}
                          onChange={handleEditChange}
                          className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                        >
                          <option value="">No tag</option>
                          <option value="FLASH_SALES">Flash Sales</option>
                          <option value="TRENDING_PRODUCTS">Trending Products</option>
                        </select>
                      </label>
                    </div>
                    <label className="space-y-1">
                      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-700">Main Image Upload ID</span>
                      <input
                        type="text"
                        name="mainImageUploadId"
                        value={editForm.mainImageUploadId}
                        onChange={handleEditChange}
                        className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                        placeholder="Paste upload id from product image upload"
                      />
                    </label>
                    {success && <p className="text-sm text-emerald-600">{success}</p>}
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <button
                      type="submit"
                      disabled={isUpdating}
                      className="h-10 rounded-lg bg-slate-900 px-3 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {isUpdating ? "Updating..." : "Update Product"}
                    </button>
                  </form>

                  <hr className="my-4 border-slate-200" />
                  <h3 className="text-sm font-semibold text-slate-900">Upload Product Images</h3>
                  <form className="mt-3 space-y-3" onSubmit={handleUploadImages}>
                    <input type="file" accept="image/*" multiple onChange={handleFileChange} className="block w-full text-sm text-slate-700" />
                    <button
                      type="submit"
                      disabled={isUploading}
                      className="h-10 rounded-lg bg-blue-700 px-3 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {isUploading ? "Uploading..." : "Upload Images"}
                    </button>
                  </form>

                  <div className="mt-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Uploaded Images</p>
                    <div className="grid gap-2 md:grid-cols-2">
                      {(product?.images || []).map((image) => (
                        <button
                          key={image.uploadId}
                          type="button"
                          onClick={() =>
                            setEditForm((prev) => ({
                              ...prev,
                              mainImageUploadId: image.uploadId,
                            }))
                          }
                          className="rounded-lg border border-slate-200 bg-white p-2 text-left hover:border-blue-400"
                          title="Click to set as main image id in update form"
                        >
                          <img
                            src={buildImageFileUrl(image.uploadId)}
                            alt={image.filename || "Product image"}
                            className="aspect-square w-full rounded object-cover"
                            loading="lazy"
                          />
                          <p className="mt-1 truncate text-xs text-slate-600">{image.uploadId}</p>
                        </button>
                      ))}
                      {!product?.images?.length && <p className="text-sm text-slate-500">No uploaded images yet.</p>}
                    </div>
                  </div>
                </article>
              ) : (
                <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h2 className="text-base font-semibold text-slate-900">Product Info</h2>
                  <p className="mt-2 text-sm text-slate-600">Created: {product.createdDt || "-"}</p>
                  <p className="text-sm text-slate-600">Last modified: {product.modifiedDt || "-"}</p>
                  <p className="text-sm text-slate-600">Main Image Upload ID: {product.mainImageUploadId || "-"}</p>
                  <p className="text-sm text-slate-600">Tag: {getTagLabel(product?.productTag)}</p>
                </article>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Product not found.</p>
        )}
      </section>
    </main>
  );
};

export default ProductDetailView;
