import { useNavigate } from "react-router-dom";
import LegalPageShell from "../components/LegalPageShell";

const Section = ({ title, children }) => (
  <section>
    <h2 className="mb-3 text-xl font-bold text-slate-900">{title}</h2>
    <div className="space-y-2 text-sm leading-relaxed text-slate-600">{children}</div>
  </section>
);

const ReturnsRefundsView = () => {
  const navigate = useNavigate();

  return (
    <LegalPageShell title="Returns & Refunds" lastUpdated="March 20, 2026">
      {/* CTA card */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
              <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-blue-900">Need to return or get a refund?</p>
            <p className="mt-1 text-sm text-blue-700">
              All return and refund requests are handled directly by our admin team. Please contact
              us and we will assist you as quickly as possible.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href="mailto:admin@astraval.com"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
                  <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
                Email Admin
              </a>
              <button
                type="button"
                onClick={() => navigate("/client/orders")}
                className="inline-flex items-center gap-2 rounded-xl border border-blue-300 bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
                  <path d="M4 4h16v3H4V4zm0 5h16v11H4V9zm3 3v2h10v-2H7z" />
                </svg>
                View My Orders
              </button>
            </div>
          </div>
        </div>
      </div>

      <Section title="1. Our Returns Policy">
        <p>
          At <strong className="text-slate-800">Villpo Store</strong>, customer satisfaction is our
          priority. We accept return and refund requests under the conditions described below.
        </p>
        <p>
          <strong className="text-slate-800">Important:</strong> All returns and refunds are
          processed manually by our admin team. There is no automated return portal — you must
          contact us directly to initiate a request.
        </p>
      </Section>

      <Section title="2. Eligibility for Returns">
        <p>A return may be accepted if:</p>
        <ul className="ml-5 mt-2 list-disc space-y-1">
          <li>The item was received damaged, defective, or not as described.</li>
          <li>The wrong product was delivered.</li>
          <li>
            The request is raised within{" "}
            <strong className="text-slate-800">7 days of delivery</strong>.
          </li>
          <li>The item is unused, in its original packaging, with all accessories included.</li>
        </ul>
        <p className="mt-2">The following items are <strong className="text-slate-800">not eligible</strong> for return:</p>
        <ul className="ml-5 mt-2 list-disc space-y-1">
          <li>Items returned after 7 days of delivery.</li>
          <li>Used, washed, or altered products.</li>
          <li>Items without original packaging or accessories.</li>
          <li>Perishable goods or items marked as non-returnable at the time of purchase.</li>
        </ul>
      </Section>

      <Section title="3. How to Request a Return or Refund">
        <p>Follow these steps to initiate a return or refund request:</p>
        <ol className="ml-5 mt-2 list-decimal space-y-2">
          <li>
            <strong className="text-slate-800">Contact our admin team</strong> by email at{" "}
            <a
              href="mailto:admin@astraval.com"
              className="font-semibold text-blue-600 underline underline-offset-2 hover:text-blue-700"
            >
              admin@astraval.com
            </a>{" "}
            or call <strong className="text-slate-800">+91 9043368684</strong>.
          </li>
          <li>
            Provide your <strong className="text-slate-800">order number</strong>, the item(s) you
            wish to return, and the reason for the return.
          </li>
          <li>
            Attach clear photographs of the product if it is damaged or defective.
          </li>
          <li>
            Our admin will review your request within{" "}
            <strong className="text-slate-800">2–3 business days</strong> and respond with
            instructions.
          </li>
          <li>
            If approved, ship the item back using the address provided by our admin team. We
            recommend using a trackable shipping service.
          </li>
        </ol>
      </Section>

      <Section title="4. Refund Process">
        <p>Once your return is received and inspected, we will notify you of the outcome:</p>
        <ul className="ml-5 mt-2 list-disc space-y-1">
          <li>
            <strong className="text-slate-800">Approved refunds</strong> will be processed within
            5–7 business days. The amount will be credited to your original payment method via
            Razorpay.
          </li>
          <li>
            <strong className="text-slate-800">Rejected requests</strong> will be communicated with
            a reason, and the item will be returned to you if applicable.
          </li>
        </ul>
        <p className="mt-2">
          Shipping charges are non-refundable unless the return is due to our error (wrong or
          defective item).
        </p>
      </Section>

      <Section title="5. Order Cancellation">
        <p>
          Orders may be cancelled before they are shipped. To cancel, contact us immediately at{" "}
          <a
            href="mailto:admin@astraval.com"
            className="font-semibold text-blue-600 underline underline-offset-2 hover:text-blue-700"
          >
            admin@astraval.com
          </a>
          . Once an order has been dispatched, it can no longer be cancelled and must follow the
          returns process above.
        </p>
      </Section>

      <Section title="6. Exchange Policy">
        <p>
          We currently do not support direct exchanges through the website. If you wish to exchange
          a product, please contact admin to initiate a return for the original item and place a
          new order for the replacement.
        </p>
      </Section>

      <Section title="7. Contact Admin">
        <p>For all return and refund related queries:</p>
        <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="grid divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            <div className="flex items-center gap-3 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
                  <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-slate-400">Email</p>
                <a
                  href="mailto:admin@astraval.com"
                  className="text-sm font-semibold text-slate-800 hover:text-blue-600"
                >
                  admin@astraval.com
                </a>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
                  <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.61 21 3 13.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.58a1 1 0 0 1-.25 1.01l-2.2 2.2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-slate-400">Phone</p>
                <a
                  href="tel:+919043368684"
                  className="text-sm font-semibold text-slate-800 hover:text-blue-600"
                >
                  +91 9043368684
                </a>
              </div>
            </div>
          </div>
        </div>
        <p className="mt-3">
          Our admin team responds within <strong className="text-slate-800">24 hours</strong> on
          business days (Monday–Saturday, 10 AM–6 PM IST).
        </p>
      </Section>
    </LegalPageShell>
  );
};

export default ReturnsRefundsView;
