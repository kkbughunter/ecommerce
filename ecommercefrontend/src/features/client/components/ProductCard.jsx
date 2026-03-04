import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ENV from "../../../core/config/env";

const formatMoney = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const price = Number(product?.price || 0);
  const maxPrice = Number(product?.maxPrice || product?.price || 0);
  const discountPercentage =
    maxPrice > price && maxPrice > 0
      ? Math.round(((maxPrice - price) / maxPrice) * 100)
      : 0;
  const productTagLabel =
    product?.productTag === "FLASH_SALES"
      ? "Flash Sales"
      : product?.productTag === "TRENDING_PRODUCTS"
        ? "Trending"
        : "";
  const isOutOfStock = Number(product?.stockQuantity || 0) <= 0;
  const imageUrl = useMemo(() => {
    if (!product?.productId || !product?.mainImageUploadId) {
      return null;
    }
    const base = ENV.API_BASE_URL?.replace(/\/+$/, "") || "";
    return `${base}/products/${product.productId}/images/${product.mainImageUploadId}/file`;
  }, [product?.mainImageUploadId, product?.productId]);

  const shouldShowImage = Boolean(imageUrl) && !imageLoadFailed;

  const openProductDetails = () => {
    if (!product?.productId) {
      return;
    }
    navigate(`/products/${product.productId}`);
  };

  return (
    <article
      className="group cursor-pointer overflow-hidden rounded-2xl border border-[#ececf5] bg-white shadow-[0_6px_25px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:shadow-[0_14px_40px_rgba(15,23,42,0.12)]"
      onClick={openProductDetails}
    >
      <div className="relative aspect-square bg-[linear-gradient(145deg,#f8f9ff,#eef1ff)] p-4">
        {isOutOfStock ? (
          <span className="absolute left-3 top-3 rounded-full bg-[#0f172a] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-white">
            Out of stock
          </span>
        ) : discountPercentage > 0 ? (
          <span className="absolute left-3 top-3 rounded-full bg-[#e11d48] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-white">
            {discountPercentage}% off
          </span>
        ) : null}
        <button
          type="button"
          onClick={(event) => event.stopPropagation()}
          className="absolute right-3 top-3 h-7 rounded-full border border-[#dce1f5] bg-white px-2 text-[10px] font-medium text-[#4a5578]"
        >
          {discountPercentage > 0 ? `Save ${discountPercentage}%` : "Save"}
        </button>
        {shouldShowImage ? (
          <img
            src={imageUrl}
            alt={product?.name || "Product image"}
            onError={() => setImageLoadFailed(true)}
            className="h-full w-full rounded-xl object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-[#cfd6f7] bg-white/70 text-[11px] font-medium text-[#64748b] backdrop-blur">
            Product image placeholder
          </div>
        )}
        {productTagLabel && (
          <span className="absolute bottom-3 left-3 rounded-full bg-[#0f172a]/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-white">
            {productTagLabel}
          </span>
        )}
      </div>

      <div className="space-y-2 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7c3aed]">
          {product?.categoryName || "Category"}
        </p>
        <h3 className="line-clamp-1 text-[15px] font-semibold text-[#0f172a]">
          {product?.name || "Product"}
        </h3>
        <p className="line-clamp-1 text-[12px] text-[#64748b]">
          GST {product?.gstPercentage}% • Stock {product?.stockQuantity}
        </p>

        <div className="flex items-center gap-2">
          <span className="text-[14px] font-bold text-[#0f172a]">
            {formatMoney(price)}
          </span>
          {maxPrice > price && (
            <span className="text-[12px] text-[#94a3b8] line-through">
              {formatMoney(maxPrice)}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={(event) => event.stopPropagation()}
          disabled={isOutOfStock}
          className="mt-1 h-10 w-full rounded-xl bg-[linear-gradient(90deg,#2563eb,#7c3aed)] text-[12px] font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:bg-[#cbd5e1]"
        >
          {isOutOfStock ? "Unavailable" : "Add To Cart"}
        </button>
      </div>
    </article>
  );
};

export default ProductCard;
