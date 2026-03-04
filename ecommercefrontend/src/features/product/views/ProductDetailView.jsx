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
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    price: "",
    gstPercentage: "",
    stockQuantity: "",
    categoryId: "",
    mainImageUploadId: "",
  });

  const imageUrl = useMemo(() => {
    if (!product?.productId || !product?.mainImageUploadId) {
      return null;
    }
    const base = ENV.API_BASE_URL?.replace(/\/+$/, "") || "";
    return `${base}/products/${product.productId}/images/${product.mainImageUploadId}/file`;
  }, [product?.mainImageUploadId, product?.productId]);

  const syncProductState = (data) => {
    setProduct(data);
    setEditForm({
      name: data?.name || "",
      description: data?.description || "",
      price: data?.price ?? "",
      gstPercentage: data?.gstPercentage ?? "",
      stockQuantity: data?.stockQuantity ?? "",
      categoryId: data?.categoryId ?? "",
      mainImageUploadId: data?.mainImageUploadId || "",
    });
  };

  const loadProduct = useCallback(async ({ withLoader = false } = {}) => {
    if (withLoader) {
      setIsLoading(true);
    }
    try {
      const response = await productApi.getProductDetails(productId);
      const data = response?.data?.data || null;
      syncProductState(data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to load product details."));
    } finally {
      if (withLoader) {
        setIsLoading(false);
      }
    }
  }, [productId]);

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
        gstPercentage: Number(editForm.gstPercentage),
        stockQuantity: Number(editForm.stockQuantity),
        categoryId: editForm.categoryId ? Number(editForm.categoryId) : null,
        mainImageUploadId: editForm.mainImageUploadId.trim() || null,
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

  const buildImageFileUrl = (uploadId) => {
    const base = ENV.API_BASE_URL?.replace(/\/+$/, "") || "";
    return `${base}/products/${productId}/images/${uploadId}/file`;
  };

  return (
    <main className="min-h-screen bg-slate-50 px-2 py-4 md:px-3">
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
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
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
            Product Details
          </p>
        </div>

        {isLoading ? (
          <p className="text-sm text-slate-500">Loading product details...</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : product ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <article className="space-y-4">
              <div className="h-72 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500">
                    No main image
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <h1 className="text-2xl font-semibold text-slate-900">{product.name}</h1>
                <p className="text-sm text-slate-600">{product.description || "-"}</p>
                <p className="text-sm text-slate-600">
                  Category: <span className="font-medium">{product.categoryName || "-"}</span>
                </p>
                <p className="text-lg font-bold text-slate-900">{formatMoney(product.price)}</p>
                <p className="text-sm text-slate-600">
                  GST {product.gstPercentage}% • Stock {product.stockQuantity}
                </p>
              </div>
            </article>

            {isAdmin ? (
              <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h2 className="text-base font-semibold text-slate-900">Update Product</h2>
                <form className="mt-4 grid gap-3" onSubmit={handleUpdate}>
                  <input
                    type="text"
                    name="name"
                    value={editForm.name}
                    onChange={handleEditChange}
                    className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
                    placeholder="Name"
                    required
                  />
                  <textarea
                    name="description"
                    value={editForm.description}
                    onChange={handleEditChange}
                    rows={3}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Description"
                  />
                  <div className="grid gap-3 md:grid-cols-2">
                    <input
                      type="number"
                      name="price"
                      value={editForm.price}
                      onChange={handleEditChange}
                      min="0"
                      step="0.01"
                      className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
                      placeholder="Price"
                      required
                    />
                    <input
                      type="number"
                      name="gstPercentage"
                      value={editForm.gstPercentage}
                      onChange={handleEditChange}
                      min="0"
                      max="100"
                      step="0.01"
                      className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
                      placeholder="GST %"
                      required
                    />
                    <input
                      type="number"
                      name="stockQuantity"
                      value={editForm.stockQuantity}
                      onChange={handleEditChange}
                      min="0"
                      step="1"
                      className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
                      placeholder="Stock"
                      required
                    />
                    <input
                      type="number"
                      name="categoryId"
                      value={editForm.categoryId}
                      onChange={handleEditChange}
                      min="1"
                      step="1"
                      className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
                      placeholder="Category ID"
                    />
                  </div>
                  <input
                    type="text"
                    name="mainImageUploadId"
                    value={editForm.mainImageUploadId}
                    onChange={handleEditChange}
                    className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
                    placeholder="Main Image Upload ID"
                  />
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
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="block w-full text-sm text-slate-700"
                  />
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="h-10 rounded-lg bg-blue-700 px-3 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {isUploading ? "Uploading..." : "Upload Images"}
                  </button>
                </form>

                <div className="mt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                    Uploaded Images
                  </p>
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
                          className="h-24 w-full rounded object-cover"
                          loading="lazy"
                        />
                        <p className="mt-1 truncate text-xs text-slate-600">{image.uploadId}</p>
                      </button>
                    ))}
                    {!product?.images?.length && (
                      <p className="text-sm text-slate-500">No uploaded images yet.</p>
                    )}
                  </div>
                </div>
              </article>
            ) : (
              <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h2 className="text-base font-semibold text-slate-900">Product Info</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Created: {product.createdDt || "-"}
                </p>
                <p className="text-sm text-slate-600">
                  Last modified: {product.modifiedDt || "-"}
                </p>
                <p className="text-sm text-slate-600">
                  Main Image Upload ID: {product.mainImageUploadId || "-"}
                </p>
              </article>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Product not found.</p>
        )}
      </section>
    </main>
  );
};

export default ProductDetailView;
