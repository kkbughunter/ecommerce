import { useCallback, useEffect, useMemo, useState } from "react";
import cartApi from "../../../core/api/cartApi";
import paymentApi from "../../../core/api/paymentApi";
import getApiErrorMessage from "../../../core/utils/apiError";

const emptyCart = {
  cartId: null,
  subtotalAmount: 0,
  shippingFee: 0,
  taxAmount: 0,
  discountAmount: 0,
  totalAmount: 0,
  totalItems: 0,
  items: [],
};

const parseInsufficientStockProductId = (message) => {
  if (typeof message !== "string") {
    return null;
  }
  const match = message.match(/insufficient stock for product:\s*(\d+)/i);
  if (!match) {
    return null;
  }
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeCart = (payload) => {
  const raw = payload || {};
  return {
    ...emptyCart,
    ...raw,
    subtotalAmount: Number(raw?.subtotalAmount ?? raw?.subtotal ?? 0),
    shippingFee: Number(raw?.shippingFee ?? 0),
    taxAmount: Number(raw?.taxAmount ?? 0),
    discountAmount: Number(raw?.discountAmount ?? 0),
    totalAmount: Number(raw?.totalAmount ?? 0),
    totalItems: Number(raw?.totalItems ?? 0),
    items: Array.isArray(raw?.items) ? raw.items : [],
  };
};

const RAZORPAY_CHECKOUT_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

const loadRazorpayCheckoutScript = () =>
  new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Razorpay can only be used in browser"));
      return;
    }
    if (window.Razorpay) {
      resolve();
      return;
    }
    const existingScript = document.querySelector(`script[src="${RAZORPAY_CHECKOUT_SCRIPT}"]`);
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Unable to load Razorpay checkout script")), {
        once: true,
      });
      return;
    }
    const script = document.createElement("script");
    script.src = RAZORPAY_CHECKOUT_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load Razorpay checkout script"));
    document.body.appendChild(script);
  });

const openRazorpayCheckout = ({ order, payment }) =>
  new Promise((resolve, reject) => {
    if (!window.Razorpay) {
      reject(new Error("Razorpay checkout is not available"));
      return;
    }
    const options = {
      key: payment?.razorpayKeyId,
      amount: payment?.amountInSubunits,
      currency: payment?.currency || "INR",
      name: "AstraVal",
      description: `Payment for ${order?.orderNumber || "order"}`,
      order_id: payment?.razorpayOrderId,
      handler: (response) => {
        resolve({
          type: "success",
          payload: response,
        });
      },
      modal: {
        ondismiss: () => resolve({ type: "dismissed" }),
      },
      notes: {
        orderNumber: order?.orderNumber || "",
      },
      theme: {
        color: "#2563eb",
      },
    };
    const razorpay = new window.Razorpay(options);
    razorpay.on("payment.failed", (response) => {
      resolve({
        type: "failed",
        payload: response?.error || {},
      });
    });
    razorpay.open();
  });

const useCart = ({ enabled = true } = {}) => {
  const [cart, setCart] = useState(emptyCart);
  const [isLoadingCart, setIsLoadingCart] = useState(false);
  const [isMutatingCart, setIsMutatingCart] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [itemErrors, setItemErrors] = useState({});

  const loadCart = useCallback(async () => {
    setIsLoadingCart(true);
    try {
      const response = await cartApi.getMyCart();
      const nextCart = normalizeCart(response?.data?.data);
      setCart(nextCart);
      const validProductIds = new Set((nextCart.items || []).map((item) => Number(item?.productId)));
      setItemErrors((prev) =>
        Object.fromEntries(
          Object.entries(prev).filter(([productId]) => validProductIds.has(Number(productId))),
        ),
      );
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to load cart."));
      setCart(emptyCart);
      setItemErrors({});
    } finally {
      setIsLoadingCart(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    loadCart();
  }, [enabled, loadCart]);

  const addToCart = async (productId, quantity = 1) => {
    if (!enabled) {
      return;
    }
    if (!productId) {
      return;
    }
    setIsMutatingCart(true);
    setError("");
    setSuccess("");
    try {
      const response = await cartApi.addItem({ productId, quantity });
      setCart(normalizeCart(response?.data?.data));
      setSuccess("Added to cart.");
      setItemErrors((prev) => {
        if (!Object.prototype.hasOwnProperty.call(prev, productId)) {
          return prev;
        }
        const next = { ...prev };
        delete next[productId];
        return next;
      });
    } catch (err) {
      const message = getApiErrorMessage(err, "Unable to add item to cart.");
      setError(message);
      const insufficientProductId =
        parseInsufficientStockProductId(message) || (Number.isFinite(Number(productId)) ? Number(productId) : null);
      if (message.toLowerCase().includes("insufficient stock for product") && insufficientProductId !== null) {
        setItemErrors((prev) => ({
          ...prev,
          [insufficientProductId]: message,
        }));
      }
    } finally {
      setIsMutatingCart(false);
    }
  };

  const updateQuantity = async (productId, quantity) => {
    if (!enabled) {
      return;
    }
    if (!productId || quantity < 1) {
      return;
    }
    setIsMutatingCart(true);
    setError("");
    setSuccess("");
    try {
      const response = await cartApi.updateItemQuantity(productId, { quantity });
      setCart(normalizeCart(response?.data?.data));
      setItemErrors((prev) => {
        if (!Object.prototype.hasOwnProperty.call(prev, productId)) {
          return prev;
        }
        const next = { ...prev };
        delete next[productId];
        return next;
      });
    } catch (err) {
      const message = getApiErrorMessage(err, "Unable to update cart item.");
      setError(message);
      const isInsufficientStockError = message.toLowerCase().includes("insufficient stock for product");
      if (isInsufficientStockError) {
        const insufficientProductId =
          parseInsufficientStockProductId(message) || (Number.isFinite(Number(productId)) ? Number(productId) : null);
        if (insufficientProductId !== null) {
          setItemErrors((prev) => ({
            ...prev,
            [insufficientProductId]: message,
          }));
        }
      }
    } finally {
      setIsMutatingCart(false);
    }
  };

  const removeFromCart = async (productId) => {
    if (!enabled) {
      return;
    }
    if (!productId) {
      return;
    }
    setIsMutatingCart(true);
    setError("");
    setSuccess("");
    try {
      const response = await cartApi.removeItem(productId);
      setCart(normalizeCart(response?.data?.data));
      setItemErrors((prev) => {
        if (!Object.prototype.hasOwnProperty.call(prev, productId)) {
          return prev;
        }
        const next = { ...prev };
        delete next[productId];
        return next;
      });
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to remove cart item."));
    } finally {
      setIsMutatingCart(false);
    }
  };

  const clearCart = async () => {
    if (!enabled) {
      return;
    }
    setIsMutatingCart(true);
    setError("");
    setSuccess("");
    try {
      const response = await cartApi.clearCart();
      setCart(normalizeCart(response?.data?.data));
      setSuccess("Cart cleared.");
      setItemErrors({});
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to clear cart."));
    } finally {
      setIsMutatingCart(false);
    }
  };

  const checkout = async (productIds = []) => {
    if (!enabled) {
      return;
    }
    if (!Array.isArray(productIds) || !productIds.length) {
      setError("Please select at least one item to checkout.");
      return;
    }
    setIsMutatingCart(true);
    setError("");
    setSuccess("");
    try {
      const response = await cartApi.checkout({ productIds });
      const order = response?.data?.data?.order;
      const payment = response?.data?.data?.payment;
      if (!order?.orderId || !payment?.razorpayOrderId || !payment?.razorpayKeyId) {
        setSuccess(`Order ${order?.orderNumber || ""} created.`);
        await loadCart();
        return;
      }

      await loadRazorpayCheckoutScript();
      const razorpayResult = await openRazorpayCheckout({ order, payment });
      if (razorpayResult.type === "success") {
        await paymentApi.verifyRazorpayPayment({
          orderId: order.orderId,
          razorpayOrderId: razorpayResult.payload?.razorpay_order_id,
          razorpayPaymentId: razorpayResult.payload?.razorpay_payment_id,
          razorpaySignature: razorpayResult.payload?.razorpay_signature,
        });
        setSuccess(`Order ${order.orderNumber} placed and payment completed successfully.`);
      } else if (razorpayResult.type === "failed") {
        await paymentApi.markRazorpayPaymentFailed({
          orderId: order.orderId,
          razorpayOrderId: payment.razorpayOrderId,
          razorpayPaymentId: razorpayResult.payload?.metadata?.payment_id || null,
          errorCode: razorpayResult.payload?.code || null,
          errorDescription:
            razorpayResult.payload?.description || razorpayResult.payload?.reason || "Payment attempt failed",
        });
        setError("Payment failed. You can retry payment from your order.");
      } else {
        setError("Payment window was closed. You can retry payment from your order.");
      }
      await loadCart();
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to checkout."));
    } finally {
      setIsMutatingCart(false);
    }
  };

  const cartCount = useMemo(() => Number(cart?.totalItems || 0), [cart?.totalItems]);

  return {
    cart,
    cartCount,
    isLoadingCart,
    isMutatingCart,
    error,
    success,
    itemErrors,
    loadCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    checkout,
  };
};

export default useCart;
