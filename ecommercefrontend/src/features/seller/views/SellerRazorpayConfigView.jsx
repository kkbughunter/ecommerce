import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import sellerApi from "../../../core/api/sellerApi";
import getApiErrorMessage from "../../../core/utils/apiError";
import AppFooter from "../../../layouts/AppFooter";

const initialFormData = {
    razorpayKeyId: "",
    razorpayKeySecret: "",
    razorpayWebhookSecret: "",
};

const SellerRazorpayConfigView = () => {
    const [formData, setFormData] = useState(initialFormData);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [existingConfig, setExistingConfig] = useState(null);
    const [showSecret, setShowSecret] = useState(false);

    // Load existing config on mount
    useEffect(() => {
        const loadConfig = async () => {
            try {
                const response = await sellerApi.getMyRazorpayConfig();
                if (response?.data) {
                    const config = response.data;
                    setExistingConfig(config);
                    // Key ID is returned, but secrets are never returned from API
                    setFormData({
                        razorpayKeyId: config.razorpayKeyId || "",
                        razorpayKeySecret: "",
                        razorpayWebhookSecret: "",
                    });
                }
            } catch (err) {
                if (err.response?.status !== 404) {
                    console.error("Failed to load config:", err);
                }
            } finally {
                setLoading(false);
            }
        };

        loadConfig();
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

        // Validate that secrets are provided when creating new
        if (!existingConfig && !formData.razorpayKeySecret) {
            setError("Razorpay Key Secret is required");
            return;
        }

        setSaving(true);

        try {
            // Only send non-empty fields
            const payload = {
                razorpayKeyId: formData.razorpayKeyId.trim(),
                razorpayKeySecret:
                    formData.razorpayKeySecret.trim() || undefined,
                razorpayWebhookSecret:
                    formData.razorpayWebhookSecret.trim() || undefined,
            };

            await sellerApi.saveRazorpayConfig(payload);
            setSuccess("Razorpay configuration saved successfully!");

            // Clear sensitive fields after save
            setFormData((prev) => ({
                ...prev,
                razorpayKeySecret: "",
                razorpayWebhookSecret: "",
            }));

            // Reload config to get updated info
            const response = await sellerApi.getMyRazorpayConfig();
            if (response?.data) {
                setExistingConfig(response.data);
            }
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (
            !window.confirm(
                "Are you sure you want to delete your Razorpay configuration? This cannot be undone.",
            )
        ) {
            return;
        }

        setError(null);
        setSuccess(null);
        setDeleting(true);

        try {
            await sellerApi.deleteMyRazorpayConfig();
            setExistingConfig(null);
            setFormData(initialFormData);
            setSuccess("Razorpay configuration deleted successfully!");
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setDeleting(false);
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
                                Razorpay Configuration
                            </h1>
                            <p className="mt-1 text-sm text-slate-600">
                                Configure your Razorpay account to receive
                                payments
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
                {/* Security Notice */}
                <div className="mb-6 rounded-md bg-amber-50 p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg
                                className="h-5 w-5 text-amber-400"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l.275.55.464 1.464 0 0 1 1.434a1 1.42l.29.383c.648.855 1.846 1.191 2.878.8l.383-.29a1.464 1.464 0 0 1 1.42-1.434l.55.275c1.36.765 1.36 2.722 0 3.486l-.55.275a1.464 1.464 0 0 1-1.42 1.434l-.383.29c-.855.648-1.191 1.846-.8 2.878l.29.383a1.464 1.464 0 0 1 1.434 1.42l.275.55c.765 1.36.765 3.486 0 4.846l-.275.55a1.464 1.464 0 0 1-1.434 1.42l-.383.29c-.648.855-1.846 1.191-2.878.8l-.29.383a1.464 1.464 0 0 1-1.42 1.434l-.55.275c-1.36.765-3.486.765-4.846 0l-.275-.55a1.464 1.464 0 0 1-1.42-1.434l-.29-.383c-.855-.648-1.191-1.846-.8-2.878l.383-.29a1.464 1.464 0 0 1-1.434-1.42l-.275-.55zM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-amber-800">
                                Security Notice
                            </h3>
                            <div className="mt-2 text-sm text-amber-700">
                                <p>
                                    Your Razorpay credentials are encrypted
                                    using AES-256-GCM before being stored. The
                                    Key Secret and Webhook Secret are never
                                    returned by the API.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

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

                        {/* Existing Config Info */}
                        {existingConfig && (
                            <div className="rounded-md bg-slate-50 p-4">
                                <dl className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <dt className="text-slate-500">
                                            Status:
                                        </dt>
                                        <dd className="font-medium text-slate-900">
                                            {existingConfig.isActive
                                                ? "Active"
                                                : "Inactive"}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-slate-500">
                                            Key ID:
                                        </dt>
                                        <dd className="font-mono text-slate-900">
                                            {existingConfig.razorpayKeyId}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-slate-500">
                                            Last Updated:
                                        </dt>
                                        <dd className="font-medium text-slate-900">
                                            {existingConfig.modifiedDt
                                                ? new Date(
                                                      existingConfig.modifiedDt,
                                                  ).toLocaleString()
                                                : new Date(
                                                      existingConfig.createdDt,
                                                  ).toLocaleString()}
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                        )}

                        {/* Razorpay Key ID */}
                        <div>
                            <label
                                htmlFor="razorpayKeyId"
                                className="block text-sm font-medium text-slate-700"
                            >
                                Razorpay Key ID{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="razorpayKeyId"
                                name="razorpayKeyId"
                                value={formData.razorpayKeyId}
                                onChange={handleChange}
                                required
                                maxLength={100}
                                placeholder="rzp_test_..."
                                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        {/* Razorpay Key Secret */}
                        <div>
                            <label
                                htmlFor="razorpayKeySecret"
                                className="block text-sm font-medium text-slate-700"
                            >
                                Razorpay Key Secret{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <div className="relative mt-1">
                                <input
                                    type={showSecret ? "text" : "password"}
                                    id="razorpayKeySecret"
                                    name="razorpayKeySecret"
                                    value={formData.razorpayKeySecret}
                                    onChange={handleChange}
                                    maxLength={300}
                                    placeholder={
                                        existingConfig
                                            ? "(Leave blank to keep current)"
                                            : "rzp_test_..."
                                    }
                                    className="block w-full rounded-lg border border-slate-300 px-3 py-2 pr-10 font-mono text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowSecret(!showSecret)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showSecret ? (
                                        <svg
                                            className="h-5 w-5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                                            />
                                        </svg>
                                    ) : (
                                        <svg
                                            className="h-5 w-5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                            />
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                            />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                                {existingConfig
                                    ? "Leave blank to keep your current secret"
                                    : "Found in your Razorpay Dashboard → API Keys"}
                            </p>
                        </div>

                        {/* Razorpay Webhook Secret (Optional) */}
                        <div>
                            <label
                                htmlFor="razorpayWebhookSecret"
                                className="block text-sm font-medium text-slate-700"
                            >
                                Razorpay Webhook Secret{" "}
                                <span className="text-slate-400">
                                    (optional)
                                </span>
                            </label>
                            <input
                                type={showSecret ? "text" : "password"}
                                id="razorpayWebhookSecret"
                                name="razorpayWebhookSecret"
                                value={formData.razorpayWebhookSecret}
                                onChange={handleChange}
                                maxLength={300}
                                placeholder={
                                    existingConfig
                                        ? "(Leave blank to keep current)"
                                        : "For webhook verification"
                                }
                                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                            />
                            <p className="mt-1 text-xs text-slate-500">
                                Found in Razorpay Dashboard → Webhooks. Required
                                for payment confirmations.
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            {existingConfig && (
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                                >
                                    {deleting
                                        ? "Deleting..."
                                        : "Delete Configuration"}
                                </button>
                            )}
                            <div className="flex gap-4 sm:ml-auto">
                                <Link
                                    to="/seller/dashboard"
                                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                >
                                    Cancel
                                </Link>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {saving
                                        ? "Saving..."
                                        : existingConfig
                                          ? "Update Configuration"
                                          : "Save Configuration"}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </main>

            <AppFooter />
        </div>
    );
};

export default SellerRazorpayConfigView;
