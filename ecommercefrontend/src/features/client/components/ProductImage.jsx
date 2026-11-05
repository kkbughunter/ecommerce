import { useState } from "react";
import StoreIcon from "./StoreIcon";

function ImageSource({ src, alt, className = "", loading = "lazy", ...props }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed)
    return (
      <span
        className={`store-image-fallback ${className}`}
        role="img"
        aria-label={`${alt || "Product"}: image unavailable`}
      >
        <StoreIcon name="chip" />
        <span>Image unavailable</span>
      </span>
    );
  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      decoding="async"
      className={`store-product-image ${className}`}
      onError={() => setFailed(true)}
      {...props}
    />
  );
}
export default function ProductImage(props) {
  return <ImageSource key={props.src || "missing"} {...props} />;
}
