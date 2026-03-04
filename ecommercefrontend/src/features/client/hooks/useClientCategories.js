import { useCallback, useEffect, useState } from "react";
import productApi from "../../../core/api/productApi";

const DEFAULT_CATEGORY_NAMES = [
  "Electronics",
  "Fashion",
  "Home & Kitchen",
  "Books",
  "Sports & Outdoors",
  "Beauty & Personal Care",
  "Toys & Games",
  "Health & Wellness",
];

const uniqueNonEmpty = (items) => {
  const seen = new Set();
  const output = [];

  items.forEach((item) => {
    const value = typeof item === "string" ? item.trim() : "";
    if (!value || seen.has(value)) {
      return;
    }
    seen.add(value);
    output.push(value);
  });

  return output;
};

const useClientCategories = () => {
  const [categories, setCategories] = useState(DEFAULT_CATEGORY_NAMES);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await productApi.getActiveCategoriesWithProducts({
        page: 0,
        size: 20,
      });
      const content = response?.data?.data?.content || [];
      const categoryNames = uniqueNonEmpty(
        content.map((entry) => entry?.categoryName),
      );

      if (categoryNames.length) {
        setCategories(categoryNames);
      } else {
        setCategories(DEFAULT_CATEGORY_NAMES);
      }
    } catch {
      setCategories(DEFAULT_CATEGORY_NAMES);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    isLoading,
    refreshCategories: fetchCategories,
  };
};

export default useClientCategories;
