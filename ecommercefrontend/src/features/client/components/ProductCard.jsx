import { Link } from "react-router-dom";
import ProductImage from "./ProductImage";
import StoreIcon from "./StoreIcon";

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

export default function ProductCard({
  product,
  onAddToCart,
  isAddingToCart = false,
}) {
  const price = Number(product?.price || 0);
  const maxPrice = Number(product?.maxPrice || price);
  const discount =
    maxPrice > price ? Math.round(((maxPrice - price) / maxPrice) * 100) : 0;
  const inStock = Number(product?.stockQuantity || 0) > 0;
  const rating = Number(product?.averageRating || 0);
  const reviewCount = Number(product?.reviewCount || 0);
  const purchaserCount = Number(product?.purchaserCount || 0);
  const url = `/products/${product.productId}`;
  return (
    <article className="store-product-card">
      <Link
        to={url}
        className="store-card-image"
        aria-label={`View ${product.name}`}
      >
        <ProductImage
          src={
            product.mediumImageUrl ||
            product.largeImageUrl ||
            product.thumbnailUrl
          }
          alt={product.name}
          width="400"
          height="400"
        />
        {discount > 0 && <span className="store-discount">−{discount}%</span>}
      </Link>
      <div className="store-card-body">
        <p className="store-card-category">
          {product.categoryName || "Components"}
        </p>
        <Link to={url} className="store-card-title">
          <h3>{product.name || "Product"}</h3>
        </Link>
        <div className="store-card-social-proof" aria-label={`${rating.toFixed(1)} out of 5 stars from ${reviewCount} reviews`}>
          <span className="store-card-rating" aria-hidden="true">★</span>
          <strong>{reviewCount ? rating.toFixed(1) : "New"}</strong>
          <span>{reviewCount ? `${reviewCount} review${reviewCount === 1 ? "" : "s"}` : "No reviews yet"}</span>
        </div>
        <p className="store-card-purchases">{purchaserCount} purchased</p>
        <div className="store-card-bottom">
          <div className="store-card-price">
            <strong>{money(price)}</strong>
            {maxPrice > price && <del>{money(maxPrice)}</del>}
          </div>
          <p className={`store-stock ${inStock ? "" : "is-unavailable"}`}>
            <span />
            {inStock ? "In stock" : "Out of stock"}
          </p>
          {onAddToCart ? (
            <button
              type="button"
              className="store-add-button"
              onClick={() => onAddToCart(product.productId)}
              disabled={!inStock || isAddingToCart}
            >
              <StoreIcon name="plus" />
              {!inStock
                ? "Unavailable"
                : isAddingToCart
                  ? "Adding…"
                  : "Add to cart"}
            </button>
          ) : (
            <Link to={url} className="store-add-button">
              View product <StoreIcon name="arrow" />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
