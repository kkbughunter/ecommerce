import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import productApi from "../../../core/api/productApi";
import getApiErrorMessage from "../../../core/utils/apiError";

export default function useClientProducts() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const categoryId = params.get("category") || "";
  const page = Math.max(0, Number.parseInt(params.get("page") || "0", 10) || 0);
  const [products, setProducts] = useState([]);
  const [pageMeta, setPageMeta] = useState({
    page: 0,
    totalElements: 0,
    totalPages: 0,
    first: true,
    last: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const requestId = useRef(0);

  useEffect(() => {
    const id = ++requestId.current;
    setIsLoading(true);
    setError("");
    const timer = window.setTimeout(
      async () => {
        try {
          const filters = { q: q.trim(), page, size: 20 };
          const response = categoryId
            ? await productApi.getActiveProductsByCategory(categoryId, filters)
            : await productApi.getActiveProducts(filters);
          if (id !== requestId.current) return;
          const data = response?.data?.data || {};
          setProducts(Array.isArray(data.content) ? data.content : []);
          setPageMeta({
            page: data.page ?? page,
            totalElements: data.totalElements ?? 0,
            totalPages: data.totalPages ?? 0,
            first: data.first ?? page === 0,
            last: data.last ?? true,
          });
        } catch (err) {
          if (id !== requestId.current) return;
          setProducts([]);
          setError(
            getApiErrorMessage(
              err,
              "We couldn’t load the components. Please try again.",
            ),
          );
        } finally {
          if (id === requestId.current) setIsLoading(false);
        }
      },
      q ? 250 : 0,
    );
    return () => {
      window.clearTimeout(timer);
      requestId.current += 1;
    };
  }, [q, categoryId, page, revision]);

  const change = useCallback(
    (values) => {
      setParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          Object.entries(values).forEach(([key, value]) =>
            value === "" || value === null || value === 0
              ? next.delete(key)
              : next.set(key, String(value)),
          );
          return next;
        },
        { replace: true, preventScrollReset: true },
      );
    },
    [setParams],
  );
  return {
    filters: { q, categoryId, page, size: 20 },
    products,
    pageMeta,
    isLoading,
    error,
    updateSearch: (value) => change({ q: value, page: 0 }),
    updateCategory: (value) => change({ category: value, page: 0 }),
    clearFilters: () => change({ q: "", category: "", page: 0 }),
    goToPage: (value) => change({ page: value }),
    refresh: () => setRevision((value) => value + 1),
  };
}
