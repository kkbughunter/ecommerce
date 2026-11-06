import { useCallback, useEffect, useState } from "react";
import categoryApi from "../../../core/api/categoryApi";

// Collection artwork belongs to the category, independently of its products.
const useClientCategories = () => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await categoryApi.getAllCategories();
      const items = Array.isArray(response?.data?.data) ? response.data.data : [];
      setCategories(items.filter((item) => item?.categoryId != null && item?.categoryName?.trim()).map((item) => ({
        categoryId: item.categoryId,
        categoryName: item.categoryName.trim(),
        categoryImageUrl: item.categoryImageUrl || null,
      })));
    } catch {
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  return { categories, isLoading, refreshCategories: fetchCategories };
};

export default useClientCategories;
