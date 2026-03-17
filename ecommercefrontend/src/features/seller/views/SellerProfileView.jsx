import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import sellerApi from "../../../core/api/sellerApi";
import getApiErrorMessage from "../../../core/utils/apiError";
import AppFooter from "../../../layouts/AppFooter";

const initialFormData = {
    businessName: "",
    businessEmail: "",
    businessPhone: "",
};

const SellerProfileView = () => {
    const [formData, setFormData] = useState(initialFormData);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [existingProfile, setExistingProfile] = useState(null);

    // Load existing profile on mount
    useEffect(() => {
        const loadProfile = async () => {
            try {
                const response = await sellerApi.getMySellerProfile();
                if (response?.data) {
                    const profile = response.data;
                    setExistingProfile(profile);
                    setFormData({
                        businessName: profile.businessName || "",
                        businessEmail: profile.businessEmail || "",
                        businessPhone: profile.businessPhone || "",
                    });
                }
            } catch (err) {
                // 404 or 403 means no profile available for this token yet
                if (![403, 404].includes(err.response?.status)) {
                    console.error("Failed to load profile:", err);
                }
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, []);

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setError(null);
        setSuccess(null);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setSaving(true);

        try {
            if (existingProfile) {
                // Update existing profile
                await sellerApi.updateSellerProfile(formData);
                setSuccess("Profile updated successfully!");
            } else {
                setError(
                    "Seller profile is not available. Please contact the Super Admin to set up your seller account.",
                );
            }
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-slate-600">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">
                                Seller Profile
                            </h1>
                            <p className="mt-1 text-sm text-slate-600">
                                {existingProfile
                                    ? "Update your business information"
                                    : "Register as a seller"}
                            </p>
                        </div>
                        <Link
                            to="/seller/dashboard"
                            className="text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                            {"<"} Back to Dashboard
                        </Link>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="rounded-lg bg-white shadow-sm">
                    <form onSubmit={handleSubmit} className="space-y-6 p-6">
                        {/* Success/Error Messages */}
                        {success && (
                            <div className="rounded-md bg-green-50 p-4">
                                <p className="text-sm font-medium text-green-800">
                                    {success}
                                </p>
                            </div>
                        )}
                        {error && (
                            <div className="rounded-md bg-red-50 p-4">
                                <p className="text-sm font-medium text-red-800">
                                    {error}
                                </p>
                            </div>
                        )}

                        {/* Business Name */}
                        <div>
                            <label
                                htmlFor="businessName"
                                className="block text-sm font-medium text-slate-700"
                            >
                                Business Name{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="businessName"
                                name="businessName"
                                value={formData.businessName}
                                onChange={handleChange}
                                required
                                maxLength={200}
                                placeholder="Your Business Name"
                                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        {/* Business Email */}
                        <div>
                            <label
                                htmlFor="businessEmail"
                                className="block text-sm font-medium text-slate-700"
                            >
                                Business Email
                            </label>
                            <input
                                type="email"
                                id="businessEmail"
                                name="businessEmail"
                                value={formData.businessEmail}
                                onChange={handleChange}
                                maxLength={100}
                                placeholder="business@example.com"
                                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        {/* Business Phone */}
                        <div>
                            <label
                                htmlFor="businessPhone"
                                className="block text-sm font-medium text-slate-700"
                            >
                                Business Phone
                            </label>
                            <input
                                type="tel"
                                id="businessPhone"
                                name="businessPhone"
                                value={formData.businessPhone}
                                onChange={handleChange}
                                maxLength={20}
                                placeholder="+91 9876543210"
                                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        {/* Existing Profile Info */}
                        {existingProfile && (
                            <div className="rounded-md bg-slate-50 p-4">
                                <dl className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <dt className="text-slate-500">
                                            Status:
                                        </dt>
                                        <dd className="font-medium text-slate-900">
                                            {existingProfile.isActive
                                                ? "Active"
                                                : "Inactive"}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-slate-500">
                                            Created:
                                        </dt>
                                        <dd className="font-medium text-slate-900">
                                            {new Date(
                                                existingProfile.createdDt,
                                            ).toLocaleDateString()}
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                        )}

                        {!existingProfile && (
                            <div className="rounded-md bg-amber-50 p-4">
                                <p className="text-sm text-amber-800">
                                    Your seller profile has not been created yet. Please contact
                                    the Super Admin to enable your seller account.
                                </p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="flex justify-end gap-4">
                            <Link
                                to="/seller/dashboard"
                                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={saving || !existingProfile}
                                className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                                {saving
                                    ? "Saving..."
                                    : existingProfile
                                      ? "Update Profile"
                                      : "Create Profile"}
                            </button>
                        </div>
                    </form>
                </div>
            </main>

            <AppFooter />
        </div>
    );
};

export default SellerProfileView;
