import { useNavigate } from "react-router-dom";
import { clearAuthSession } from "../../../core/auth/session";
import FullLayout from "../../../layouts/FullLayout";
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

  const handleLogout = () => {
    clearAuthSession();
    navigate("/login", { replace: true });
  };

  return (
    <FullLayout
      title="Add Product"
      subtitle="Create a new product using the same admin product setup."
      onLogout={handleLogout}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate("/admin", { replace: true })}
            className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700"
          >
            Back To Products
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {success}
          </div>
        )}

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
    </FullLayout>
  );
};

export default AdminCreateProductView;
