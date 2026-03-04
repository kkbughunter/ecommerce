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
              <th className="py-2 pr-3">Name</th>
              <th className="py-2 pr-3">Category</th>
              <th className="py-2 pr-3">Price</th>
              <th className="py-2 pr-3">Stock</th>
              <th className="py-2 pr-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-sm text-slate-500">
                  Loading products...
                </td>
              </tr>
            ) : products.length ? (
              products.map((product) => (
                <tr
                  key={product.productId}
                  className="border-b border-slate-100 text-sm text-slate-700"
                >
                  <td className="py-3 pr-3">
                    <p className="font-medium text-slate-900">{product.name}</p>
                    <p className="text-xs text-slate-500">ID #{product.productId}</p>
                  </td>
                  <td className="py-3 pr-3">{product.categoryName || "-"}</td>
                  <td className="py-3 pr-3">{formatMoney(product.price)}</td>
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
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-6 text-center text-sm text-slate-500">
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
