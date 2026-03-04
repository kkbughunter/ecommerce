import { useCallback, useEffect, useMemo, useState } from "react";
import categoryApi from "../../../core/api/categoryApi";
import productApi from "../../../core/api/productApi";
import getApiErrorMessage from "../../../core/utils/apiError";

const initialFilters = {
  q: "",
  page: 0,
  size: 20,
};

const initialCreateForm = {
  name: "",
  description: "",
  price: "",
  maxPrice: "",
  gstPercentage: "",
  stockQuantity: "",
  mainImageUploadId: "",
  categoryId: "",
  isActive: true,
};

const useAdminDashboard = () => {
  const [filters, setFilters] = useState(initialFilters);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pageMeta, setPageMeta] = useState({
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0,
    first: true,
    last: true,
  });
  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchProducts = useCallback(async (nextFilters) => {
    setIsLoadingProducts(true);
    setError("");

    try {
      const response = await productApi.getAdminProducts(nextFilters);
      const pageData = response?.data?.data || {};
      setProducts(pageData.content || []);
      setPageMeta({
        page: pageData.page ?? nextFilters.page,
        size: pageData.size ?? nextFilters.size,
        totalElements: pageData.totalElements ?? 0,
        totalPages: pageData.totalPages ?? 0,
        first: pageData.first ?? true,
        last: pageData.last ?? true,
      });
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to fetch products."));
      setProducts([]);
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    setIsLoadingCategories(true);
    try {
      const response = await categoryApi.getAllCategories();
      const raw = response?.data?.data || [];
      const normalized = raw
        .map((item) => ({
          categoryId: item?.categoryId,
          categoryName: item?.categoryName,
        }))
        .filter((item) => item.categoryId && item.categoryName);
      setCategories(normalized);
    } catch {
      setCategories([]);
    } finally {
      setIsLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts(filters);
  }, [fetchProducts, filters]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const dashboardStats = useMemo(() => {
    const activeCount = products.filter((item) => item?.isActive).length;
    const inactiveCount = products.length - activeCount;
    const outOfStock = products.filter((item) => Number(item?.stockQuantity || 0) <= 0).length;
    const lowStock = products.filter((item) => {
      const stock = Number(item?.stockQuantity || 0);
      return stock > 0 && stock <= 5;
    }).length;

    return {
      totalProducts: pageMeta.totalElements,
      activeCount,
      inactiveCount,
      outOfStock,
      lowStock,
    };
  }, [pageMeta.totalElements, products]);

  const updateSearch = (q) => {
    setFilters((prev) => ({
      ...prev,
      q,
      page: 0,
    }));
  };

  const goToPage = (page) => {
    setFilters((prev) => ({
      ...prev,
      page,
    }));
  };

  const refreshProducts = () => {
    fetchProducts(filters);
  };

  const handleCreateFormChange = (event) => {
    const { name, value, type, checked } = event.target;
    if (error || success) {
      setError("");
      setSuccess("");
    }

    setCreateForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const createProduct = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsCreatingProduct(true);

    try {
      const payload = {
        name: createForm.name.trim(),
        description: createForm.description.trim() || null,
        price: Number(createForm.price),
        maxPrice: createForm.maxPrice ? Number(createForm.maxPrice) : Number(createForm.price),
        gstPercentage: Number(createForm.gstPercentage),
        stockQuantity: Number(createForm.stockQuantity),
        mainImageUploadId: createForm.mainImageUploadId.trim() || null,
        categoryId: createForm.categoryId ? Number(createForm.categoryId) : null,
        isActive: Boolean(createForm.isActive),
      };

      await productApi.createProduct(payload);
      setSuccess("Product created successfully.");
      setCreateForm({
        ...initialCreateForm,
        categoryId: createForm.categoryId,
      });
      refreshProducts();
      fetchCategories();
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to create product."));
    } finally {
      setIsCreatingProduct(false);
    }
  };

  return {
    filters,
    products,
    categories,
    pageMeta,
    createForm,
    dashboardStats,
    isLoadingProducts,
    isLoadingCategories,
    isCreatingProduct,
    error,
    success,
    updateSearch,
    goToPage,
    refreshProducts,
    handleCreateFormChange,
    createProduct,
  };
};

export default useAdminDashboard;
