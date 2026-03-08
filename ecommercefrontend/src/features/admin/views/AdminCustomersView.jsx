import { useEffect, useMemo, useState } from "react";
import customerApi from "../../../core/api/customerApi";
import getApiErrorMessage from "../../../core/utils/apiError";
import AdminConsoleLayout from "../components/AdminConsoleLayout";

const formatName = (customer) => {
  const fullName = [customer?.firstName, customer?.lastName]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(" ");
  return fullName || "-";
};

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

const formatAddressLine = (address) => {
  if (!address) {
    return "-";
  }
  const line = [
    address?.line1,
    address?.line2,
    address?.landmark,
    address?.city,
    address?.district,
    address?.state,
    address?.country,
    address?.postalCode,
  ]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(", ");
  return line || "-";
};

const getStatusBadgeClass = (isActive) =>
  isActive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700";

const AdminCustomersView = () => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [search, setSearch] = useState("");
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadCustomers = async () => {
    setIsLoadingCustomers(true);
    setError("");
    try {
      const response = await customerApi.getCustomers();
      const payload = Array.isArray(response?.data?.data) ? response.data.data : [];
      setCustomers(payload);
      setSelectedCustomerId((current) => {
        if (current && payload.some((entry) => entry.customerId === current)) {
          return current;
        }
        return payload[0]?.customerId || null;
      });
    } catch (err) {
      setCustomers([]);
      setSelectedCustomerId(null);
      setSelectedCustomer(null);
      setError(getApiErrorMessage(err, "Unable to load customers."));
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  const loadCustomerDetails = async (customerId) => {
    if (!customerId) {
      setSelectedCustomer(null);
      return;
    }
    setIsLoadingDetails(true);
    setError("");
    try {
      const response = await customerApi.getCustomerById(customerId);
      setSelectedCustomer(response?.data?.data || null);
    } catch (err) {
      setSelectedCustomer(null);
      setError(getApiErrorMessage(err, "Unable to load customer details."));
    } finally {
      setIsLoadingDetails(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    loadCustomerDetails(selectedCustomerId);
  }, [selectedCustomerId]);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return customers;
    }
    return customers.filter((customer) => {
      const idPart = String(customer?.customerId || "");
      const namePart = formatName(customer).toLowerCase();
      const emailPart = String(customer?.email || "").toLowerCase();
      return idPart.includes(query) || namePart.includes(query) || emailPart.includes(query);
    });
  }, [customers, search]);

  const selectedCustomerSummary = useMemo(
    () => customers.find((customer) => customer.customerId === selectedCustomerId) || null,
    [customers, selectedCustomerId],
  );

  const toggleCustomerStatus = async () => {
    if (!selectedCustomerId || !selectedCustomer) {
      return;
    }
    setIsUpdatingStatus(true);
    setError("");
    setSuccess("");
    try {
      const response = selectedCustomer.isActive
        ? await customerApi.deactivateCustomer(selectedCustomerId)
        : await customerApi.activateCustomer(selectedCustomerId);
      setSelectedCustomer(response?.data?.data || null);
      setSuccess(selectedCustomer.isActive ? "Customer deactivated successfully." : "Customer activated successfully.");
      await loadCustomers();
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to update customer status."));
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <AdminConsoleLayout
      activeNav="customers"
      title="Customers"
      subtitle="Review customer profiles and control active/inactive account status."
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search by name, email or customer ID..."
      topActions={
        <button
          type="button"
          onClick={loadCustomers}
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

        <section className="grid gap-4 xl:grid-cols-[1fr_1.8fr]">
          <article className="rounded-2xl border border-[#e2e6ee] bg-white p-3 sm:p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-[#111827]">Customer List</h2>
              <p className="text-xs text-[#94a3b8]">{customers.length} total</p>
            </div>

            {isLoadingCustomers ? (
              <p className="text-sm text-[#64748b]">Loading customers...</p>
            ) : filteredCustomers.length ? (
              <div className="max-h-[520px] space-y-2 overflow-auto pr-1">
                {filteredCustomers.map((customer) => (
                  <button
                    key={customer.customerId}
                    type="button"
                    onClick={() => setSelectedCustomerId(customer.customerId)}
                    className={`w-full rounded-xl border p-3 text-left ${
                      selectedCustomerId === customer.customerId
                        ? "border-[#111827] bg-[#f8fafc]"
                        : "border-[#e5e7eb] bg-[#fbfcfd]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-[#111827]">{formatName(customer)}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getStatusBadgeClass(customer?.isActive)}`}>
                        {customer?.isActive ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#64748b]">{customer?.email || "-"}</p>
                    <p className="mt-1 text-xs text-[#64748b]">
                      ID #{customer.customerId} | Joined {formatDate(customer?.createdAt)}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#64748b]">No customers found.</p>
            )}
          </article>

          <article className="rounded-2xl border border-[#e2e6ee] bg-white p-3 sm:p-4">
            {!selectedCustomerId ? (
              <p className="text-sm text-[#64748b]">Select a customer to view details.</p>
            ) : isLoadingDetails ? (
              <p className="text-sm text-[#64748b]">Loading customer details...</p>
            ) : selectedCustomer ? (
              <div className="space-y-4">
                <section className="rounded-xl border border-[#e8ecf2] bg-[#f8fafc] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-[#111827]">{formatName(selectedCustomer)}</h3>
                      <p className="text-xs text-[#64748b]">{selectedCustomerSummary?.email || "-"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getStatusBadgeClass(selectedCustomer?.isActive)}`}>
                        {selectedCustomer?.isActive ? "ACTIVE" : "INACTIVE"}
                      </span>
                      <button
                        type="button"
                        onClick={toggleCustomerStatus}
                        disabled={isUpdatingStatus}
                        className={`h-9 rounded-lg px-3 text-xs font-semibold text-white disabled:opacity-60 ${
                          selectedCustomer?.isActive ? "bg-rose-600" : "bg-emerald-600"
                        }`}
                      >
                        {isUpdatingStatus
                          ? "Updating..."
                          : selectedCustomer?.isActive
                            ? "Deactivate Customer"
                            : "Activate Customer"}
                      </button>
                    </div>
                  </div>
                </section>

                <section className="grid gap-3 md:grid-cols-2">
                  <article className="rounded-xl border border-[#e8ecf2] bg-[#fbfcfd] p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">Profile</p>
                    <p className="mt-1 text-sm text-[#334155]">Customer ID: {selectedCustomer.customerId}</p>
                    <p className="text-sm text-[#334155]">User ID: {selectedCustomer.userId}</p>
                    <p className="text-sm text-[#334155]">Gender: {selectedCustomer.gender || "-"}</p>
                    <p className="text-sm text-[#334155]">Date Of Birth: {formatDate(selectedCustomer.dateOfBirth)}</p>
                    <p className="text-sm text-[#334155]">Created: {formatDateTime(selectedCustomer.createdAt)}</p>
                    <p className="text-sm text-[#334155]">Updated: {formatDateTime(selectedCustomer.updatedAt)}</p>
                  </article>

                  <article className="rounded-xl border border-[#e8ecf2] bg-[#fbfcfd] p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">Contact</p>
                    <p className="mt-1 text-sm text-[#334155]">Email: {selectedCustomerSummary?.email || "-"}</p>
                    <p className="text-sm text-[#334155]">
                      Billing Phone: {selectedCustomer?.billingAddress?.phoneNumber || "-"}
                    </p>
                    <p className="text-sm text-[#334155]">
                      Shipping Phone: {selectedCustomer?.shippingAddress?.phoneNumber || "-"}
                    </p>
                  </article>
                </section>

                <section className="grid gap-3 lg:grid-cols-2">
                  <article className="rounded-xl border border-[#e8ecf2] bg-[#fbfcfd] p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">Billing Address</p>
                    <p className="mt-1 text-sm font-semibold text-[#111827]">
                      {selectedCustomer?.billingAddress?.fullName || "-"}
                    </p>
                    <p className="text-xs text-[#64748b]">
                      Phone: {selectedCustomer?.billingAddress?.phoneNumber || "-"}
                    </p>
                    <p className="mt-1 text-xs text-[#64748b]">{formatAddressLine(selectedCustomer?.billingAddress)}</p>
                  </article>

                  <article className="rounded-xl border border-[#e8ecf2] bg-[#fbfcfd] p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">Shipping Address</p>
                    <p className="mt-1 text-sm font-semibold text-[#111827]">
                      {selectedCustomer?.shippingAddress?.fullName || "-"}
                    </p>
                    <p className="text-xs text-[#64748b]">
                      Phone: {selectedCustomer?.shippingAddress?.phoneNumber || "-"}
                    </p>
                    <p className="mt-1 text-xs text-[#64748b]">{formatAddressLine(selectedCustomer?.shippingAddress)}</p>
                  </article>
                </section>
              </div>
            ) : (
              <p className="text-sm text-[#64748b]">Customer details are unavailable.</p>
            )}
          </article>
        </section>
      </div>
    </AdminConsoleLayout>
  );
};

export default AdminCustomersView;
