import { useNavigate } from "react-router-dom";
import AdminConsoleLayout from "../components/AdminConsoleLayout";
import CreateProductForm from "../components/CreateProductForm";
import useAdminDashboard from "../hooks/useAdminDashboard";

const AdminCreateProductView = () => {
  const navigate = useNavigate();
  const {
    categories,
    createForm,
    isLoadingCategories,
    isCreatingProduct,
    createFiles,
    error,
    success,
    handleCreateFormChange,
    handleCreateFilesChange,
    createProduct,
  } = useAdminDashboard();

  return (
    <AdminConsoleLayout
      activeNav="products"
      title="Add Product"
      subtitle="Create a new product with multiple images and pricing details."
      topActions={
        <button
          type="button"
          onClick={() => navigate("/admin")}
          className="h-10 rounded-xl border border-[#d8dde6] bg-white px-3 text-xs font-semibold text-[#334155]"
        >
          Back To Dashboard
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

        <div className="rounded-2xl border border-[#e2e6ee] bg-white p-4">
          <CreateProductForm
            form={createForm}
            categories={categories}
            isLoadingCategories={isLoadingCategories}
            isCreatingProduct={isCreatingProduct}
            createFiles={createFiles}
            onFilesChange={handleCreateFilesChange}
            onChange={handleCreateFormChange}
            onSubmit={createProduct}
          />
        </div>
      </div>
    </AdminConsoleLayout>
  );
};

export default AdminCreateProductView;
