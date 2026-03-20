import LegalPageShell from "../components/LegalPageShell";

const Section = ({ title, children }) => (
  <section>
    <h2 className="mb-3 text-xl font-bold text-slate-900">{title}</h2>
    <div className="space-y-2 text-sm leading-relaxed text-slate-600">{children}</div>
  </section>
);

const TermsOfUseView = () => (
  <LegalPageShell title="Terms of Use" lastUpdated="March 20, 2026">
    <Section title="1. Acceptance of Terms">
      <p>
        By accessing or using <strong className="text-slate-800">Villpo Store</strong> (the
        "Service"), you agree to be bound by these Terms of Use. If you do not agree to these terms,
        please do not use our Service.
      </p>
      <p>
        We reserve the right to update these terms at any time. Continued use of the Service after
        changes are posted constitutes your acceptance of the revised terms.
      </p>
    </Section>

    <Section title="2. Account Registration">
      <p>
        To purchase products, you must create an account with a valid email address. You are
        responsible for:
      </p>
      <ul className="ml-5 mt-2 list-disc space-y-1">
        <li>Maintaining the confidentiality of your password.</li>
        <li>All activity that occurs under your account.</li>
        <li>Providing accurate, current, and complete information during registration.</li>
        <li>Notifying us immediately of any unauthorised use of your account.</li>
      </ul>
      <p className="mt-2">
        We reserve the right to suspend or terminate accounts that violate these terms.
      </p>
    </Section>

    <Section title="3. Products and Pricing">
      <p>
        We strive to display accurate product information, descriptions, and pricing. However, we
        reserve the right to:
      </p>
      <ul className="ml-5 mt-2 list-disc space-y-1">
        <li>Correct errors in product descriptions or pricing at any time.</li>
        <li>Limit quantities available for purchase.</li>
        <li>Discontinue any product without notice.</li>
        <li>Refuse or cancel orders placed for products listed at an incorrect price.</li>
      </ul>
      <p className="mt-2">
        All prices are listed in <strong className="text-slate-800">Indian Rupees (INR)</strong> and
        are inclusive of applicable GST unless stated otherwise.
      </p>
    </Section>

    <Section title="4. Orders and Payment">
      <p>
        By placing an order, you represent that you are legally capable of entering into a binding
        contract. Orders are subject to acceptance and product availability.
      </p>
      <ul className="ml-5 mt-2 list-disc space-y-1">
        <li>
          Payments are processed securely via <strong className="text-slate-800">Razorpay</strong>.
          We do not store your card details.
        </li>
        <li>
          An order confirmation will be sent to your registered email once payment is successfully
          processed.
        </li>
        <li>
          We reserve the right to cancel orders due to stock unavailability, pricing errors, or
          suspected fraud.
        </li>
      </ul>
    </Section>

    <Section title="5. Shipping and Delivery">
      <p>
        Delivery fees are calculated based on the total weight of your order using a slab-based
        pricing system. Estimated delivery times are provided at checkout but are not guaranteed.
        Villpo Store is not liable for delays caused by third-party carriers or events beyond our
        reasonable control.
      </p>
    </Section>

    <Section title="6. Returns and Refunds">
      <p>
        Our returns and refund process is outlined in our{" "}
        <a
          href="/legal/returns"
          className="font-semibold text-blue-600 underline underline-offset-2 hover:text-blue-700"
        >
          Returns & Refunds Policy
        </a>
        . All return and refund requests must be directed to our admin team.
      </p>
    </Section>

    <Section title="7. Prohibited Uses">
      <p>You agree not to:</p>
      <ul className="ml-5 mt-2 list-disc space-y-1">
        <li>Use our Service for any unlawful purpose.</li>
        <li>
          Attempt to gain unauthorised access to any part of the Service or its related systems.
        </li>
        <li>Post false, misleading, or fraudulent information.</li>
        <li>Engage in any activity that interferes with or disrupts the Service.</li>
        <li>Resell products purchased from our store without prior written consent.</li>
      </ul>
    </Section>

    <Section title="8. Intellectual Property">
      <p>
        All content on this website — including text, images, logos, graphics, and software — is
        the property of Villpo Store or its content suppliers and is protected by applicable
        intellectual property laws. You may not reproduce, distribute, or create derivative works
        without our express written permission.
      </p>
    </Section>

    <Section title="9. Disclaimer of Warranties">
      <p>
        The Service is provided on an <strong className="text-slate-800">"as is"</strong> and
        "as available" basis without warranties of any kind, either express or implied. We do not
        warrant that the Service will be uninterrupted, error-free, or free of viruses or other
        harmful components.
      </p>
    </Section>

    <Section title="10. Limitation of Liability">
      <p>
        To the fullest extent permitted by law, Villpo Store shall not be liable for any indirect,
        incidental, special, consequential, or punitive damages arising from your use of the
        Service, including but not limited to loss of profits, data, or goodwill.
      </p>
    </Section>

    <Section title="11. Governing Law">
      <p>
        These Terms shall be governed by and construed in accordance with the laws of{" "}
        <strong className="text-slate-800">India</strong>. Any disputes shall be subject to the
        exclusive jurisdiction of the courts of India.
      </p>
    </Section>

    <Section title="12. Contact Us">
      <p>For questions about these Terms of Use, please contact:</p>
      <ul className="ml-5 mt-2 list-none space-y-1">
        <li>
          <strong className="text-slate-800">Email:</strong> admin@astraval.com
        </li>
        <li>
          <strong className="text-slate-800">Phone:</strong> +91 9043368684
        </li>
      </ul>
    </Section>
  </LegalPageShell>
);

export default TermsOfUseView;
