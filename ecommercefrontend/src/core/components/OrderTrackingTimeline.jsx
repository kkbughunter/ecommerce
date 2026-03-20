const TRACKING_STEPS = [
  {
    key: "CONFIRMED",
    label: "Confirmed",
    iconPath:
      "M7 4h-2l-1 2v2h2l3.6 7.59-1.35 2.44A1 1 0 0 0 9.1 19h11v-2h-9.72l.88-1.6h7.45a2 2 0 0 0 1.74-1.01L23 7H8.42l-.94-2zM10 20a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm9 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z",
    statuses: ["PLACED", "CONFIRMED"],
  },
  {
    key: "PACKED",
    label: "Packed",
    iconPath:
      "M21 8.5 12 3 3 8.5v7L12 21l9-5.5v-7zm-9 10.2-6-3.7V9.6l6 3.7v5.4zm1-5.4 6-3.7V15l-6 3.7v-5.4zm5.9-5.3L12 11.7 6.1 8l5.9-3.5L18.9 8z",
    statuses: ["CONFIRMED", "PACKED"],
  },
  {
    key: "SHIPPED",
    label: "Shipped",
    iconPath:
      "M3 6h10v8h2.5l2-3H21v5h-2a3 3 0 1 1-6 0H9a3 3 0 1 1-6 0H1V9h2V6zm3 12a1.2 1.2 0 1 0 0 2.4A1.2 1.2 0 0 0 6 18zm10 0a1.2 1.2 0 1 0 0 2.4A1.2 1.2 0 0 0 16 18z",
    statuses: ["SHIPPED"],
  },
  {
    key: "OUT_FOR_DELIVERY",
    label: "Out for Delivery",
    iconPath:
      "M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z",
    statuses: ["OUT_FOR_DELIVERY"],
  },
  {
    key: "DELIVERED",
    label: "Delivered",
    iconPath:
      "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z",
    statuses: ["DELIVERED", "RETURN_REQUESTED", "RETURNED"],
  },
];

const STATUS_TO_INDEX = {
  PLACED: 0,
  CONFIRMED: 0,
  PACKED: 1,
  SHIPPED: 2,
  OUT_FOR_DELIVERY: 3,
  DELIVERED: 4,
  RETURN_REQUESTED: 4,
  RETURNED: 4,
};

const formatStepDate = (value) => {
  if (!value) {
    return "Pending";
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

const toSafeEventDate = (value) => {
  const parsed = new Date(value || "");
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
};

const getActiveIndexFromEvents = (trackingEvents = []) => {
  const highest = trackingEvents.reduce((currentMax, event) => {
    const eventStatus = String(event?.status || "").toUpperCase();
    const nextIndex =
      typeof STATUS_TO_INDEX[eventStatus] === "number" ? STATUS_TO_INDEX[eventStatus] : currentMax;
    return Math.max(currentMax, nextIndex);
  }, 0);
  return highest;
};

const getStepDate = (trackingEvents, step) => {
  const sorted = [...(trackingEvents || [])].sort(
    (a, b) => toSafeEventDate(a?.eventTime) - toSafeEventDate(b?.eventTime),
  );
  const match = sorted.find((event) =>
    step.statuses.includes(String(event?.status || "").toUpperCase()),
  );
  return match?.eventTime || null;
};

const OrderTrackingTimeline = ({
  currentStatus = "",
  trackingEvents = [],
  trackingId = "",
  className = "",
}) => {
  const normalizedStatus = String(currentStatus || "").toUpperCase();
  const computedActiveIndex =
    typeof STATUS_TO_INDEX[normalizedStatus] === "number"
      ? STATUS_TO_INDEX[normalizedStatus]
      : getActiveIndexFromEvents(trackingEvents);
  const activeIndex = Math.min(Math.max(computedActiveIndex, 0), TRACKING_STEPS.length - 1);
  const progressWidth = (activeIndex / (TRACKING_STEPS.length - 1)) * 100;
  const isCancelled = normalizedStatus === "CANCELLED";
  const isReturned = normalizedStatus === "RETURNED";

  return (
    <section className={`rounded-2xl border border-[#dbeafe] bg-white p-4 ${className}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-[#1f2937]">Order Tracking</p>
        {trackingId ? <p className="text-xs text-[#64748b]">Tracking ID {trackingId}</p> : null}
      </div>

      <div className="space-y-3 md:hidden">
        {TRACKING_STEPS.map((step, index) => {
          const reached = index <= activeIndex;
          const isCurrent = index === activeIndex;
          const isLast = index === TRACKING_STEPS.length - 1;
          return (
            <div key={`mobile-${step.key}`} className="flex gap-3">
              <div className="flex w-12 flex-col items-center">
                <div
                  className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border ${
                    reached
                      ? "border-blue-300 bg-[linear-gradient(160deg,#2563eb,#0284c7)] text-white"
                      : "border-slate-200 bg-slate-100 text-slate-400"
                  } ${isCurrent ? "ring-2 ring-blue-200 ring-offset-2" : ""}`}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
                    <path d={step.iconPath} />
                  </svg>
                </div>
                {!isLast ? <div className={`mt-1 h-8 w-[2px] ${reached ? "bg-blue-300" : "bg-slate-200"}`} /> : null}
              </div>
              <div className="flex-1 pb-1">
                <p className="text-xs font-semibold text-[#111827]">{step.label}</p>
                <p className="mt-0.5 text-[11px] text-[#64748b]">{formatStepDate(getStepDate(trackingEvents, step))}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="hidden overflow-x-auto pb-2 md:block">
        <div className="relative min-w-[760px] px-2 pt-2">
          <div className="absolute left-8 right-8 top-[47px] h-[4px] rounded-full bg-[#dbeafe]" />
          <div
            className="absolute left-8 top-[47px] h-[4px] rounded-full bg-[linear-gradient(90deg,#2563eb,#0284c7)] transition-[width] duration-300"
            style={{ width: `calc((100% - 64px) * ${progressWidth / 100})` }}
          />

          <div className="grid grid-cols-5">
            {TRACKING_STEPS.map((step, index) => {
              const reached = index <= activeIndex;
              const isCurrent = index === activeIndex;
              return (
                <div key={step.key} className="flex flex-col items-center text-center">
                  <div
                    className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full border ${
                      reached
                        ? "border-blue-300 bg-[linear-gradient(160deg,#2563eb,#0284c7)] text-white"
                        : "border-slate-200 bg-slate-100 text-slate-400"
                    } ${isCurrent ? "ring-2 ring-blue-200 ring-offset-2" : ""}`}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
                      <path d={step.iconPath} />
                    </svg>
                  </div>
                  <p className="mt-3 text-xs font-semibold text-[#111827]">{step.label}</p>
                  <p className="mt-1 text-[11px] text-[#64748b]">
                    {formatStepDate(getStepDate(trackingEvents, step))}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {isCancelled ? (
        <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
          This order has been cancelled.
        </p>
      ) : null}
      {isReturned ? (
        <p className="mt-3 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-medium text-violet-700">
          This order was returned after delivery.
        </p>
      ) : null}
    </section>
  );
};

export default OrderTrackingTimeline;
