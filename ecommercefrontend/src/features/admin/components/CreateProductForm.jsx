const CreateProductForm = ({
  form,
  categories,
  isLoadingCategories,
  isCreatingProduct,
  onChange,
  onSubmit,
}) => {
  return (
    <article className="rounded-xl border border-violet-100 bg-violet-50/40 p-4">
      <h2 className="text-base font-semibold text-slate-900">Create Product</h2>
      <p className="mt-1 text-sm text-slate-600">
        Add a product to your catalog.
      </p>

      <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
        <label className="space-y-1 md:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-violet-700">
            Product Name
          </span>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={onChange}
            placeholder="Enter product name"
            className="h-10 w-full rounded-lg border border-violet-100 bg-white px-3 text-sm text-slate-700 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            required
          />
        </label>

        <label className="space-y-1 md:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-violet-700">
            Description
          </span>
          <textarea
            name="description"
            value={form.description}
            onChange={onChange}
            rows={3}
            placeholder="Enter product description"
            className="w-full rounded-lg border border-violet-100 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-violet-700">
            Price
          </span>
          <input
            type="number"
            name="price"
            value={form.price}
            onChange={onChange}
            min="0"
            step="0.01"
            placeholder="0.00"
            className="h-10 w-full rounded-lg border border-violet-100 bg-white px-3 text-sm text-slate-700 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            required
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-violet-700">
            GST %
          </span>
          <input
            type="number"
            name="gstPercentage"
            value={form.gstPercentage}
            onChange={onChange}
            min="0"
            max="100"
            step="0.01"
            placeholder="0.00"
            className="h-10 w-full rounded-lg border border-violet-100 bg-white px-3 text-sm text-slate-700 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            required
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-violet-700">
            Stock Quantity
          </span>
          <input
            type="number"
            name="stockQuantity"
            value={form.stockQuantity}
            onChange={onChange}
            min="0"
            step="1"
            placeholder="0"
            className="h-10 w-full rounded-lg border border-violet-100 bg-white px-3 text-sm text-slate-700 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            required
          />
        </label>

        <label className="space-y-1 md:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-violet-700">
            Main Image Upload ID
          </span>
          <input
            type="text"
            name="mainImageUploadId"
            value={form.mainImageUploadId}
            onChange={onChange}
            placeholder="Paste upload id from product image upload"
            className="h-10 w-full rounded-lg border border-violet-100 bg-white px-3 text-sm text-slate-700 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
          />
          <p className="text-xs text-slate-500">
            This must be an active image upload id for this same product.
          </p>
        </label>

        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-violet-700">
            Max Price
          </span>
          <input
            type="number"
            name="maxPrice"
            value={form.maxPrice}
            onChange={onChange}
            min="0"
            step="0.01"
            placeholder="0.00"
            className="h-10 w-full rounded-lg border border-violet-100 bg-white px-3 text-sm text-slate-700 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-violet-700">
            Category
          </span>
          <select
            name="categoryId"
            value={form.categoryId}
            onChange={onChange}
            className="h-10 w-full rounded-lg border border-violet-100 bg-white px-3 text-sm text-slate-700 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
          >
            <option value="">
              {isLoadingCategories ? "Loading categories..." : "Select category"}
            </option>
            {categories.map((category) => (
              <option key={category.categoryId} value={category.categoryId}>
                {category.categoryName}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 pt-5">
          <input
            type="checkbox"
            name="isActive"
            checked={form.isActive}
            onChange={onChange}
            className="h-4 w-4"
          />
          <span className="text-sm font-medium text-slate-700">Active product</span>
        </label>

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={isCreatingProduct}
            className="h-10 rounded-lg bg-gradient-to-r from-violet-500 to-blue-600 px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCreatingProduct ? "Creating..." : "Create Product"}
          </button>
        </div>
      </form>
    </article>
  );
};

export default CreateProductForm;
