import { useEffect, useState } from "react";
import paymentApi from "../../../core/api/paymentApi";
import getApiErrorMessage from "../../../core/utils/apiError";

export default function usePaymentGateways() {
  const [gateways, setGateways] = useState([]);
  const [selectedGateway, setSelectedGateway] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    paymentApi.getAvailableGateways().then((response) => {
      if (!active) return;
      const available = response?.data?.data || [];
      setGateways(available);
      setSelectedGateway(available[0] || "");
    }).catch((err) => {
      if (active) setError(getApiErrorMessage(err, "Unable to load payment options. Please refresh."));
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  return { gateways, selectedGateway, setSelectedGateway, loading, error };
}
