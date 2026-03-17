import { useEffect, useMemo, useState } from "react";
import sellerApi from "../../../core/api/sellerApi";
import getApiErrorMessage from "../../../core/utils/apiError";
import AdminConsoleLayout from "../components/AdminConsoleLayout";

const formatDate = (value) => {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusBadgeClass = (isActive) =>
  isActive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700";

const initialRazorpayForm = {
  razorpayKeyId: "",
  razorpayKeySecret: "",
  razorpayWebhookSecret: "",
};

const AdminSellersView = () => {
  const [sellers, setSellers] = useState([]);
  const [selectedSellerId, setSelectedSellerId] = useState(null);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [razorpayConfig, setRazorpayConfig] = useState(null);
  const [razorpayForm, setRazorpayForm] = useState(initialRazorpayForm);
  const [createForm, setCreateForm] = useState({
    email: "",
    password: "",
    businessName: "",
    businessEmail: "",
    businessPhone: "",
  });
  const [search, setSearch] = useState("");
  const [isLoadingSellers, setIsLoadingSellers] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isLoadingRazorpay, setIsLoadingRazorpay] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSavingRazorpay, setIsSavingRazorpay] = useState(false);
  const [isDeletingRazorpay, setIsDeletingRazorpay] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [razorpayError, setRazorpayError] = useState("");
  const [razorpaySuccess, setRazorpaySuccess] = useState("");
  const [showRazorpaySecrets, setShowRazorpaySecrets] = useState(false);

  const loadSellers = async () => {
    setIsLoadingSellers(true);
    setError("");
    try {
      const response = await sellerApi.getSellerProfiles();
      const payload = Array.isArray(response?.data) ? response.data : [];
      setSellers(payload);
      setSelectedSellerId((current) => {
        if (current && payload.some((entry) => entry.sellerProfileId === current)) {
          return current;
        }
        return payload[0]?.sellerProfileId || null;
      });
    } catch (err) {
      setSellers([]);
      setSelectedSellerId(null);
      setSelectedSeller(null);
      setError(getApiErrorMessage(err, "Unable to load sellers."));
    } finally {
      setIsLoadingSellers(false);
    }
  };

  const loadSellerDetails = async (sellerProfileId) => {
    if (!sellerProfileId) {
      setSelectedSeller(null);
      return;
    }
    setIsLoadingDetails(true);
    setError("");
    try {
      const response = await sellerApi.getSellerProfileById(sellerProfileId);
      setSelectedSeller(response?.data || null);
    } catch (err) {
      setSelectedSeller(null);
      setError(getApiErrorMessage(err, "Unable to load seller details."));
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const loadRazorpayConfig = async (sellerProfileId) => {
    if (!sellerProfileId) {
      setRazorpayConfig(null);
      setRazorpayForm(initialRazorpayForm);
      return;
    }
    setIsLoadingRazorpay(true);
    setRazorpayError("");
    setRazorpaySuccess("");
    try {
      const response = await sellerApi.getSellerRazorpayConfig(sellerProfileId);
      const config = response?.data || null;
      setRazorpayConfig(config);
      setRazorpayForm({
        razorpayKeyId: config?.razorpayKeyId || "",
        razorpayKeySecret: "",
        razorpayWebhookSecret: "",
      });
    } catch (err) {
      if (err?.response?.status === 404) {
        setRazorpayConfig(null);
        setRazorpayForm(initialRazorpayForm);
      } else {
        setRazorpayError(getApiErrorMessage(err, "Unable to load Razorpay config."));
      }
    } finally {
      setIsLoadingRazorpay(false);
    }
  };

  useEffect(() => {
    loadSellers();
  }, []);

  useEffect(() => {
    loadSellerDetails(selectedSellerId);
    loadRazorpayConfig(selectedSellerId);
  }, [selectedSellerId]);

  const filteredSellers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return sellers;
    }
    return sellers.filter((seller) => {
      const idPart = String(seller?.sellerProfileId || "");
      const namePart = String(seller?.businessName || "").toLowerCase();
      const emailPart = String(seller?.email || "").toLowerCase();
      return idPart.includes(query) || namePart.includes(query) || emailPart.includes(query);
    });
  }, [sellers, search]);

  const selectedSellerSummary = useMemo(
    () => sellers.find((seller) => seller.sellerProfileId === selectedSellerId) || null,
    [sellers, selectedSellerId],
  );
  const razorpayStatusLabel = razorpayConfig
    ? razorpayConfig.isActive
      ? "ACTIVE"
      : "INACTIVE"
    : "NOT SET";
  const razorpayStatusClass = razorpayConfig
    ? razorpayConfig.isActive
      ? "bg-emerald-100 text-emerald-700"
      : "bg-amber-100 text-amber-700"
    : "bg-slate-100 text-slate-600";

  const toggleSellerStatus = async () => {
    if (!selectedSellerId || !selectedSeller) {
      return;
    }
    setIsUpdatingStatus(true);
    setError("");
    setSuccess("");
    try {
      const response = selectedSeller.isActive
        ? await sellerApi.deactivateSellerProfile(selectedSellerId)
        : await sellerApi.activateSellerProfile(selectedSellerId);
      setSelectedSeller(response?.data || null);
      setSuccess(
        selectedSeller.isActive ? "Seller deactivated successfully." : "Seller activated successfully.",
      );
      await loadSellers();
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to update seller status."));
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleCreateChange = (field, value) => {
    setCreateForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleRazorpayChange = (field, value) => {
    setRazorpayForm((prev) => ({ ...prev, [field]: value }));
    setRazorpayError("");
    setRazorpaySuccess("");
  };

  const handleCreateSeller = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!createForm.email.trim()) {
      setError("Email is required.");
      return;
    }
    if (!createForm.password || createForm.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!createForm.businessName.trim()) {
      setError("Business name is required.");
      return;
    }

    setIsCreating(true);
    try {
      await sellerApi.createSellerProfile({
        email: createForm.email.trim(),
        password: createForm.password,
        businessName: createForm.businessName.trim(),
        businessEmail: createForm.businessEmail.trim() || undefined,
        businessPhone: createForm.businessPhone.trim() || undefined,
      });
      setSuccess("Seller profile created successfully.");
      setCreateForm({
        email: "",
        password: "",
        businessName: "",
        businessEmail: "",
        businessPhone: "",
      });
      await loadSellers();
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to create seller profile."));
    } finally {
      setIsCreating(false);
    }
  };

  const handleSaveRazorpayConfig = async (event) => {
    event.preventDefault();
    if (!selectedSellerId) {
      return;
    }

    setRazorpayError("");
    setRazorpaySuccess("");

    if (!razorpayForm.razorpayKeyId.trim()) {
      setRazorpayError("Razorpay Key ID is required.");
      return;
    }
    if (!razorpayForm.razorpayKeySecret.trim()) {
      setRazorpayError("Razorpay Key Secret is required.");
      return;
    }

    setIsSavingRazorpay(true);
    try {
      const payload = {
        razorpayKeyId: razorpayForm.razorpayKeyId.trim(),
        razorpayKeySecret: razorpayForm.razorpayKeySecret.trim(),
        razorpayWebhookSecret: razorpayForm.razorpayWebhookSecret.trim() || undefined,
      };
      await sellerApi.saveSellerRazorpayConfig(selectedSellerId, payload);
      setRazorpayForm((prev) => ({
        ...prev,
        razorpayKeySecret: "",
        razorpayWebhookSecret: "",
      }));
      await loadRazorpayConfig(selectedSellerId);
      setRazorpaySuccess("Razorpay configuration saved.");
    } catch (err) {
      setRazorpayError(getApiErrorMessage(err, "Unable to save Razorpay config."));
    } finally {
      setIsSavingRazorpay(false);
    }
  };

  const handleDeleteRazorpayConfig = async () => {
    if (!selectedSellerId) {
      return;
    }
    if (!window.confirm("Delete this seller's Razorpay configuration? This cannot be undone.")) {
      return;
    }
    setRazorpayError("");
    setRazorpaySuccess("");
    setIsDeletingRazorpay(true);
    try {
      await sellerApi.deleteSellerRazorpayConfig(selectedSellerId);
      setRazorpayConfig(null);
      setRazorpayForm(initialRazorpayForm);
      setRazorpaySuccess("Razorpay configuration deleted.");
    } catch (err) {
      setRazorpayError(getApiErrorMessage(err, "Unable to delete Razorpay config."));
    } finally {
      setIsDeletingRazorpay(false);
    }
  };

  return (
    <AdminConsoleLayout
      activeNav="sellers"
      title="Sellers"
      subtitle="Review seller profiles and control active or inactive access."
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search by business name, email or seller ID..."
      topActions={
        <button
          type="button"
          onClick={loadSellers}
          className="h-10 rounded-xl border border-[#d8dde6] bg-white px-3 text-xs font-semibold text-[#334155]"
        >
          Refresh
        </button>
      }
    >
      <div className="space-y-4">
        <section className="rounded-2xl border border-[#e2e6ee] bg-white p-3 sm:p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-[#111827]">Create Seller</h2>
              <p className="text-xs text-[#64748b]">
                Only Super Admins can create seller profiles. User ID is generated automatically.
              </p>
            </div>
          </div>
          <form onSubmit={handleCreateSeller} className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">
              Email
              <input
                type="email"
                value={createForm.email}
                onChange={(event) => handleCreateChange("email", event.target.value)}
                className="h-10 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 text-sm font-normal text-[#334155] outline-none focus:border-[#94a3b8]"
                placeholder="seller@email.com"
                required
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">
              Password
              <input
                type="password"
                value={createForm.password}
                onChange={(event) => handleCreateChange("password", event.target.value)}
                className="h-10 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 text-sm font-normal text-[#334155] outline-none focus:border-[#94a3b8]"
                placeholder="8-32 characters"
                minLength={8}
                maxLength={32}
                required
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">
              Business Name
              <input
                type="text"
                value={createForm.businessName}
                onChange={(event) => handleCreateChange("businessName", event.target.value)}
                className="h-10 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 text-sm font-normal text-[#334155] outline-none focus:border-[#94a3b8]"
                placeholder="Business name"
                required
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">
              Business Email
              <input
                type="email"
                value={createForm.businessEmail}
                onChange={(event) => handleCreateChange("businessEmail", event.target.value)}
                className="h-10 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 text-sm font-normal text-[#334155] outline-none focus:border-[#94a3b8]"
                placeholder="business@email.com"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">
              Business Phone
              <input
                type="tel"
                value={createForm.businessPhone}
                onChange={(event) => handleCreateChange("businessPhone", event.target.value)}
                className="h-10 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 text-sm font-normal text-[#334155] outline-none focus:border-[#94a3b8]"
                placeholder="+91 9876543210"
              />
            </label>
            <div className="flex items-end md:col-span-2">
              <button
                type="submit"
                disabled={isCreating}
                className="h-10 rounded-lg bg-[#111827] px-4 text-xs font-semibold text-white disabled:opacity-60"
              >
                {isCreating ? "Creating..." : "Create Seller"}
              </button>
            </div>
          </form>
        </section>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        ) : null}
        {success ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {success}
          </div>
        ) : null}

        <section className="grid gap-4 xl:grid-cols-[1fr_1.8fr]">
          <article className="rounded-2xl border border-[#e2e6ee] bg-white p-3 sm:p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-[#111827]">Seller List</h2>
              <p className="text-xs text-[#94a3b8]">{sellers.length} total</p>
            </div>

            {isLoadingSellers ? (
              <p className="text-sm text-[#64748b]">Loading sellers...</p>
            ) : filteredSellers.length ? (
              <div className="max-h-[520px] space-y-2 overflow-auto pr-1">
                {filteredSellers.map((seller) => (
                  <button
                    key={seller.sellerProfileId}
                    type="button"
                    onClick={() => setSelectedSellerId(seller.sellerProfileId)}
                    className={`w-full rounded-xl border p-3 text-left ${
                      selectedSellerId === seller.sellerProfileId
                        ? "border-[#111827] bg-[#f8fafc]"
                        : "border-[#e5e7eb] bg-[#fbfcfd]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-[#111827]">{seller?.businessName || "-"}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getStatusBadgeClass(
                          seller?.isActive,
                        )}`}
                      >
                        {seller?.isActive ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#64748b]">{seller?.email || "-"}</p>
                    <p className="mt-1 text-xs text-[#64748b]">
                      ID #{seller.sellerProfileId} | Joined {formatDate(seller?.createdDt)}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#64748b]">No sellers found.</p>
            )}
          </article>

          <article className="rounded-2xl border border-[#e2e6ee] bg-white p-3 sm:p-4">
            {!selectedSellerId ? (
              <p className="text-sm text-[#64748b]">Select a seller to view details.</p>
            ) : isLoadingDetails ? (
              <p className="text-sm text-[#64748b]">Loading seller details...</p>
            ) : selectedSeller ? (
              <div className="space-y-4">
                <section className="rounded-xl border border-[#e8ecf2] bg-[#f8fafc] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-[#111827]">
                        {selectedSeller?.businessName || "-"}
                      </h3>
                      <p className="text-xs text-[#64748b]">{selectedSellerSummary?.email || "-"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getStatusBadgeClass(
                          selectedSeller?.isActive,
                        )}`}
                      >
                        {selectedSeller?.isActive ? "ACTIVE" : "INACTIVE"}
                      </span>
                      <button
                        type="button"
                        onClick={toggleSellerStatus}
                        disabled={isUpdatingStatus}
                        className={`h-9 rounded-lg px-3 text-xs font-semibold text-white disabled:opacity-60 ${
                          selectedSeller?.isActive ? "bg-rose-600" : "bg-emerald-600"
                        }`}
                      >
                        {isUpdatingStatus
                          ? "Updating..."
                          : selectedSeller?.isActive
                            ? "Deactivate Seller"
                            : "Activate Seller"}
                      </button>
                    </div>
                  </div>
                </section>

                <section className="grid gap-3 md:grid-cols-2">
                  <article className="rounded-xl border border-[#e8ecf2] bg-[#fbfcfd] p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">Profile</p>
                    <p className="mt-1 text-sm text-[#334155]">Seller ID: {selectedSeller.sellerProfileId}</p>
                    <p className="text-sm text-[#334155]">User ID: {selectedSeller.userId}</p>
                    <p className="text-sm text-[#334155]">Created: {formatDateTime(selectedSeller.createdDt)}</p>
                  </article>

                  <article className="rounded-xl border border-[#e8ecf2] bg-[#fbfcfd] p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">Contact</p>
                    <p className="mt-1 text-sm text-[#334155]">Email: {selectedSellerSummary?.email || "-"}</p>
                    <p className="text-sm text-[#334155]">Business Email: {selectedSeller?.businessEmail || "-"}</p>
                    <p className="text-sm text-[#334155]">Business Phone: {selectedSeller?.businessPhone || "-"}</p>
                  </article>
                </section>

                <section className="rounded-xl border border-[#e8ecf2] bg-[#fbfcfd] p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">
                        Razorpay Configuration
                      </p>
                      <p className="mt-1 text-xs text-[#64748b]">
                        Managed by Super Admins for this seller.
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${razorpayStatusClass}`}
                    >
                      {razorpayStatusLabel}
                    </span>
                  </div>

                  {isLoadingRazorpay ? (
                    <p className="mt-2 text-sm text-[#64748b]">Loading Razorpay configuration...</p>
                  ) : (
                    <div className="mt-3 space-y-3">
                      {razorpayConfig ? (
                        <div className="rounded-lg border border-[#e2e6ee] bg-white p-3 text-xs text-[#475569]">
                          <p>
                            Key ID: <span className="font-semibold text-[#111827]">{razorpayConfig.razorpayKeyId}</span>
                          </p>
                          <p className="mt-1">
                            Last Updated: {formatDateTime(razorpayConfig.modifiedDt || razorpayConfig.createdDt)}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-[#64748b]">No Razorpay configuration saved yet.</p>
                      )}

                      {razorpayError ? (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                          {razorpayError}
                        </div>
                      ) : null}
                      {razorpaySuccess ? (
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                          {razorpaySuccess}
                        </div>
                      ) : null}

                      <form onSubmit={handleSaveRazorpayConfig} className="grid gap-3 md:grid-cols-2">
                        <label className="space-y-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#64748b]">
                          Razorpay Key ID
                          <input
                            type="text"
                            value={razorpayForm.razorpayKeyId}
                            onChange={(event) => handleRazorpayChange("razorpayKeyId", event.target.value)}
                            className="h-10 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 text-sm font-normal text-[#334155] outline-none focus:border-[#94a3b8]"
                            placeholder="rzp_test_..."
                            maxLength={100}
                            required
                          />
                        </label>
                        <label className="space-y-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#64748b]">
                          Razorpay Key Secret
                          <div className="relative">
                            <input
                              type={showRazorpaySecrets ? "text" : "password"}
                              value={razorpayForm.razorpayKeySecret}
                              onChange={(event) => handleRazorpayChange("razorpayKeySecret", event.target.value)}
                              className="h-10 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 pr-12 text-sm font-normal text-[#334155] outline-none focus:border-[#94a3b8]"
                              placeholder="Required for save"
                              maxLength={300}
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowRazorpaySecrets((prev) => !prev)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-[#64748b]"
                            >
                              {showRazorpaySecrets ? "Hide" : "Show"}
                            </button>
                          </div>
                          <p className="text-[11px] font-normal text-[#94a3b8]">Required for every save.</p>
                        </label>
                        <label className="space-y-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#64748b] md:col-span-2">
                          Razorpay Webhook Secret (Optional)
                          <input
                            type={showRazorpaySecrets ? "text" : "password"}
                            value={razorpayForm.razorpayWebhookSecret}
                            onChange={(event) => handleRazorpayChange("razorpayWebhookSecret", event.target.value)}
                            className="h-10 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 text-sm font-normal text-[#334155] outline-none focus:border-[#94a3b8]"
                            placeholder="Webhook signing secret"
                            maxLength={300}
                          />
                        </label>
                        <div className="flex flex-wrap items-center gap-2 md:col-span-2">
                          <button
                            type="submit"
                            disabled={isSavingRazorpay}
                            className="h-9 rounded-lg bg-[#111827] px-4 text-xs font-semibold text-white disabled:opacity-60"
                          >
                            {isSavingRazorpay ? "Saving..." : "Save Razorpay Config"}
                          </button>
                          {razorpayConfig ? (
                            <button
                              type="button"
                              onClick={handleDeleteRazorpayConfig}
                              disabled={isDeletingRazorpay}
                              className="h-9 rounded-lg border border-rose-200 px-4 text-xs font-semibold text-rose-600 disabled:opacity-60"
                            >
                              {isDeletingRazorpay ? "Deleting..." : "Delete Config"}
                            </button>
                          ) : null}
                        </div>
                      </form>
                    </div>
                  )}
                </section>
              </div>
            ) : (
              <p className="text-sm text-[#64748b]">Seller details are unavailable.</p>
            )}
          </article>
        </section>
      </div>
    </AdminConsoleLayout>
  );
};

export default AdminSellersView;
