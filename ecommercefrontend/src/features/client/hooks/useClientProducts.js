import { useCallback, useEffect, useState } from "react";
import productApi from "../../../core/api/productApi";
import getApiErrorMessage from "../../../core/utils/apiError";

const initialFilters = {
  q: "prod",
  page: 0,
  size: 20,
};

const useClientProducts = () => {
  const [filters, setFilters] = useState(initialFilters);
  const [products, setProducts] = useState([]);
  const [pageMeta, setPageMeta] = useState({
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0,
    first: true,
    last: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchProducts = useCallback(async (nextFilters) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await productApi.getActiveProducts(nextFilters);
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
      setError(getApiErrorMessage(err, "Unable to fetch active products."));
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts(filters);
  }, [fetchProducts, filters]);

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

  const refresh = () => {
    fetchProducts(filters);
  };

  return {
    filters,
    products,
    pageMeta,
    isLoading,
    error,
    updateSearch,
    goToPage,
    refresh,
  };
};

export default useClientProducts;
