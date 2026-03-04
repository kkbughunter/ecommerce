import { useNavigate } from "react-router-dom";
import { clearAuthSession, getAuthMeta } from "../../../core/auth/session";
import FullLayout from "../../../layouts/FullLayout";

const ClientHomeView = () => {
  const navigate = useNavigate();
  const authMeta = getAuthMeta();

  const handleLogout = () => {
    clearAuthSession();
    navigate("/login", { replace: true });
  };

  return (
    <FullLayout
      title="Welcome, User"
      subtitle="Login routing is complete for user role. Next step is product browsing, cart, checkout, and payment UI."
      onLogout={handleLogout}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-violet-100 bg-violet-50/50 p-4">
          <h2 className="text-sm font-semibold text-violet-800">Session</h2>
          <p className="mt-2 text-sm text-slate-700">
            <span className="font-semibold">Email:</span> {authMeta.email || "-"}
          </p>
          <p className="mt-1 text-sm text-slate-700">
            <span className="font-semibold">User ID:</span> {authMeta.userId || "-"}
          </p>
          <p className="mt-1 text-sm text-slate-700">
            <span className="font-semibold">Role:</span>{" "}
            {(authMeta.roles || []).join(", ") || "-"}
          </p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h2 className="text-sm font-semibold text-slate-800">Upcoming Modules</h2>
          <ul className="mt-2 space-y-1 text-sm text-slate-600">
            <li>Product listing and product detail</li>
            <li>Cart and checkout flow</li>
            <li>Razorpay payment and order history</li>
          </ul>
        </article>
      </div>
    </FullLayout>
  );
};

export default ClientHomeView;
