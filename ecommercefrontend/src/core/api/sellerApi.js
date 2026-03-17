import apiClient from "./apiClient";
import ENDPOINTS from "../config/endpoints";

const SELLER = ENDPOINTS.SELLER;

/**
 * Super admin: create a seller profile for a user
 * @param {Object} profileData - { email, password, businessName, businessEmail, businessPhone }
 */
export const createSellerProfile = async (profileData) => {
  const response = await apiClient.post(SELLER.ADMIN_CREATE, profileData);
  return response.data;
};

/**
 * Update the authenticated seller's profile
 * @param {Object} profileData - { businessName, businessEmail, businessPhone }
 */
export const updateSellerProfile = async (profileData) => {
  const response = await apiClient.put(SELLER.PROFILE, profileData);
  return response.data;
};

/**
 * Get the authenticated seller's profile
 */
export const getMySellerProfile = async () => {
  const response = await apiClient.get(SELLER.PROFILE);
  return response.data;
};

/**
 * Get any seller profile by ID (admin only)
 * @param {number} sellerProfileId
 */
export const getSellerProfileById = async (sellerProfileId) => {
  const response = await apiClient.get(SELLER.ADMIN_PROFILE(sellerProfileId));
  return response.data;
};

/**
 * Super admin: list all seller profiles
 */
export const getSellerProfiles = async () => {
  const response = await apiClient.get(SELLER.ADMIN_LIST);
  return response.data;
};

/**
 * Super admin: activate seller profile
 * @param {number} sellerProfileId
 */
export const activateSellerProfile = async (sellerProfileId) => {
  const response = await apiClient.patch(SELLER.ADMIN_ACTIVATE(sellerProfileId));
  return response.data;
};

/**
 * Super admin: deactivate seller profile
 * @param {number} sellerProfileId
 */
export const deactivateSellerProfile = async (sellerProfileId) => {
  const response = await apiClient.patch(SELLER.ADMIN_DEACTIVATE(sellerProfileId));
  return response.data;
};

/**
 * Super admin: save (create or update) Razorpay configuration for a seller
 * @param {number} sellerProfileId
 * @param {Object} config - { razorpayKeyId, razorpayKeySecret, razorpayWebhookSecret }
 */
export const saveSellerRazorpayConfig = async (sellerProfileId, config) => {
  const response = await apiClient.put(SELLER.ADMIN_RAZORPAY_CONFIG(sellerProfileId), config);
  return response.data;
};

/**
 * Super admin: get Razorpay configuration for a seller
 * @param {number} sellerProfileId
 */
export const getSellerRazorpayConfig = async (sellerProfileId) => {
  const response = await apiClient.get(SELLER.ADMIN_RAZORPAY_CONFIG(sellerProfileId));
  return response.data;
};

/**
 * Super admin: delete Razorpay configuration for a seller
 * @param {number} sellerProfileId
 */
export const deleteSellerRazorpayConfig = async (sellerProfileId) => {
  const response = await apiClient.delete(SELLER.ADMIN_RAZORPAY_CONFIG(sellerProfileId));
  return response.data;
};

export default {
  createSellerProfile,
  updateSellerProfile,
  getMySellerProfile,
  getSellerProfileById,
  getSellerProfiles,
  activateSellerProfile,
  deactivateSellerProfile,
  saveSellerRazorpayConfig,
  getSellerRazorpayConfig,
  deleteSellerRazorpayConfig,
};
