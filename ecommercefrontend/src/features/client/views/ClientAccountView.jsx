import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import customerApi from "../../../core/api/customerApi";
import { clearAuthSession, getAuthMeta } from "../../../core/auth/session";
import getApiErrorMessage from "../../../core/utils/apiError";
import AppFooter from "../../../layouts/AppFooter";

const emptyAddress = {
  addressId: null,
  fullName: "",
  phoneNumber: "",
  line1: "",
  line2: "",
  landmark: "",
  city: "",
  district: "",
  state: "",
  country: "India",
  postalCode: "",
};

const initialProfile = {
  firstName: "",
  lastName: "",
  gender: "",
  dateOfBirth: "",
  billingAddress: { ...emptyAddress },
  shippingAddress: { ...emptyAddress },
};

const ClientAccountView = () => {
  const navigate = useNavigate();
  const authMeta = getAuthMeta();
  const [profile, setProfile] = useState(initialProfile);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await customerApi.getMyProfile();
      const data = response?.data?.data || {};
      setProfile({
        firstName: data?.firstName || "",
        lastName: data?.lastName || "",
        gender: (data?.gender || "").toUpperCase(),
        dateOfBirth: data?.dateOfBirth || "",
        billingAddress: {
          ...emptyAddress,
          ...data?.billingAddress,
        },
        shippingAddress: {
          ...emptyAddress,
          ...data?.shippingAddress,
        },
      });
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to load profile."));
      setProfile(initialProfile);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleLogout = () => {
    clearAuthSession();
    navigate("/login", { replace: true });
  };

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setError("");
    setSuccess("");
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddressChange = (type, event) => {
    const { name, value } = event.target;
    setError("");
    setSuccess("");
    setProfile((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [name]: value,
      },
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSaving(true);

    try {
      const payload = {
        firstName: profile.firstName.trim(),
        lastName: profile.lastName.trim() || null,
        gender: profile.gender || null,
        dateOfBirth: profile.dateOfBirth || null,
        billingAddress: {
          ...profile.billingAddress,
          addressId: profile.billingAddress.addressId || null,
        },
        shippingAddress: {
          ...profile.shippingAddress,
          addressId: profile.shippingAddress.addressId || null,
        },
      };
      await customerApi.updateMyProfile(payload);
      setSuccess("Profile updated successfully.");
      await loadProfile();
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to update profile."));
    } finally {
      setIsSaving(false);
    }
  };

  const AddressForm = ({ title, value, type }) => (
    <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.08em] text-slate-700">{title}</h3>
      <div className="grid gap-3 md:grid-cols-2">
        <input
          type="text"
          name="fullName"
          value={value.fullName}
          onChange={(event) => handleAddressChange(type, event)}
          placeholder="Full Name"
          className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
          required
        />
        <input
          type="text"
          name="phoneNumber"
          value={value.phoneNumber}
          onChange={(event) => handleAddressChange(type, event)}
          placeholder="Phone Number"
          className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
          required
        />
        <input
          type="text"
          name="line1"
          value={value.line1}
          onChange={(event) => handleAddressChange(type, event)}
          placeholder="Address Line 1"
          className="h-10 rounded-lg border border-slate-300 px-3 text-sm md:col-span-2"
          required
        />
        <input
          type="text"
          name="line2"
          value={value.line2}
          onChange={(event) => handleAddressChange(type, event)}
          placeholder="Address Line 2"
          className="h-10 rounded-lg border border-slate-300 px-3 text-sm md:col-span-2"
        />
        <input
          type="text"
          name="landmark"
          value={value.landmark}
          onChange={(event) => handleAddressChange(type, event)}
          placeholder="Landmark"
          className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
          required
        />
        <input
          type="text"
          name="city"
          value={value.city}
          onChange={(event) => handleAddressChange(type, event)}
          placeholder="City"
          className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
          required
        />
        <input
          type="text"
          name="district"
          value={value.district}
          onChange={(event) => handleAddressChange(type, event)}
          placeholder="District"
          className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
          required
        />
        <input
          type="text"
          name="state"
          value={value.state}
          onChange={(event) => handleAddressChange(type, event)}
          placeholder="State"
          className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
          required
        />
        <input
          type="text"
          name="country"
          value={value.country}
          onChange={(event) => handleAddressChange(type, event)}
          placeholder="Country"
          className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
          required
        />
        <input
          type="text"
          name="postalCode"
          value={value.postalCode}
          onChange={(event) => handleAddressChange(type, event)}
          placeholder="Postal Code"
          className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
          required
        />
      </div>
    </article>
  );

  return (
    <main className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_20%_0%,#eef2ff_0%,#f8fafc_45%,#f6f8fc_100%)] text-[#0f172a]">
      <header className="sticky top-0 z-20 border-b border-[#e8ebfb] bg-white/85 backdrop-blur">
        <div className="flex w-full flex-wrap items-center justify-between gap-3 px-2 py-4 md:px-3">
          <h1 className="text-[24px] font-bold tracking-tight text-[#111827]">My Account</h1>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navigate("/client")}
              className="h-10 rounded-xl border border-[#d8deef] bg-white px-4 text-[12px] font-semibold text-[#334155]"
            >
              Back To Home
            </button>
            <button
              type="button"
              onClick={() => navigate("/client/cart")}
              className="h-10 rounded-xl border border-[#d8deef] bg-white px-4 text-[12px] font-semibold text-[#334155]"
            >
              Cart
            </button>
            <button
              type="button"
              onClick={() => navigate("/client/orders")}
              className="h-10 rounded-xl border border-[#d8deef] bg-white px-4 text-[12px] font-semibold text-[#334155]"
            >
              Orders
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="h-10 rounded-xl border border-[#e2e8f0] bg-white px-4 text-[12px] font-semibold text-[#334155]"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <section className="w-full flex-1 px-2 py-6 md:px-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Profile & Addresses</h2>
              <p className="text-sm text-slate-600">Email: {authMeta?.email || "-"}</p>
            </div>
            <button
              type="button"
              onClick={loadProfile}
              className="h-9 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700"
            >
              Refresh
            </button>
          </div>

          {isLoading ? (
            <p className="text-sm text-slate-500">Loading profile...</p>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  type="text"
                  name="firstName"
                  value={profile.firstName}
                  onChange={handleFieldChange}
                  placeholder="First Name"
                  className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
                  required
                />
                <input
                  type="text"
                  name="lastName"
                  value={profile.lastName}
                  onChange={handleFieldChange}
                  placeholder="Last Name"
                  className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
                />
                <select
                  name="gender"
                  value={profile.gender}
                  onChange={handleFieldChange}
                  className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
                >
                  <option value="">Select Gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={profile.dateOfBirth || ""}
                  onChange={handleFieldChange}
                  className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
                />
              </div>

              <AddressForm title="Billing Address" value={profile.billingAddress} type="billingAddress" />
              <AddressForm title="Shipping Address" value={profile.shippingAddress} type="shippingAddress" />

              {error && <p className="text-sm text-red-600">{error}</p>}
              {success && <p className="text-sm text-emerald-600">{success}</p>}

              <button
                type="submit"
                disabled={isSaving}
                className="h-10 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save Profile"}
              </button>
            </form>
          )}
        </article>
      </section>
      <AppFooter />
    </main>
  );
};

export default ClientAccountView;
