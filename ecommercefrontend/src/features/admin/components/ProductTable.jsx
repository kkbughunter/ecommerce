import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ENV from "../../../core/config/env";

const formatMoney = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const getStockBadgeClass = (stock) => {
  const qty = Number(stock || 0);
  if (qty <= 0) {
    return "bg-rose-100 text-rose-700";
  }
  if (qty <= 5) {
    return "bg-amber-100 text-amber-700";
  }
  return "bg-emerald-100 text-emerald-700";
};

const getTagBadgeClass = (tag) => {
  if (tag === "FLASH_SALES") {
    return "bg-orange-100 text-orange-700";
  }
  if (tag === "TRENDING_PRODUCTS") {
    return "bg-sky-100 text-sky-700";
  }
  return "bg-slate-100 text-slate-600";
};

const ProductTable = ({
  products,
  isLoading,
  pageMeta,
  onPrev,
  onNext,
  onNewProduct = () => {},
  readOnly = false,
  enableRowNavigation = false,
  updatingMaxPriceProductId = null,
  updatingTagProductId = null,
  onUpdateMaxPrice = () => {},
  onUpdateTag = () => {},
}) => {
  const navigate = useNavigate();
  const apiBase = ENV.API_BASE_URL?.replace(/\/+$/, "") || "";
  const [maxPriceDrafts, setMaxPriceDrafts] = useState({});
  const [tagDrafts, setTagDrafts] = useState({});

  useEffect(() => {
    const nextDrafts = {};
    products.forEach((product) => {
      if (product?.productId) {
        const effectiveMaxPrice = product?.maxPrice ?? product?.price ?? "";
        nextDrafts[product.productId] = String(effectiveMaxPrice);
      }
    });
    setMaxPriceDrafts(nextDrafts);

    const nextTagDrafts = {};
    products.forEach((product) => {
      if (product?.productId) {
        nextTagDrafts[product.productId] = product?.productTag || "";
      }
    });
    setTagDrafts(nextTagDrafts);
  }, [products]);

  const isRowNavigationEnabled = !readOnly || enableRowNavigation;

  const openProductDetails = (productId) => {
    if (!productId || !isRowNavigationEnabled) {
      return;
    }
    navigate(`/products/${productId}`);
  };

  const buildImageUrl = (product) => {
    if (!product?.productId || !product?.mainImageUploadId) {
      return null;
    }
    return `${apiBase}/products/${product.productId}/images/${product.mainImageUploadId}/file`;
  };

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-slate-900">Product List</h2>
        <div className="flex items-center gap-2">
          <p className="text-sm text-slate-600">
            Page {pageMeta.page + 1} of {Math.max(pageMeta.totalPages, 1)} | Total {pageMeta.totalElements}
          </p>
          {!readOnly ? (
            <button
              type="button"
              onClick={onNewProduct}
              className="h-9 rounded-lg bg-violet-600 px-3 text-sm font-semibold text-white hover:bg-violet-700"
            >
              + New Product
            </button>
          ) : null}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-[0.08em] text-slate-500">
              <th className="py-2 pr-3">Image</th>
              <th className="py-2 pr-3">Name</th>
              <th className="py-2 pr-3">Category</th>
              <th className="py-2 pr-3">Price</th>
              <th className="py-2 pr-3">Stock</th>
              <th className="py-2 pr-3">Tag</th>
              <th className="py-2 pr-3">Status</th>
              {!readOnly ? <th className="py-2 pr-3">Update Max Price</th> : null}
              {!readOnly ? <th className="py-2 pr-3">Action</th> : null}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={readOnly ? 7 : 9} className="py-6 text-center text-sm text-slate-500">
                  Loading products...
                </td>
              </tr>
            ) : products.length ? (
              products.map((product) => (
                <tr
                  key={product.productId}
                  className={`${isRowNavigationEnabled ? "cursor-pointer" : ""} border-b border-slate-100 text-sm text-slate-700 hover:bg-slate-50`}
                  onClick={() => openProductDetails(product.productId)}
                  title={isRowNavigationEnabled ? "Open product details" : undefined}
                >
                  <td className="py-3 pr-3">
                    {buildImageUrl(product) ? (
                      <img
                        src={buildImageUrl(product)}
                        alt={product?.name || "Product"}
                        className="aspect-square h-12 w-12 rounded-md border border-slate-200 object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex aspect-square h-12 w-12 items-center justify-center rounded-md border border-dashed border-slate-300 text-[10px] text-slate-400">
                        N/A
                      </div>
                    )}
                  </td>
                  <td className="py-3 pr-3">
                    <p className="max-w-[240px] truncate font-medium text-slate-900" title={product.name}>
                      {product.name}
                    </p>
                    <p
                      className="max-w-[240px] truncate text-xs text-slate-500"
                      title={product.description || ""}
                    >
                      {product.description || "-"}
                    </p>
                    <p className="text-xs text-slate-500">ID #{product.productId}</p>
                  </td>
                  <td className="py-3 pr-3">{product.categoryName || "-"}</td>
                  <td className="py-3 pr-3">
                    <p className="font-semibold text-emerald-700">{formatMoney(product.price)}</p>
                    {Number(product?.maxPrice || 0) > Number(product?.price || 0) && (
                      <p className="text-xs text-amber-700">
                        <span className="line-through">{formatMoney(product.maxPrice)}</span>
                        {" | "}
                        {Math.round(
                          ((Number(product.maxPrice) - Number(product.price)) / Number(product.maxPrice)) * 100,
                        )}
                        % off
                      </p>
                    )}
                  </td>
                  <td className="py-3 pr-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${getStockBadgeClass(product.stockQuantity)}`}>
                      {product.stockQuantity}
                    </span>
                  </td>
                  <td className="py-3 pr-3">
                    {readOnly ? (
                      <p className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${getTagBadgeClass(product?.productTag)}`}>
                        {product?.productTag === "FLASH_SALES"
                          ? "Flash Sales"
                          : product?.productTag === "TRENDING_PRODUCTS"
                            ? "Trending Products"
                            : "No tag"}
                      </p>
                    ) : (
                      <div className="space-y-2" onClick={(event) => event.stopPropagation()}>
                        <p className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${getTagBadgeClass(product?.productTag)}`}>
                          {product?.productTag === "FLASH_SALES"
                            ? "Flash Sales"
                            : product?.productTag === "TRENDING_PRODUCTS"
                              ? "Trending Products"
                              : "No tag"}
                        </p>
                        <div className="flex items-center gap-2">
                          <select
                            value={tagDrafts[product.productId] ?? ""}
                            onChange={(event) =>
                              setTagDrafts((prev) => ({
                                ...prev,
                                [product.productId]: event.target.value,
                              }))
                            }
                            className="h-8 rounded-md border border-slate-300 px-2 text-xs text-slate-700 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-100"
                          >
                            <option value="">No tag</option>
                            <option value="FLASH_SALES">Flash Sales</option>
                            <option value="TRENDING_PRODUCTS">Trending Products</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => onUpdateTag(product, tagDrafts[product.productId] ?? "")}
                            disabled={updatingTagProductId === product.productId}
                            className="h-8 rounded-md border border-violet-300 px-2 text-xs font-semibold text-violet-700 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {updatingTagProductId === product.productId ? "Saving..." : "Save"}
                          </button>
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="py-3 pr-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        product.isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {product.isActive ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </td>
                  {!readOnly ? (
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={maxPriceDrafts[product.productId] ?? ""}
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) =>
                            setMaxPriceDrafts((prev) => ({
                              ...prev,
                              [product.productId]: event.target.value,
                            }))
                          }
                          className="h-8 w-24 rounded-md border border-slate-300 px-2 text-xs text-slate-700 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-100"
                        />
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onUpdateMaxPrice(product, maxPriceDrafts[product.productId]);
                          }}
                          disabled={updatingMaxPriceProductId === product.productId}
                          className="h-8 rounded-md border border-violet-300 px-2 text-xs font-semibold text-violet-700 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {updatingMaxPriceProductId === product.productId ? "Saving..." : "Save"}
                        </button>
                      </div>
                    </td>
                  ) : null}
                  {!readOnly ? (
                    <td className="py-3 pr-3">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          openProductDetails(product.productId);
                        }}
                        className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        View / Edit
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={readOnly ? 7 : 9} className="py-6 text-center text-sm text-slate-500">
                  No products found for current search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={pageMeta.first}
          className="h-9 rounded-lg border border-slate-300 px-3 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Prev
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={pageMeta.last}
          className="h-9 rounded-lg border border-slate-300 px-3 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </article>
  );
};

export default ProductTable;

