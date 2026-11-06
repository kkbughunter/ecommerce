import { useEffect, useMemo, useState } from "react";
import categoryApi from "../../../core/api/categoryApi";
import getApiErrorMessage from "../../../core/utils/apiError";
import { getUserRoles } from "../../../core/auth/session";
import SingleImagePicker from "../components/SingleImagePicker";
import AdminRightPanel from "../components/AdminRightPanel";
import AdminConsoleLayout from "../components/AdminConsoleLayout";

const AdminCategoriesView = () => {
  const canUploadImage = getUserRoles().includes("SUPER_ADMIN");
  const [editingCategory, setEditingCategory] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
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
      const payload = Array.isArray(response?.data?.data)
        ? response.data.data
        : [];
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
      String(category?.categoryName || "")
        .toLowerCase()
        .includes(query),
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
      const payload = {
        categoryName,
        parentCategoryId: form.parentCategoryId
          ? Number(form.parentCategoryId)
          : null,
      };
      if (editingCategory) {
        await categoryApi.updateCategory(editingCategory.categoryId, payload, canUploadImage ? imageFile : null);
      } else {
        await categoryApi.createCategory(payload, canUploadImage ? imageFile : null);
      }
      setSuccess(editingCategory ? "Category updated successfully." : "Category created successfully.");
      setImageFile(null);
      setEditingCategory(null);
      setIsFormOpen(false);
      setForm({
        categoryName: "",
        parentCategoryId: "",
      });
      await loadCategories();
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to save category."));
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setImageFile(null);
    setForm({ categoryName: category.categoryName || "", parentCategoryId: category.parentCategoryId ?? "" });
    setError("");
    setSuccess("");
    setIsFormOpen(true);
  };

  const handleDelete = async (category) => {
    if (!category.canDelete || !window.confirm(`Delete category "${category.categoryName}"?`)) return;
    setIsCreatingCategory(true);
    setError("");
    setSuccess("");
    try {
      await categoryApi.deleteCategory(category.categoryId);
      if (editingCategory?.categoryId === category.categoryId) setIsFormOpen(false);
      setSuccess("Category deleted successfully.");
      await loadCategories();
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to delete category."));
    } finally { setIsCreatingCategory(false); }
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
        <>
          {canUploadImage && <button
            type="button"
            className="admin-primary"
            onClick={() => {
              setError("");
              setSuccess("");
              setEditingCategory(null);
              setImageFile(null);
              setForm({ categoryName: "", parentCategoryId: "" });
              setIsFormOpen(true);
            }}
          >
            + New Category
          </button>}
          <button
            type="button"
            onClick={loadCategories}
            className="h-10 rounded-xl border border-[#d8dde6] bg-white px-3 text-xs font-semibold text-[#334155]"
          >
            Refresh
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}
        {success ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {success}
          </div>
        ) : null}

        <section className="space-y-4">
          <article className="rounded-2xl border border-[#e2e6ee] bg-white p-3 sm:p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-[#111827]">
                Category List
              </h2>
              <p className="text-xs text-[#94a3b8]">
                {categories.length} total
              </p>
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
                      <th className="px-3 py-2">Products</th>
                      <th className="px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCategories.map((category) => (
                      <tr
                        key={category.categoryId}
                        className="border-b border-[#f1f5f9] text-sm text-[#334155]"
                      >
                        <td className="px-3 py-2">#{category.categoryId}</td>
                        <td className="px-3 py-2 font-medium text-[#111827]">
                          {category.categoryImageUrl && <img src={category.categoryImageUrl} alt="" className="mr-2 inline-block h-10 w-10 rounded-md object-cover" />}
                          {category.categoryName}
                        </td>
                        <td className="px-3 py-2">
                          {category.parentCategoryName || "-"}
                        </td>
                        <td className="px-3 py-2">{category.productCount ?? 0}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <button type="button" disabled={isCreatingCategory} onClick={() => handleEdit(category)} aria-label={`Edit ${category.categoryName}`} title="Edit category" className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 text-slate-700">
                              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m16 3 5 5-12 12H4v-5L16 3zM13 6l5 5" /></svg>
                            </button>
                            {category.canDelete === true && <button type="button" disabled={isCreatingCategory} onClick={() => handleDelete(category)} aria-label={`Delete ${category.categoryName}`} title="Delete category" className="flex h-8 w-8 items-center justify-center rounded-md border border-rose-300 text-rose-700">
                              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" /></svg>
                            </button>}
                          </div>
                        </td>
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
      <AdminRightPanel
        isOpen={isFormOpen}
        title={editingCategory ? "Edit Category" : "Create Category"}
        busy={isCreatingCategory}
        onClose={() => setIsFormOpen(false)}
      >
        {error && (
          <p role="alert" className="admin-feedback is-error">
            {error}
          </p>
        )}
        {success && (
          <p role="status" className="admin-feedback is-success">
            {success}
          </p>
        )}
        <article className="rounded-2xl border border-[#e2e6ee] bg-white p-3 sm:p-4">
          <h2 className="text-base font-semibold text-[#111827]">
            {editingCategory ? "Edit Category" : "Create Category"}
          </h2>
          <p className="mt-1 text-xs text-[#64748b]">
            {editingCategory ? "Update category details." : "Add a new category for products."}
          </p>

          <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">
                Category Name
              </span>
              <input
                type="text"
                value={form.categoryName}
                onChange={(event) => {
                  setForm((prev) => ({
                    ...prev,
                    categoryName: event.target.value,
                  }));
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
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">
                Parent Category
              </span>
              <select
                value={form.parentCategoryId}
                onChange={(event) => {
                  setForm((prev) => ({
                    ...prev,
                    parentCategoryId: event.target.value,
                  }));
                  if (error || success) {
                    setError("");
                    setSuccess("");
                  }
                }}
                className="h-10 w-full rounded-lg border border-[#d8dde6] bg-white px-3 text-sm text-[#334155] outline-none focus:border-[#94a3b8]"
              >
                <option value="">None</option>
                {categories.filter((category) => category.categoryId !== editingCategory?.categoryId).map((category) => (
                  <option key={category.categoryId} value={category.categoryId}>
                    {category.categoryName}
                  </option>
                ))}
              </select>
            </label>

            {canUploadImage && <SingleImagePicker file={imageFile} existingUrl={editingCategory?.categoryImageUrl} onChange={setImageFile} width={400} height={400} disabled={isCreatingCategory} />}

            <button
              type="submit"
              disabled={isCreatingCategory}
              className="h-10 rounded-lg bg-[#111827] px-4 text-sm font-semibold text-white disabled:opacity-50"
            >
              {isCreatingCategory ? "Saving..." : editingCategory ? "Save Category" : "Create Category"}
            </button>
          </form>
        </article>
      </AdminRightPanel>
    </AdminConsoleLayout>
  );
};

export default AdminCategoriesView;
