import { useEffect, useMemo, useState } from "react";
import categoryApi from "../../../core/api/categoryApi";
import getApiErrorMessage from "../../../core/utils/apiError";
import AdminConsoleLayout from "../components/AdminConsoleLayout";

const AdminCategoriesView = () => {
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    categoryName: "",
    parentCategoryId: "",
  });
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadCategories = async () => {
    setIsLoadingCategories(true);
    setError("");
    try {
      const response = await categoryApi.getAllCategories();
      const payload = Array.isArray(response?.data?.data) ? response.data.data : [];
      setCategories(payload);
    } catch (err) {
      setCategories([]);
      setError(getApiErrorMessage(err, "Unable to load categories."));
    } finally {
      setIsLoadingCategories(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return categories;
    }
    return categories.filter((category) =>
      String(category?.categoryName || "").toLowerCase().includes(query),
    );
  }, [categories, search]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const categoryName = form.categoryName.trim();
    if (!categoryName) {
      setError("Category name is required.");
      setSuccess("");
      return;
    }

    setIsCreatingCategory(true);
    setError("");
    setSuccess("");
    try {
      await categoryApi.createCategory({
        categoryName,
        parentCategoryId: form.parentCategoryId ? Number(form.parentCategoryId) : null,
      });
      setSuccess("Category created successfully.");
      setForm({
        categoryName: "",
        parentCategoryId: "",
      });
      await loadCategories();
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to create category."));
    } finally {
      setIsCreatingCategory(false);
    }
  };

  return (
    <AdminConsoleLayout
      activeNav="categories"
      title="Categories"
      subtitle="Create product categories and manage parent-child hierarchy."
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search categories..."
      topActions={
        <button
          type="button"
          onClick={loadCategories}
          className="h-10 rounded-xl border border-[#d8dde6] bg-white px-3 text-xs font-semibold text-[#334155]"
        >
          Refresh
        </button>
      }
    >
      <div className="space-y-4">
        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        ) : null}
        {success ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {success}
          </div>
        ) : null}

        <section className="grid gap-4 xl:grid-cols-[1fr_1.4fr]">
          <article className="rounded-2xl border border-[#e2e6ee] bg-white p-4">
            <h2 className="text-base font-semibold text-[#111827]">Create Category</h2>
            <p className="mt-1 text-xs text-[#64748b]">Add a new category for products.</p>

            <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">Category Name</span>
                <input
                  type="text"
                  value={form.categoryName}
                  onChange={(event) => {
                    setForm((prev) => ({ ...prev, categoryName: event.target.value }));
                    if (error || success) {
                      setError("");
                      setSuccess("");
                    }
                  }}
                  placeholder="Enter category name"
                  className="h-10 w-full rounded-lg border border-[#d8dde6] bg-white px-3 text-sm text-[#334155] outline-none focus:border-[#94a3b8]"
                />
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">Parent Category</span>
                <select
                  value={form.parentCategoryId}
                  onChange={(event) => {
                    setForm((prev) => ({ ...prev, parentCategoryId: event.target.value }));
                    if (error || success) {
                      setError("");
                      setSuccess("");
                    }
                  }}
                  className="h-10 w-full rounded-lg border border-[#d8dde6] bg-white px-3 text-sm text-[#334155] outline-none focus:border-[#94a3b8]"
                >
                  <option value="">None</option>
                  {categories.map((category) => (
                    <option key={category.categoryId} value={category.categoryId}>
                      {category.categoryName}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="submit"
                disabled={isCreatingCategory}
                className="h-10 rounded-lg bg-[#111827] px-4 text-sm font-semibold text-white disabled:opacity-50"
              >
                {isCreatingCategory ? "Creating..." : "Create Category"}
              </button>
            </form>
          </article>

          <article className="rounded-2xl border border-[#e2e6ee] bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#111827]">Category List</h2>
              <p className="text-xs text-[#94a3b8]">{categories.length} total</p>
            </div>

            {isLoadingCategories ? (
              <p className="text-sm text-[#64748b]">Loading categories...</p>
            ) : filteredCategories.length ? (
              <div className="overflow-x-auto rounded-xl border border-[#edf0f3]">
                <table className="min-w-full border-collapse bg-white">
                  <thead>
                    <tr className="border-b border-[#edf0f3] text-left text-xs uppercase tracking-[0.08em] text-[#94a3b8]">
                      <th className="px-3 py-2">ID</th>
                      <th className="px-3 py-2">Category</th>
                      <th className="px-3 py-2">Parent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCategories.map((category) => (
                      <tr key={category.categoryId} className="border-b border-[#f1f5f9] text-sm text-[#334155]">
                        <td className="px-3 py-2">#{category.categoryId}</td>
                        <td className="px-3 py-2 font-medium text-[#111827]">{category.categoryName}</td>
                        <td className="px-3 py-2">{category.parentCategoryName || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-[#64748b]">No categories found.</p>
            )}
          </article>
        </section>
      </div>
    </AdminConsoleLayout>
  );
};

export default AdminCategoriesView;
