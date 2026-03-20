import { useEffect, useMemo, useState } from "react";
import mainBannerApi from "../../../core/api/mainBannerApi";
import getApiErrorMessage from "../../../core/utils/apiError";
import AdminConsoleLayout from "../components/AdminConsoleLayout";

const initialForm = {
  mainBannerId: null,
  headline: "",
  subheadline: "",
  description: "",
  imageUrl: "",
  primaryCtaLabel: "",
  primaryCtaUrl: "",
  secondaryCtaLabel: "",
  secondaryCtaUrl: "",
  badgeText: "",
  displayOrder: 0,
  startDt: "",
  endDt: "",
  isActive: true,
};

const toDateTimeInputValue = (value) => {
  if (!value) {
    return "";
  }
  const asString = String(value);
  return asString.length >= 16 ? asString.slice(0, 16) : asString;
};

const toApiDateTime = (value) => {
  if (!value) {
    return null;
  }
  return value.length === 16 ? `${value}:00` : value;
};

const orderByDisplayOrder = (a, b) => {
  const orderA = Number(a?.displayOrder ?? 0);
  const orderB = Number(b?.displayOrder ?? 0);
  if (orderA !== orderB) {
    return orderA - orderB;
  }
  return Number(a?.mainBannerId ?? 0) - Number(b?.mainBannerId ?? 0);
};

const AdminMainBannersView = () => {
  const [banners, setBanners] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [draggingBannerId, setDraggingBannerId] = useState(null);

  const loadBanners = async () => {
    setIsLoading(true);
    try {
      const response = await mainBannerApi.getAdminMainBanners();
      const payload = Array.isArray(response?.data?.data) ? response.data.data : [];
      setBanners(payload);
    } catch (err) {
      setBanners([]);
      setError(getApiErrorMessage(err, "Unable to load main banners."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const filteredBanners = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return banners;
    }
    return banners.filter((banner) =>
      [
        banner?.headline,
        banner?.subheadline,
        banner?.primaryCtaUrl,
        banner?.secondaryCtaUrl,
        banner?.badgeText,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [banners, search]);

  const orderedBanners = useMemo(
    () => [...filteredBanners].sort(orderByDisplayOrder),
    [filteredBanners],
  );

  const resetForm = () => {
    setForm(initialForm);
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    if (error || success) {
      setError("");
      setSuccess("");
    }
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const payload = {
        headline: form.headline.trim(),
        subheadline: form.subheadline.trim() || null,
        description: form.description.trim() || null,
        imageUrl: form.imageUrl.trim() || null,
        primaryCtaLabel: form.primaryCtaLabel.trim() || null,
        primaryCtaUrl: form.primaryCtaUrl.trim() || null,
        secondaryCtaLabel: form.secondaryCtaLabel.trim() || null,
        secondaryCtaUrl: form.secondaryCtaUrl.trim() || null,
        badgeText: form.badgeText.trim() || null,
        displayOrder: Number(form.displayOrder || 0),
        startDt: toApiDateTime(form.startDt),
        endDt: toApiDateTime(form.endDt),
        isActive: Boolean(form.isActive),
      };

      if (form.mainBannerId) {
        await mainBannerApi.updateMainBanner(form.mainBannerId, payload);
        setSuccess("Main banner updated successfully.");
      } else {
        await mainBannerApi.createMainBanner(payload);
        setSuccess("Main banner created successfully.");
      }

      resetForm();
      await loadBanners();
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to save main banner."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (banner) => {
    setForm({
      mainBannerId: banner.mainBannerId,
      headline: banner.headline || "",
      subheadline: banner.subheadline || "",
      description: banner.description || "",
      imageUrl: banner.imageUrl || "",
      primaryCtaLabel: banner.primaryCtaLabel || "",
      primaryCtaUrl: banner.primaryCtaUrl || "",
      secondaryCtaLabel: banner.secondaryCtaLabel || "",
      secondaryCtaUrl: banner.secondaryCtaUrl || "",
      badgeText: banner.badgeText || "",
      displayOrder: Number(banner.displayOrder || 0),
      startDt: toDateTimeInputValue(banner.startDt),
      endDt: toDateTimeInputValue(banner.endDt),
      isActive: Boolean(banner.isActive),
    });
    setError("");
    setSuccess("");
  };

  const handleToggleStatus = async (banner) => {
    if (!banner?.mainBannerId) {
      return;
    }
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      if (banner.isActive) {
        await mainBannerApi.deactivateMainBanner(banner.mainBannerId);
        setSuccess(`Main banner "${banner.headline}" deactivated.`);
      } else {
        await mainBannerApi.activateMainBanner(banner.mainBannerId);
        setSuccess(`Main banner "${banner.headline}" activated.`);
      }
      await loadBanners();
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to update main banner status."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const buildMainBannerUpdatePayload = (banner, displayOrder) => ({
    headline: banner?.headline?.trim() || "",
    subheadline: banner?.subheadline?.trim() || null,
    description: banner?.description?.trim() || null,
    imageUrl: banner?.imageUrl?.trim() || null,
    primaryCtaLabel: banner?.primaryCtaLabel?.trim() || null,
    primaryCtaUrl: banner?.primaryCtaUrl?.trim() || null,
    secondaryCtaLabel: banner?.secondaryCtaLabel?.trim() || null,
    secondaryCtaUrl: banner?.secondaryCtaUrl?.trim() || null,
    badgeText: banner?.badgeText?.trim() || null,
    displayOrder: Number(displayOrder || 0),
    startDt: toApiDateTime(toDateTimeInputValue(banner?.startDt)),
    endDt: toApiDateTime(toDateTimeInputValue(banner?.endDt)),
    isActive: Boolean(banner?.isActive),
  });

  const persistBannerOrder = async (orderedItems) => {
    const normalized = orderedItems.map((item, index) => ({ ...item, displayOrder: index }));
    const oldOrderById = new Map(banners.map((item) => [item.mainBannerId, Number(item.displayOrder ?? 0)]));
    const changed = normalized.filter(
      (item) => oldOrderById.get(item.mainBannerId) !== Number(item.displayOrder ?? 0),
    );

    if (!changed.length) {
      return;
    }

    setError("");
    setSuccess("");
    setIsSubmitting(true);
    try {
      await Promise.all(
        changed.map((item) =>
          mainBannerApi.updateMainBanner(
            item.mainBannerId,
            buildMainBannerUpdatePayload(item, item.displayOrder),
          ),
        ),
      );
      setBanners(normalized);
      setSuccess("Main banner order updated successfully.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to reorder main banners."));
      await loadBanners();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBannerDragStart = (event, bannerId) => {
    if (search.trim()) {
      event.preventDefault();
      setError("Clear search before reordering main banners.");
      return;
    }
    setDraggingBannerId(bannerId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(bannerId));
  };

  const handleBannerDrop = async (targetBannerId) => {
    if (!draggingBannerId || draggingBannerId === targetBannerId) {
      return;
    }
    const ordered = [...banners].sort(orderByDisplayOrder);
    const fromIndex = ordered.findIndex((item) => item.mainBannerId === draggingBannerId);
    const toIndex = ordered.findIndex((item) => item.mainBannerId === targetBannerId);
    if (fromIndex < 0 || toIndex < 0) {
      return;
    }
    const moved = [...ordered];
    const [draggedItem] = moved.splice(fromIndex, 1);
    moved.splice(toIndex, 0, draggedItem);
    await persistBannerOrder(moved);
  };

  return (
    <AdminConsoleLayout
      activeNav="mainBanners"
      title="Main Banner"
      subtitle="Marketing/Main Banner"
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search main banners..."
      topActions={
        <button
          type="button"
          onClick={loadBanners}
          className="h-10 rounded-xl border border-[#d8dde6] bg-white px-3 text-xs font-semibold text-[#334155]"
        >
          Refresh
        </button>
      }
    >
      <div className="space-y-4">
        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        ) : null}
        {success ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {success}
          </div>
        ) : null}

        <section className="grid gap-4 xl:grid-cols-[1.1fr_1.6fr]">
          <article className="rounded-2xl border border-[#e2e6ee] bg-white p-3 sm:p-4">
            <h2 className="text-base font-semibold text-[#111827]">
              {form.mainBannerId ? "Update Main Banner" : "Create Main Banner"}
            </h2>

            <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">Headline</span>
                <input
                  type="text"
                  name="headline"
                  value={form.headline}
                  onChange={handleChange}
                  placeholder="Hero headline"
                  required
                  className="h-10 w-full rounded-lg border border-[#d8dde6] bg-white px-3 text-sm text-[#334155] outline-none focus:border-[#94a3b8]"
                />
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">Subheadline</span>
                <input
                  type="text"
                  name="subheadline"
                  value={form.subheadline}
                  onChange={handleChange}
                  placeholder="Short supporting text"
                  className="h-10 w-full rounded-lg border border-[#d8dde6] bg-white px-3 text-sm text-[#334155] outline-none focus:border-[#94a3b8]"
                />
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">Description</span>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Optional description"
                  className="w-full rounded-lg border border-[#d8dde6] bg-white px-3 py-2 text-sm text-[#334155] outline-none focus:border-[#94a3b8]"
                />
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">Image URL</span>
                <input
                  type="url"
                  name="imageUrl"
                  value={form.imageUrl}
                  onChange={handleChange}
                  placeholder="https://... (optional)"
                  className="h-10 w-full rounded-lg border border-[#d8dde6] bg-white px-3 text-sm text-[#334155] outline-none focus:border-[#94a3b8]"
                />
              </label>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">Primary CTA Label</span>
                  <input
                    type="text"
                    name="primaryCtaLabel"
                    value={form.primaryCtaLabel}
                    onChange={handleChange}
                    placeholder="Start Shopping"
                    className="h-10 w-full rounded-lg border border-[#d8dde6] bg-white px-3 text-sm text-[#334155] outline-none focus:border-[#94a3b8]"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">Primary CTA URL</span>
                  <input
                    type="text"
                    name="primaryCtaUrl"
                    value={form.primaryCtaUrl}
                    onChange={handleChange}
                    placeholder="/client or https://..."
                    className="h-10 w-full rounded-lg border border-[#d8dde6] bg-white px-3 text-sm text-[#334155] outline-none focus:border-[#94a3b8]"
                  />
                </label>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">Secondary CTA Label</span>
                  <input
                    type="text"
                    name="secondaryCtaLabel"
                    value={form.secondaryCtaLabel}
                    onChange={handleChange}
                    placeholder="Sign In"
                    className="h-10 w-full rounded-lg border border-[#d8dde6] bg-white px-3 text-sm text-[#334155] outline-none focus:border-[#94a3b8]"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">Secondary CTA URL</span>
                  <input
                    type="text"
                    name="secondaryCtaUrl"
                    value={form.secondaryCtaUrl}
                    onChange={handleChange}
                    placeholder="/login or https://..."
                    className="h-10 w-full rounded-lg border border-[#d8dde6] bg-white px-3 text-sm text-[#334155] outline-none focus:border-[#94a3b8]"
                  />
                </label>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">Badge Text</span>
                  <input
                    type="text"
                    name="badgeText"
                    value={form.badgeText}
                    onChange={handleChange}
                    placeholder="Limited time"
                    className="h-10 w-full rounded-lg border border-[#d8dde6] bg-white px-3 text-sm text-[#334155] outline-none focus:border-[#94a3b8]"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">Display Order (optional)</span>
                  <input
                    type="number"
                    min="0"
                    name="displayOrder"
                    value={form.displayOrder}
                    onChange={handleChange}
                    className="h-10 w-full rounded-lg border border-[#d8dde6] bg-white px-3 text-sm text-[#334155] outline-none focus:border-[#94a3b8]"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">Active</span>
                  <div className="flex h-10 items-center rounded-lg border border-[#d8dde6] bg-white px-3">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={form.isActive}
                      onChange={handleChange}
                      className="h-4 w-4"
                    />
                    <span className="ml-2 text-sm text-[#334155]">Enable banner</span>
                  </div>
                </label>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">Start Date</span>
                  <input
                    type="datetime-local"
                    name="startDt"
                    value={form.startDt}
                    onChange={handleChange}
                    className="h-10 w-full rounded-lg border border-[#d8dde6] bg-white px-3 text-sm text-[#334155] outline-none focus:border-[#94a3b8]"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">End Date</span>
                  <input
                    type="datetime-local"
                    name="endDt"
                    value={form.endDt}
                    onChange={handleChange}
                    className="h-10 w-full rounded-lg border border-[#d8dde6] bg-white px-3 text-sm text-[#334155] outline-none focus:border-[#94a3b8]"
                  />
                </label>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 rounded-lg bg-[#111827] px-4 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : form.mainBannerId ? "Update Banner" : "Create Banner"}
                </button>
                {form.mainBannerId ? (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="h-10 rounded-lg border border-[#d8dde6] px-4 text-sm font-semibold text-[#334155]"
                  >
                    Cancel Edit
                  </button>
                ) : null}
              </div>
            </form>
          </article>

          <article className="rounded-2xl border border-[#e2e6ee] bg-white p-3 sm:p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-[#111827]">Main Banner List</h2>
              <p className="text-xs text-[#94a3b8]">{orderedBanners.length} total</p>
            </div>

            {isLoading ? (
              <p className="text-sm text-[#64748b]">Loading main banners...</p>
            ) : orderedBanners.length ? (
              <div className="overflow-x-auto rounded-xl border border-[#edf0f3]">
                <table className="min-w-full border-collapse bg-white">
                  <thead>
                    <tr className="border-b border-[#edf0f3] text-left text-xs uppercase tracking-[0.08em] text-[#94a3b8]">
                      <th className="px-3 py-2">Poster</th>
                      <th className="px-3 py-2">Details</th>
                      <th className="px-3 py-2">Order</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderedBanners.map((banner, index) => (
                      <tr
                        key={banner.mainBannerId}
                        className="border-b border-[#f1f5f9] text-sm text-[#334155]"
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={async () => {
                          await handleBannerDrop(banner.mainBannerId);
                          setDraggingBannerId(null);
                        }}
                      >
                        <td className="px-3 py-2">
                          {banner.imageUrl ? (
                            <img
                              src={banner.imageUrl}
                              alt={banner.headline || "Main banner poster"}
                              className="h-14 w-24 rounded-md border border-[#e2e8f0] object-cover"
                              loading="lazy"
                            />
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <p className="max-w-[280px] truncate font-medium text-[#111827]" title={banner.headline}>
                            {banner.headline}
                          </p>
                          <p className="max-w-[280px] truncate text-xs text-[#64748b]" title={banner.primaryCtaUrl || "-"}>
                            Primary CTA: {banner.primaryCtaUrl || "-"}
                          </p>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              draggable={!isSubmitting && !search.trim()}
                              onDragStart={(event) => handleBannerDragStart(event, banner.mainBannerId)}
                              onDragEnd={() => setDraggingBannerId(null)}
                              disabled={isSubmitting || Boolean(search.trim())}
                              className="h-7 rounded-md border border-[#d8dde6] px-2 text-xs font-semibold text-[#334155] disabled:opacity-40"
                              title="Drag to reorder"
                            >
                              Drag
                            </button>
                            <span>{Number(banner.displayOrder ?? index) + 1}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-semibold ${
                              banner.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {banner.isActive ? "ACTIVE" : "INACTIVE"}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleEdit(banner)}
                              className="h-8 rounded-md border border-[#d8dde6] px-2 text-xs font-semibold text-[#334155]"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(banner)}
                              disabled={isSubmitting}
                              className={`h-8 rounded-md px-2 text-xs font-semibold ${
                                banner.isActive
                                  ? "border border-rose-300 text-rose-700"
                                  : "border border-emerald-300 text-emerald-700"
                              }`}
                            >
                              {banner.isActive ? "Deactivate" : "Activate"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-[#64748b]">No main banners found.</p>
            )}
          </article>
        </section>
      </div>
    </AdminConsoleLayout>
  );
};

export default AdminMainBannersView;
