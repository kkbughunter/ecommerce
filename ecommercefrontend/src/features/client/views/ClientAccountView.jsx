import { useCallback, useEffect, useState } from "react";
import customerApi from "../../../core/api/customerApi";
import { getAuthMeta } from "../../../core/auth/session";
import getApiErrorMessage from "../../../core/utils/apiError";
import AppFooter from "../../../layouts/AppFooter";
import ClientTopNav from "../components/ClientTopNav";

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

const formatAddressLine = (address) => {
  const parts = [
    address?.line1,
    address?.line2,
    address?.landmark,
    address?.city,
    address?.district,
    address?.state,
    address?.country,
    address?.postalCode,
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean);
  return parts.length ? parts.join(", ") : "-";
};

const ClientAccountView = () => {
  const authMeta = getAuthMeta();
  const [profile, setProfile] = useState(initialProfile);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
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
      setIsEditing(false);
      await loadProfile();
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to update profile."));
    } finally {
      setIsSaving(false);
    }
  };

  const ProfileField = ({ label, children, className = "" }) => (
    <label className={`space-y-1 ${className}`}>
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-600">{label}</span>
      {children}
    </label>
  );

  const AddressForm = ({ title, value, type }) => (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.08em] text-slate-700">{title}</h3>
      <div className="grid gap-3 md:grid-cols-2">
        <ProfileField label="Full Name">
          <input
            type="text"
            name="fullName"
            value={value.fullName}
            onChange={(event) => handleAddressChange(type, event)}
            placeholder="Full Name"
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            required
          />
        </ProfileField>
        <ProfileField label="Phone Number">
          <input
            type="text"
            name="phoneNumber"
            value={value.phoneNumber}
            onChange={(event) => handleAddressChange(type, event)}
            placeholder="Phone Number"
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            required
          />
        </ProfileField>
        <ProfileField label="Address Line 1" className="md:col-span-2">
          <input
            type="text"
            name="line1"
            value={value.line1}
            onChange={(event) => handleAddressChange(type, event)}
            placeholder="Address Line 1"
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            required
          />
        </ProfileField>
        <ProfileField label="Address Line 2" className="md:col-span-2">
          <input
            type="text"
            name="line2"
            value={value.line2}
            onChange={(event) => handleAddressChange(type, event)}
            placeholder="Address Line 2"
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </ProfileField>
        <ProfileField label="Landmark">
          <input
            type="text"
            name="landmark"
            value={value.landmark}
            onChange={(event) => handleAddressChange(type, event)}
            placeholder="Landmark"
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            required
          />
        </ProfileField>
        <ProfileField label="City">
          <input
            type="text"
            name="city"
            value={value.city}
            onChange={(event) => handleAddressChange(type, event)}
            placeholder="City"
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            required
          />
        </ProfileField>
        <ProfileField label="District">
          <input
            type="text"
            name="district"
            value={value.district}
            onChange={(event) => handleAddressChange(type, event)}
            placeholder="District"
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            required
          />
        </ProfileField>
        <ProfileField label="State">
          <input
            type="text"
            name="state"
            value={value.state}
            onChange={(event) => handleAddressChange(type, event)}
            placeholder="State"
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            required
          />
        </ProfileField>
        <ProfileField label="Country">
          <input
            type="text"
            name="country"
            value={value.country}
            onChange={(event) => handleAddressChange(type, event)}
            placeholder="Country"
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            required
          />
        </ProfileField>
        <ProfileField label="Postal Code">
          <input
            type="text"
            name="postalCode"
            value={value.postalCode}
            onChange={(event) => handleAddressChange(type, event)}
            placeholder="Postal Code"
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            required
          />
        </ProfileField>
      </div>
    </article>
  );

  const AddressSummaryCard = ({ title, value }) => (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-700">{title}</h3>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value?.fullName || "-"}</p>
      <p className="text-xs text-slate-600">Phone: {value?.phoneNumber || "-"}</p>
      <p className="mt-1 text-xs text-slate-600">{formatAddressLine(value)}</p>
    </article>
  );

  const accountInitials = `${(profile?.firstName || authMeta?.email || "U").charAt(0)}${(profile?.lastName || "").charAt(0)}`.toUpperCase();

  return (
    <main className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_20%_0%,#eef2ff_0%,#f8fafc_45%,#f6f8fc_100%)] text-[#0f172a]">
      <ClientTopNav title="My Profile" eyebrow="Account Center" showLogout />

      <section className="w-full flex-1 px-2 py-6 md:px-3">
        <div className="space-y-4">
          <article className="rounded-2xl border border-[#dce4ff] bg-[linear-gradient(120deg,#ffffff,#f1f5ff)] p-5 shadow-[0_12px_32px_rgba(30,41,59,0.08)]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(140deg,#2563eb,#4f46e5)] text-lg font-semibold text-white">
                  {accountInitials || "U"}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {profile.firstName ? `${profile.firstName} ${profile.lastName}`.trim() : "Complete your profile"}
                  </h2>
                  <p className="text-sm text-slate-600">{authMeta?.email || "-"}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={loadProfile}
                  className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700"
                >
                  Refresh Profile
                </button>
                {!isEditing ? (
                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setSuccess("");
                      setIsEditing(true);
                    }}
                    className="h-9 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    Update Profile
                  </button>
                ) : null}
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            {isLoading ? (
              <p className="text-sm text-slate-500">Loading profile...</p>
            ) : !isEditing ? (
              <div className="space-y-4">
                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.08em] text-slate-700">Personal Info</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-600">First Name</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{profile.firstName || "-"}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-600">Last Name</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{profile.lastName || "-"}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-600">Gender</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{profile.gender || "-"}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-600">Date Of Birth</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{profile.dateOfBirth || "-"}</p>
                    </div>
                  </div>
                </section>

                <div className="grid gap-4 xl:grid-cols-2">
                  <AddressSummaryCard title="Billing Address" value={profile.billingAddress} />
                  <AddressSummaryCard title="Shipping Address" value={profile.shippingAddress} />
                </div>

                {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
                {success ? <p className="text-sm font-medium text-emerald-600">{success}</p> : null}

                <div className="flex justify-end border-t border-slate-200 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setSuccess("");
                      setIsEditing(true);
                    }}
                    className="h-10 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Edit Details
                  </button>
                </div>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.08em] text-slate-700">Personal Info</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    <ProfileField label="First Name">
                      <input
                        type="text"
                        name="firstName"
                        value={profile.firstName}
                        onChange={handleFieldChange}
                        placeholder="First Name"
                        className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        required
                      />
                    </ProfileField>
                    <ProfileField label="Last Name">
                      <input
                        type="text"
                        name="lastName"
                        value={profile.lastName}
                        onChange={handleFieldChange}
                        placeholder="Last Name"
                        className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </ProfileField>
                    <ProfileField label="Gender">
                      <select
                        name="gender"
                        value={profile.gender}
                        onChange={handleFieldChange}
                        className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      >
                        <option value="">Select Gender</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </ProfileField>
                    <ProfileField label="Date Of Birth">
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={profile.dateOfBirth || ""}
                        onChange={handleFieldChange}
                        className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </ProfileField>
                  </div>
                </section>

                <div className="grid gap-4 xl:grid-cols-2">
                  <AddressForm title="Billing Address" value={profile.billingAddress} type="billingAddress" />
                  <AddressForm title="Shipping Address" value={profile.shippingAddress} type="shippingAddress" />
                </div>

                {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
                {success ? <p className="text-sm font-medium text-emerald-600">{success}</p> : null}

                <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setSuccess("");
                      setIsEditing(false);
                    }}
                    className="h-10 rounded-lg border border-slate-300 px-5 text-sm font-semibold text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="h-10 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSaving ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              </form>
            )}
          </article>
        </div>
      </section>
      <AppFooter />
    </main>
  );
};

export default ClientAccountView;
