import { useNavigate } from "react-router-dom";
import ENV from "../../../core/config/env";

const formatMoney = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const ProductTable = ({
  products,
  isLoading,
  pageMeta,
  onPrev,
  onNext,
}) => {
  const navigate = useNavigate();
  const apiBase = ENV.API_BASE_URL?.replace(/\/+$/, "") || "";

  const openProductDetails = (productId) => {
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
        <p className="text-sm text-slate-600">
          Page {pageMeta.page + 1} of {Math.max(pageMeta.totalPages, 1)} | Total {pageMeta.totalElements}
        </p>
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
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-sm text-slate-500">
                  Loading products...
                </td>
              </tr>
            ) : products.length ? (
              products.map((product) => (
                <tr
                  key={product.productId}
                  className="cursor-pointer border-b border-slate-100 text-sm text-slate-700 hover:bg-slate-50"
                  onClick={() => openProductDetails(product.productId)}
                >
                  <td className="py-3 pr-3">
                    {buildImageUrl(product) ? (
                      <img
                        src={buildImageUrl(product)}
                        alt={product?.name || "Product"}
                        className="h-12 w-12 rounded-md border border-slate-200 object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-md border border-dashed border-slate-300 text-[10px] text-slate-400">
                        N/A
                      </div>
                    )}
                  </td>
                  <td className="py-3 pr-3">
                    <p className="font-medium text-slate-900">{product.name}</p>
                    <p className="text-xs text-slate-500">ID #{product.productId}</p>
                  </td>
                  <td className="py-3 pr-3">{product.categoryName || "-"}</td>
                  <td className="py-3 pr-3">
                    <p className="font-medium text-slate-900">{formatMoney(product.price)}</p>
                    {Number(product?.maxPrice || 0) > Number(product?.price || 0) && (
                      <p className="text-xs text-slate-500">
                        <span className="line-through">{formatMoney(product.maxPrice)}</span>
                        {" • "}
                        {Math.round(
                          ((Number(product.maxPrice) - Number(product.price)) / Number(product.maxPrice)) * 100,
                        )}
                        % off
                      </p>
                    )}
                  </td>
                  <td className="py-3 pr-3">{product.stockQuantity}</td>
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
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-6 text-center text-sm text-slate-500">
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
