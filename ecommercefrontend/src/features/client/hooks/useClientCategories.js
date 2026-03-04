import { useCallback, useEffect, useState } from "react";
import categoryApi from "../../../core/api/categoryApi";
import productApi from "../../../core/api/productApi";

const DEFAULT_CATEGORIES = [
  {
    categoryId: null,
    categoryName: "Home & Kitchen",
    categoryImageProductId: null,
    categoryImageUploadId: null,
  },
];

const sanitizeCategoryName = (value) => (typeof value === "string" ? value.trim() : "");

const toSafeId = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const buildKey = (name) => sanitizeCategoryName(name).toLowerCase();

const pickDirectImageMeta = (entry) => {
  const uploadId = entry?.categoryImageUploadId || entry?.imageUploadId || null;
  const productId = toSafeId(entry?.categoryImageProductId ?? entry?.imageProductId);
  if (!uploadId || !productId) {
    return null;
  }
  return {
    productId,
    uploadId: String(uploadId),
  };
};

const normalizeCategories = (items, imageById, imageByName) => {
  const seen = new Set();
  const output = [];

  items.forEach((item) => {
    const categoryName = sanitizeCategoryName(item?.categoryName);
    const key = buildKey(categoryName);
    if (!categoryName || seen.has(key)) {
      return;
    }

    seen.add(key);

    const categoryId = toSafeId(item?.categoryId);
    const directImageMeta = pickDirectImageMeta(item);
    const fallbackImageMeta = (categoryId && imageById.get(categoryId)) || imageByName.get(key) || null;
    const imageMeta = directImageMeta || fallbackImageMeta;

    output.push({
      categoryId,
      categoryName,
      categoryImageProductId: imageMeta?.productId || null,
      categoryImageUploadId: imageMeta?.uploadId || null,
    });
  });

  return output;
};

const useClientCategories = () => {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const [categoriesResult, categoryProductsResult] = await Promise.allSettled([
        categoryApi.getAllCategories(),
        productApi.getActiveCategoriesWithProducts({ page: 0, size: 100 }),
      ]);

      const rawCategories =
        categoriesResult.status === "fulfilled" && Array.isArray(categoriesResult.value?.data?.data)
          ? categoriesResult.value.data.data
          : [];

      const categoryProducts =
        categoryProductsResult.status === "fulfilled" &&
        Array.isArray(categoryProductsResult.value?.data?.data?.content)
          ? categoryProductsResult.value.data.data.content
          : [];

      const imageByCategoryId = new Map();
      const imageByCategoryName = new Map();

      categoryProducts.forEach((categoryEntry) => {
        const categoryId = toSafeId(categoryEntry?.categoryId);
        const categoryNameKey = buildKey(categoryEntry?.categoryName);
        const products = Array.isArray(categoryEntry?.products) ? categoryEntry.products : [];
        const firstImageProduct = products.find((product) => product?.productId && product?.mainImageUploadId);

        if (!firstImageProduct) {
          return;
        }

        const imageMeta = {
          productId: toSafeId(firstImageProduct.productId),
          uploadId: String(firstImageProduct.mainImageUploadId),
        };

        if (imageMeta.productId && imageMeta.uploadId) {
          if (categoryId) {
            imageByCategoryId.set(categoryId, imageMeta);
          }
          if (categoryNameKey) {
            imageByCategoryName.set(categoryNameKey, imageMeta);
          }
        }
      });

      const sourceCategories = rawCategories.length
        ? rawCategories
        : categoryProducts.map((item) => ({
            categoryId: item?.categoryId,
            categoryName: item?.categoryName,
          }));

      const normalizedCategories = normalizeCategories(sourceCategories, imageByCategoryId, imageByCategoryName);

      if (normalizedCategories.length) {
        setCategories(normalizedCategories);
      } else {
        setCategories(DEFAULT_CATEGORIES);
      }
    } catch {
      setCategories(DEFAULT_CATEGORIES);
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
