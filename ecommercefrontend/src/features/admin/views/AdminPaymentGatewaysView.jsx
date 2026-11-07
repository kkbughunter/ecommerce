import { useEffect, useState } from "react";
import paymentApi from "../../../core/api/paymentApi";
import getApiErrorMessage from "../../../core/utils/apiError";
import AdminConsoleLayout from "../components/AdminConsoleLayout";

export default function AdminPaymentGatewaysView() {
  const [gateways, setGateways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    let active = true;
    paymentApi.getGatewaySettings().then((response) => {
      if (active) setGateways(response?.data?.data || []);
    }).catch((err) => {
      if (active) setError(getApiErrorMessage(err, "Unable to load gateway settings."));
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const toggle = async (gateway) => {
    setSaving(gateway.gateway); setError(""); setMessage("");
    try {
      const response = await paymentApi.updateGateway(gateway.gateway, !gateway.enabled);
      setGateways((previous) => previous.map((item) => item.gateway === gateway.gateway ? response.data.data : item));
      setMessage(`${gateway.gateway === "CASHFREE" ? "Cashfree" : "Razorpay"} ${gateway.enabled ? "disabled" : "enabled"}.`);
    } catch (err) { setError(getApiErrorMessage(err, "Unable to update payment gateway.")); }
    finally { setSaving(""); }
  };
  return <AdminConsoleLayout activeNav="paymentGateways" title="Payment Gateways" subtitle="Choose which payment gateways customers can use. You can enable both.">
    {error && <p role="alert" className="mb-4 text-sm text-red-600">{error}</p>}
    {message && <p role="status" className="mb-4 text-sm text-emerald-700">{message}</p>}
    {loading ? <p>Loading payment gateways...</p> : <div className="grid gap-4 md:grid-cols-2">
      {gateways.map((gateway) => <section key={gateway.gateway} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">{gateway.gateway === "CASHFREE" ? "Cashfree" : "Razorpay"}</h2>
        <p className={`text-sm ${gateway.configured ? "text-emerald-700" : "text-amber-700"}`}>
          {gateway.configured ? "Credentials configured" : "Credentials not configured — contact the development team."}
        </p>
        <p className="text-sm text-slate-600">{gateway.available ? "Available at checkout" : "Unavailable at checkout"}</p>
        <label className="flex items-center gap-3 text-sm font-semibold">
          <input type="checkbox" role="switch" checked={gateway.enabled}
            disabled={!!saving || (!gateway.configured && !gateway.enabled)} onChange={() => toggle(gateway)} />
          {saving === gateway.gateway ? "Saving..." : gateway.enabled ? "Enabled" : "Disabled"}
        </label>
      </section>)}
    </div>}
    {!loading && gateways.length > 0 && !gateways.some((gateway) => gateway.available) &&
      <p className="mt-4 text-sm text-amber-700">No payment gateway is available. Customers cannot complete online checkout.</p>}
  </AdminConsoleLayout>;
}
