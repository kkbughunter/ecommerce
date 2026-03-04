import { useRef } from "react";

const CreateProductForm = ({
  form,
  categories,
  isLoadingCategories,
  isCreatingProduct,
  createFiles,
  onFilesChange,
  onChange,
  onSubmit,
}) => {
  const descriptionRef = useRef(null);
  const price = Number(form.price || 0);
  const maxPrice = Number(form.maxPrice || form.price || 0);
  const savePercentage =
    maxPrice > price && maxPrice > 0 ? Math.round(((maxPrice - price) / maxPrice) * 100) : 0;

  const updateDescription = (nextValue) => {
    onChange({
      target: {
        name: "description",
        value: nextValue,
        type: "text",
      },
    });
  };

  const applyDescriptionFormat = (type) => {
    const input = descriptionRef.current;
    if (!input) {
      return;
    }

    const current = form.description || "";
    const start = input.selectionStart ?? current.length;
    const end = input.selectionEnd ?? current.length;
    const selected = current.slice(start, end);

    let formatted = selected;
    if (type === "bold") {
      formatted = `**${selected || "text"}**`;
    } else if (type === "italic") {
      formatted = `*${selected || "text"}*`;
    } else if (type === "bullet") {
      formatted = `- ${selected || "item"}`;
    } else if (type === "number") {
      formatted = `1. ${selected || "item"}`;
    }

    const nextValue = `${current.slice(0, start)}${formatted}${current.slice(end)}`;
    updateDescription(nextValue);

    requestAnimationFrame(() => {
      input.focus();
      const caret = start + formatted.length;
      input.setSelectionRange(caret, caret);
    });
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Add Product</h2>
          <p className="mt-1 text-sm text-slate-600">Create a product with pricing, tax, and stock details.</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
          {savePercentage > 0 ? `Current offer: Save ${savePercentage}%` : "No discount set"}
        </div>
      </div>

      <form className="mt-5 space-y-4" onSubmit={onSubmit}>
        <section className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 md:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-700">Product Name</span>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={onChange}
              placeholder="Enter product name"
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              required
            />
          </label>

          <label className="space-y-1 md:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-700">Description</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => applyDescriptionFormat("bold")}
                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
              >
                Bold
              </button>
              <button
                type="button"
                onClick={() => applyDescriptionFormat("italic")}
                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
              >
                Italic
              </button>
              <button
                type="button"
                onClick={() => applyDescriptionFormat("bullet")}
                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
              >
                Bullet
              </button>
              <button
                type="button"
                onClick={() => applyDescriptionFormat("number")}
                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
              >
                Number
              </button>
            </div>
            <textarea
              ref={descriptionRef}
              name="description"
              value={form.description}
              onChange={onChange}
              rows={3}
              placeholder="Enter product description"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <p className="text-xs text-slate-500">Supports basic markdown-style text formatting.</p>
          </label>
        </section>

        <section className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">Pricing & Inventory</p>
          <div className="grid gap-3 md:grid-cols-4">
            <label className="space-y-1">
              <span className="text-xs font-semibold text-slate-700">Selling Price</span>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={onChange}
                min="0"
                step="0.01"
                placeholder="0.00"
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                required
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold text-slate-700">Max Price</span>
              <input
                type="number"
                name="maxPrice"
                value={form.maxPrice}
                onChange={onChange}
                min="0"
                step="0.01"
                placeholder="0.00"
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold text-slate-700">GST %</span>
              <input
                type="number"
                name="gstPercentage"
                value={form.gstPercentage}
                onChange={onChange}
                min="0"
                max="100"
                step="0.01"
                placeholder="0.00"
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                required
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold text-slate-700">Stock Qty</span>
              <input
                type="number"
                name="stockQuantity"
                value={form.stockQuantity}
                onChange={onChange}
                min="0"
                step="1"
                placeholder="0"
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                required
              />
            </label>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-700">Category</span>
            <select
              name="categoryId"
              value={form.categoryId}
              onChange={onChange}
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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

          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-700">Product Tag</span>
            <select
              name="productTag"
              value={form.productTag}
              onChange={onChange}
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">No tag</option>
              <option value="FLASH_SALES">Flash Sales</option>
              <option value="TRENDING_PRODUCTS">Trending Products</option>
            </select>
          </label>

          <label className="space-y-1 md:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-700">Upload Product Images</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={onFilesChange}
              className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
            />
            <p className="text-xs text-slate-500">
              On create, images upload automatically and first image becomes main image.
              {createFiles?.length ? ` Selected: ${createFiles.length} file(s).` : ""}
            </p>
          </label>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isActive"
              checked={form.isActive}
              onChange={onChange}
              className="h-4 w-4"
            />
            <span className="text-sm font-medium text-slate-700">Active product</span>
          </label>

          <button
            type="submit"
            disabled={isCreatingProduct}
            className="h-10 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCreatingProduct ? "Creating..." : "Create Product"}
          </button>
        </div>
      </form>
    </article>
  );
};

export default CreateProductForm;
