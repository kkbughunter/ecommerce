import { useEffect, useMemo, useState } from "react";
import homeSliderApi from "../../../core/api/homeSliderApi";
import getApiErrorMessage from "../../../core/utils/apiError";
import AdminConsoleLayout from "../components/AdminConsoleLayout";

const PLACEMENT_OPTIONS = [
  { value: "LIMITED_OFFER", label: "Limited Offer" },
  { value: "CATEGORY_HIGHLIGHT", label: "Category Highlight" },
];

const initialForm = {
  homeSliderId: null,
  title: "",
  subtitle: "",
  description: "",
  imageUrl: "",
  ctaLabel: "",
  targetUrl: "",
  placementTag: "LIMITED_OFFER",
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

const AdminSlidersView = () => {
  const [sliders, setSliders] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [filterTag, setFilterTag] = useState("");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadSliders = async (tag = filterTag) => {
    setIsLoading(true);
    try {
      const params = tag ? { tag } : {};
      const response = await homeSliderApi.getAdminSliders(params);
      const payload = Array.isArray(response?.data?.data) ? response.data.data : [];
      setSliders(payload);
    } catch (err) {
      setSliders([]);
      setError(getApiErrorMessage(err, "Unable to load sliders."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSliders("");
  }, []);

  const filteredSliders = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return sliders;
    }
    return sliders.filter((slider) =>
      [slider?.title, slider?.subtitle, slider?.targetUrl, slider?.placementTag]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [search, sliders]);

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
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || null,
        description: form.description.trim() || null,
        imageUrl: form.imageUrl.trim(),
        ctaLabel: form.ctaLabel.trim() || null,
        targetUrl: form.targetUrl.trim(),
        placementTag: form.placementTag,
        displayOrder: Number(form.displayOrder || 0),
        startDt: toApiDateTime(form.startDt),
        endDt: toApiDateTime(form.endDt),
        isActive: Boolean(form.isActive),
      };

      if (form.homeSliderId) {
        await homeSliderApi.updateSlider(form.homeSliderId, payload);
        setSuccess("Slider updated successfully.");
      } else {
        await homeSliderApi.createSlider(payload);
        setSuccess("Slider created successfully.");
      }

      resetForm();
      await loadSliders(filterTag);
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to save slider."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (slider) => {
    setForm({
      homeSliderId: slider.homeSliderId,
      title: slider.title || "",
      subtitle: slider.subtitle || "",
      description: slider.description || "",
      imageUrl: slider.imageUrl || "",
      ctaLabel: slider.ctaLabel || "",
      targetUrl: slider.targetUrl || "",
      placementTag: slider.placementTag || "LIMITED_OFFER",
      displayOrder: Number(slider.displayOrder || 0),
      startDt: toDateTimeInputValue(slider.startDt),
      endDt: toDateTimeInputValue(slider.endDt),
      isActive: Boolean(slider.isActive),
    });
    setError("");
    setSuccess("");
  };

  const handleToggleStatus = async (slider) => {
    if (!slider?.homeSliderId) {
      return;
    }
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      if (slider.isActive) {
        await homeSliderApi.deactivateSlider(slider.homeSliderId);
        setSuccess(`Slider "${slider.title}" deactivated.`);
      } else {
        await homeSliderApi.activateSlider(slider.homeSliderId);
        setSuccess(`Slider "${slider.title}" activated.`);
      }
      await loadSliders(filterTag);
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to update slider status."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminConsoleLayout
      activeNav="sliders"
      title="Homepage Sliders"
      subtitle="Manage banner/slider posters for Limited Offer and Category Highlight sections."
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search sliders..."
      topActions={
        <div className="flex gap-2">
          <select
            value={filterTag}
            onChange={(event) => {
              const nextTag = event.target.value;
              setFilterTag(nextTag);
              loadSliders(nextTag);
            }}
            className="h-10 rounded-xl border border-[#d8dde6] bg-white px-3 text-xs font-semibold text-[#334155]"
          >
            <option value="">All Tags</option>
            {PLACEMENT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => loadSliders(filterTag)}
            className="h-10 rounded-xl border border-[#d8dde6] bg-white px-3 text-xs font-semibold text-[#334155]"
          >
            Refresh
          </button>
        </div>
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
          <article className="rounded-2xl border border-[#e2e6ee] bg-white p-4">
            <h2 className="text-base font-semibold text-[#111827]">
              {form.homeSliderId ? "Update Slider" : "Create Slider"}
            </h2>
            <p className="mt-1 text-xs text-[#64748b]">
              Add poster image URL, details, target URL and placement tag.
            </p>

            <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">Title</span>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Limited offer title"
                  required
                  className="h-10 w-full rounded-lg border border-[#d8dde6] bg-white px-3 text-sm text-[#334155] outline-none focus:border-[#94a3b8]"
                />
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">Subtitle</span>
                <input
                  type="text"
                  name="subtitle"
                  value={form.subtitle}
                  onChange={handleChange}
                  placeholder="Short subtitle"
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
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">Poster Image URL</span>
                <input
                  type="url"
                  name="imageUrl"
                  value={form.imageUrl}
                  onChange={handleChange}
                  placeholder="https://..."
                  required
                  className="h-10 w-full rounded-lg border border-[#d8dde6] bg-white px-3 text-sm text-[#334155] outline-none focus:border-[#94a3b8]"
                />
              </label>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">CTA Label</span>
                  <input
                    type="text"
                    name="ctaLabel"
                    value={form.ctaLabel}
                    onChange={handleChange}
                    placeholder="Start Shopping"
                    className="h-10 w-full rounded-lg border border-[#d8dde6] bg-white px-3 text-sm text-[#334155] outline-none focus:border-[#94a3b8]"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">Display Order</span>
                  <input
                    type="number"
                    min="0"
                    name="displayOrder"
                    value={form.displayOrder}
                    onChange={handleChange}
                    className="h-10 w-full rounded-lg border border-[#d8dde6] bg-white px-3 text-sm text-[#334155] outline-none focus:border-[#94a3b8]"
                  />
                </label>
              </div>

              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">Target URL</span>
                <input
                  type="text"
                  name="targetUrl"
                  value={form.targetUrl}
                  onChange={handleChange}
                  placeholder="/products/1 or https://..."
                  required
                  className="h-10 w-full rounded-lg border border-[#d8dde6] bg-white px-3 text-sm text-[#334155] outline-none focus:border-[#94a3b8]"
                />
              </label>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">Placement Tag</span>
                  <select
                    name="placementTag"
                    value={form.placementTag}
                    onChange={handleChange}
                    className="h-10 w-full rounded-lg border border-[#d8dde6] bg-white px-3 text-sm text-[#334155] outline-none focus:border-[#94a3b8]"
                  >
                    {PLACEMENT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
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
                    <span className="ml-2 text-sm text-[#334155]">Enable slider</span>
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

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 rounded-lg bg-[#111827] px-4 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : form.homeSliderId ? "Update Slider" : "Create Slider"}
                </button>
                {form.homeSliderId ? (
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

          <article className="rounded-2xl border border-[#e2e6ee] bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#111827]">Slider List</h2>
              <p className="text-xs text-[#94a3b8]">{filteredSliders.length} total</p>
            </div>

            {isLoading ? (
              <p className="text-sm text-[#64748b]">Loading sliders...</p>
            ) : filteredSliders.length ? (
              <div className="overflow-x-auto rounded-xl border border-[#edf0f3]">
                <table className="min-w-full border-collapse bg-white">
                  <thead>
                    <tr className="border-b border-[#edf0f3] text-left text-xs uppercase tracking-[0.08em] text-[#94a3b8]">
                      <th className="px-3 py-2">Poster</th>
                      <th className="px-3 py-2">Details</th>
                      <th className="px-3 py-2">Placement</th>
                      <th className="px-3 py-2">Order</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSliders.map((slider) => (
                      <tr key={slider.homeSliderId} className="border-b border-[#f1f5f9] text-sm text-[#334155]">
                        <td className="px-3 py-2">
                          {slider.imageUrl ? (
                            <img
                              src={slider.imageUrl}
                              alt={slider.title || "Slider poster"}
                              className="h-14 w-24 rounded-md border border-[#e2e8f0] object-cover"
                              loading="lazy"
                            />
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <p className="max-w-[280px] truncate font-medium text-[#111827]" title={slider.title}>
                            {slider.title}
                          </p>
                          <p className="max-w-[280px] truncate text-xs text-[#64748b]" title={slider.targetUrl}>
                            {slider.targetUrl}
                          </p>
                        </td>
                        <td className="px-3 py-2">{slider.placementTag}</td>
                        <td className="px-3 py-2">{slider.displayOrder}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-semibold ${
                              slider.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {slider.isActive ? "ACTIVE" : "INACTIVE"}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleEdit(slider)}
                              className="h-8 rounded-md border border-[#d8dde6] px-2 text-xs font-semibold text-[#334155]"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(slider)}
                              disabled={isSubmitting}
                              className={`h-8 rounded-md px-2 text-xs font-semibold ${
                                slider.isActive
                                  ? "border border-rose-300 text-rose-700"
                                  : "border border-emerald-300 text-emerald-700"
                              }`}
                            >
                              {slider.isActive ? "Deactivate" : "Activate"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-[#64748b]">No sliders found.</p>
            )}
          </article>
        </section>
      </div>
    </AdminConsoleLayout>
  );
};

export default AdminSlidersView;
