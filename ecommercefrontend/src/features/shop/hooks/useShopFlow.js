import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import coreApi from '../../../shared/services/coreApi';
import getApiErrorMessage from '../../../shared/utils/apiError';
import {
  clearAuthSession,
  getRefreshToken,
} from '../../../shared/utils/authSession';

const EMPTY_ADDRESS = {
  addressId: null,
  fullName: '',
  phoneNumber: '',
  line1: '',
  line2: '',
  landmark: '',
  city: '',
  district: '',
  state: '',
  country: 'India',
  postalCode: '',
};

const INITIAL_PROFILE_FORM = {
  firstName: '',
  lastName: '',
  gender: '',
  dateOfBirth: '',
  billingAddress: { ...EMPTY_ADDRESS },
  shippingAddress: { ...EMPTY_ADDRESS },
};

let razorpayScriptPromise;

const trimOrNull = (value) => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const mapAddressToForm = (address) => ({
  addressId: address?.addressId ?? null,
  fullName: address?.fullName ?? '',
  phoneNumber: address?.phoneNumber ?? '',
  line1: address?.line1 ?? '',
  line2: address?.line2 ?? '',
  landmark: address?.landmark ?? '',
  city: address?.city ?? '',
  district: address?.district ?? '',
  state: address?.state ?? '',
  country: address?.country ?? 'India',
  postalCode: address?.postalCode ?? '',
});

const mapCustomerToForm = (customer) => ({
  firstName: customer?.firstName ?? '',
  lastName: customer?.lastName ?? '',
  gender: customer?.gender ?? '',
  dateOfBirth: customer?.dateOfBirth ?? '',
  billingAddress: mapAddressToForm(customer?.billingAddress),
  shippingAddress: mapAddressToForm(customer?.shippingAddress),
});

const mapAddressToPayload = (address) => ({
  addressId: address?.addressId || null,
  fullName: address?.fullName || '',
  phoneNumber: address?.phoneNumber || '',
  line1: address?.line1 || '',
  line2: trimOrNull(address?.line2),
  landmark: address?.landmark || '',
  city: address?.city || '',
  district: address?.district || '',
  state: address?.state || '',
  country: address?.country || '',
  postalCode: address?.postalCode || '',
});

const loadRazorpayCheckout = () => {
  if (window.Razorpay) {
    return Promise.resolve();
  }

  if (razorpayScriptPromise) {
    return razorpayScriptPromise;
  }

  razorpayScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById('razorpay-checkout-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener(
        'error',
        () => reject(new Error('Failed to load Razorpay checkout script.')),
        { once: true },
      );
      return;
    }

    const script = document.createElement('script');
    script.id = 'razorpay-checkout-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay checkout script.'));
    document.body.appendChild(script);
  });

  return razorpayScriptPromise;
};

const useShopFlow = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(null);
  const [customerProfile, setCustomerProfile] = useState(null);
  const [profileForm, setProfileForm] = useState(INITIAL_PROFILE_FORM);
  const [latestOrder, setLatestOrder] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState(null);

  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isProductsLoading, setIsProductsLoading] = useState(false);
  const [isCartLoading, setIsCartLoading] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isCheckoutInProgress, setIsCheckoutInProgress] = useState(false);
  const [activeProductId, setActiveProductId] = useState(null);
  const [activeCartProductId, setActiveCartProductId] = useState(null);
  const [isPaymentDetailsLoading, setIsPaymentDetailsLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleUnauthorized = useCallback(
    (error) => {
      if (error?.response?.status !== 401) {
        return false;
      }

      clearAuthSession();
      navigate('/login', { replace: true });
      return true;
    },
    [navigate],
  );

  const clearMessages = useCallback(() => {
    setErrorMessage('');
    setSuccessMessage('');
  }, []);

  const resolveErrorMessage = useCallback(
    (error, fallbackMessage) => {
      if (handleUnauthorized(error)) {
        return 'Session expired. Please login again.';
      }
      return getApiErrorMessage(error, fallbackMessage);
    },
    [handleUnauthorized],
  );

  const fetchProducts = useCallback(async () => {
    setIsProductsLoading(true);

    try {
      const response = await coreApi.products.getActiveProducts({ page: 0, size: 50 });
      const productPage = response?.data?.data;
      setProducts(productPage?.content || []);
    } catch (error) {
      setErrorMessage(resolveErrorMessage(error, 'Unable to load products.'));
    } finally {
      setIsProductsLoading(false);
    }
  }, [resolveErrorMessage]);

  const fetchCart = useCallback(async () => {
    setIsCartLoading(true);

    try {
      const response = await coreApi.cart.getCart();
      setCart(response?.data?.data || null);
    } catch (error) {
      setErrorMessage(resolveErrorMessage(error, 'Unable to load your cart.'));
    } finally {
      setIsCartLoading(false);
    }
  }, [resolveErrorMessage]);

  const fetchCustomerProfile = useCallback(async () => {
    setIsProfileLoading(true);

    try {
      const response = await coreApi.customer.getMe();
      const profile = response?.data?.data || null;
      setCustomerProfile(profile);
      setProfileForm(mapCustomerToForm(profile));
    } catch (error) {
      if (error?.response?.status === 404) {
        setCustomerProfile(null);
        setProfileForm(INITIAL_PROFILE_FORM);
        setErrorMessage('Customer profile not found. Fill and save profile details before checkout.');
      } else {
        setErrorMessage(resolveErrorMessage(error, 'Unable to load profile details.'));
      }
    } finally {
      setIsProfileLoading(false);
    }
  }, [resolveErrorMessage]);

  useEffect(() => {
    const initialize = async () => {
      setIsBootstrapping(true);
      await Promise.all([fetchProducts(), fetchCart(), fetchCustomerProfile()]);
      setIsBootstrapping(false);
    };

    initialize();
  }, [fetchProducts, fetchCart, fetchCustomerProfile]);

  const refreshPaymentDetails = useCallback(
    async (orderId) => {
      if (!orderId) {
        return;
      }

      setIsPaymentDetailsLoading(true);
      try {
        const response = await coreApi.payment.getOrderPaymentDetails(orderId);
        setPaymentDetails(response?.data?.data || null);
      } catch (error) {
        setErrorMessage(resolveErrorMessage(error, 'Unable to fetch payment details.'));
      } finally {
        setIsPaymentDetailsLoading(false);
      }
    },
    [resolveErrorMessage],
  );

  const addToCart = useCallback(
    async (productId) => {
      clearMessages();
      setActiveProductId(productId);

      try {
        const response = await coreApi.cart.addCartItem({ productId, quantity: 1 });
        setCart(response?.data?.data || null);
        setSuccessMessage('Product added to cart.');
      } catch (error) {
        setErrorMessage(resolveErrorMessage(error, 'Unable to add product to cart.'));
      } finally {
        setActiveProductId(null);
      }
    },
    [clearMessages, resolveErrorMessage],
  );

  const updateCartQuantity = useCallback(
    async (productId, quantity) => {
      if (quantity < 1) {
        return;
      }

      clearMessages();
      setActiveCartProductId(productId);
      try {
        const response = await coreApi.cart.updateCartItem(productId, { quantity });
        setCart(response?.data?.data || null);
      } catch (error) {
        setErrorMessage(resolveErrorMessage(error, 'Unable to update cart item quantity.'));
      } finally {
        setActiveCartProductId(null);
      }
    },
    [clearMessages, resolveErrorMessage],
  );

  const removeCartItem = useCallback(
    async (productId) => {
      clearMessages();
      setActiveCartProductId(productId);
      try {
        const response = await coreApi.cart.removeCartItem(productId);
        setCart(response?.data?.data || null);
        setSuccessMessage('Product removed from cart.');
      } catch (error) {
        setErrorMessage(resolveErrorMessage(error, 'Unable to remove cart item.'));
      } finally {
        setActiveCartProductId(null);
      }
    },
    [clearMessages, resolveErrorMessage],
  );

  const clearCart = useCallback(async () => {
    clearMessages();
    try {
      const response = await coreApi.cart.clearCart();
      setCart(response?.data?.data || null);
      setSuccessMessage('Cart cleared successfully.');
    } catch (error) {
      setErrorMessage(resolveErrorMessage(error, 'Unable to clear cart.'));
    }
  }, [clearMessages, resolveErrorMessage]);

  const handleProfileFieldChange = useCallback((field, value) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleAddressFieldChange = useCallback((addressType, field, value) => {
    setProfileForm((prev) => ({
      ...prev,
      [addressType]: {
        ...prev[addressType],
        [field]: value,
      },
    }));
  }, []);

  const copyBillingToShipping = useCallback(() => {
    setProfileForm((prev) => ({
      ...prev,
      shippingAddress: {
        ...prev.billingAddress,
        addressId: prev.shippingAddress?.addressId ?? null,
      },
    }));
  }, []);

  const saveProfile = useCallback(async () => {
    clearMessages();
    setIsProfileSaving(true);

    const payload = {
      firstName: profileForm.firstName || '',
      lastName: trimOrNull(profileForm.lastName),
      gender: trimOrNull(profileForm.gender),
      dateOfBirth: trimOrNull(profileForm.dateOfBirth),
      billingAddress: mapAddressToPayload(profileForm.billingAddress),
      shippingAddress: mapAddressToPayload(profileForm.shippingAddress),
    };

    try {
      const response = await coreApi.customer.updateMe(payload);
      const updatedProfile = response?.data?.data || null;
      setCustomerProfile(updatedProfile);
      setProfileForm(mapCustomerToForm(updatedProfile));
      setSuccessMessage('Profile updated successfully.');
    } catch (error) {
      setErrorMessage(resolveErrorMessage(error, 'Unable to update profile details.'));
    } finally {
      setIsProfileSaving(false);
    }
  }, [clearMessages, profileForm, resolveErrorMessage]);

  const verifyRazorpayPayment = useCallback(async (order, gatewayOrder, paymentResponse) => {
    await coreApi.payment.verifyRazorpayPayment({
      orderId: order.orderId,
      razorpayOrderId: paymentResponse.razorpay_order_id,
      razorpayPaymentId: paymentResponse.razorpay_payment_id,
      razorpaySignature: paymentResponse.razorpay_signature,
    });
    return gatewayOrder;
  }, []);

  const markPaymentFailure = useCallback(async (orderId, razorpayOrderId, errorCode, errorDescription, razorpayPaymentId = null) => {
    await coreApi.payment.markRazorpayFailure({
      orderId,
      razorpayOrderId,
      razorpayPaymentId,
      errorCode,
      errorDescription,
    });
  }, []);

  const openRazorpayCheckout = useCallback(
    async (order, gatewayOrder) => {
      await loadRazorpayCheckout();

      return new Promise((resolve, reject) => {
        let handledFailure = false;
        let handledSuccess = false;

        const failPayment = async (payload) => {
          if (handledFailure || handledSuccess) {
            return;
          }

          handledFailure = true;

          try {
            await markPaymentFailure(
              order.orderId,
              gatewayOrder.razorpayOrderId,
              payload.errorCode,
              payload.errorDescription,
              payload.razorpayPaymentId,
            );
          } catch {
            // Intentionally swallowed: frontend should still show the primary failure.
          }

          reject(new Error(payload.errorDescription));
        };

        const razorpay = new window.Razorpay({
          key: gatewayOrder.razorpayKeyId,
          amount: gatewayOrder.amountInSubunits,
          currency: gatewayOrder.currency,
          name: 'Astraval Ecommerce',
          description: `Payment for ${order.orderNumber}`,
          order_id: gatewayOrder.razorpayOrderId,
          prefill: {
            name: `${profileForm.firstName} ${profileForm.lastName}`.trim(),
            contact:
              profileForm.shippingAddress.phoneNumber ||
              profileForm.billingAddress.phoneNumber ||
              '',
          },
          theme: {
            color: '#7c3aed',
          },
          handler: async (paymentResponse) => {
            if (handledFailure || handledSuccess) {
              return;
            }

            try {
              await verifyRazorpayPayment(order, gatewayOrder, paymentResponse);
              handledSuccess = true;
              resolve();
            } catch (error) {
              await failPayment({
                razorpayPaymentId: paymentResponse?.razorpay_payment_id || null,
                errorCode: 'VERIFICATION_FAILED',
                errorDescription: getApiErrorMessage(error, 'Payment verification failed.'),
              });
            }
          },
          modal: {
            ondismiss: async () => {
              await failPayment({
                razorpayPaymentId: null,
                errorCode: 'CHECKOUT_CLOSED',
                errorDescription: 'Payment popup was closed before completion.',
              });
            },
          },
        });

        razorpay.on('payment.failed', async (event) => {
          const paymentId = event?.error?.metadata?.payment_id || null;
          const code = event?.error?.code || 'PAYMENT_FAILED';
          const description =
            event?.error?.description || 'Payment failed while processing on Razorpay.';

          await failPayment({
            razorpayPaymentId: paymentId,
            errorCode: code,
            errorDescription: description,
          });
        });

        razorpay.open();
      });
    },
    [markPaymentFailure, profileForm, verifyRazorpayPayment],
  );

  const checkoutAndPay = useCallback(async () => {
    clearMessages();
    setIsCheckoutInProgress(true);

    let order = null;
    try {
      const checkoutResponse = await coreApi.cart.checkout();
      order = checkoutResponse?.data?.data;
      setLatestOrder(order);

      const paymentOrderResponse = await coreApi.payment.createRazorpayOrder({ orderId: order.orderId });
      const gatewayOrder = paymentOrderResponse?.data?.data;

      await openRazorpayCheckout(order, gatewayOrder);
      await refreshPaymentDetails(order.orderId);
      setSuccessMessage('Payment completed and verified successfully.');
      await fetchCart();
    } catch (error) {
      const message = resolveErrorMessage(error, 'Unable to complete checkout and payment.');
      setErrorMessage(message);

      if (order?.orderId) {
        await refreshPaymentDetails(order.orderId);
        await fetchCart();
      }
    } finally {
      setIsCheckoutInProgress(false);
    }
  }, [
    clearMessages,
    fetchCart,
    openRazorpayCheckout,
    refreshPaymentDetails,
    resolveErrorMessage,
  ]);

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();

    try {
      if (refreshToken) {
        await coreApi.auth.logout({ refreshToken });
      }
    } catch {
      // Logout cleanup should proceed regardless of network errors.
    } finally {
      clearAuthSession();
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  return {
    products,
    cart,
    customerProfile,
    profileForm,
    latestOrder,
    paymentDetails,
    isBootstrapping,
    isProductsLoading,
    isCartLoading,
    isProfileLoading,
    isProfileSaving,
    isCheckoutInProgress,
    activeProductId,
    activeCartProductId,
    isPaymentDetailsLoading,
    errorMessage,
    successMessage,
    fetchProducts,
    fetchCart,
    fetchCustomerProfile,
    addToCart,
    updateCartQuantity,
    removeCartItem,
    clearCart,
    handleProfileFieldChange,
    handleAddressFieldChange,
    copyBillingToShipping,
    saveProfile,
    checkoutAndPay,
    refreshPaymentDetails,
    logout,
  };
};

export default useShopFlow;
