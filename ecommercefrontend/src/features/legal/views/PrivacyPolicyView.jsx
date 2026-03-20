import LegalPageShell from "../components/LegalPageShell";

const Section = ({ title, children }) => (
  <section>
    <h2 className="mb-3 text-xl font-bold text-slate-900">{title}</h2>
    <div className="space-y-2 text-sm leading-relaxed text-slate-600">{children}</div>
  </section>
);

const PrivacyPolicyView = () => (
  <LegalPageShell title="Privacy Policy" lastUpdated="March 20, 2026">
    <Section title="1. Introduction">
      <p>
        Welcome to <strong className="text-slate-800">Villpo Store</strong>. We are committed to
        protecting your personal information and your right to privacy. This Privacy Policy explains
        how we collect, use, and safeguard your information when you visit our website or make a
        purchase.
      </p>
      <p>
        By using our service, you agree to the collection and use of information in accordance with
        this policy. If you have any questions, please contact us at{" "}
        <strong className="text-slate-800">admin@astraval.com</strong>.
      </p>
    </Section>

    <Section title="2. Information We Collect">
      <p>We collect information that you provide directly to us, including:</p>
      <ul className="ml-5 mt-2 list-disc space-y-1">
        <li>
          <strong className="text-slate-800">Account information</strong> — name, email address, and
          password when you register.
        </li>
        <li>
          <strong className="text-slate-800">Profile information</strong> — shipping and billing
          addresses, phone number.
        </li>
        <li>
          <strong className="text-slate-800">Order information</strong> — products purchased, order
          amounts, payment confirmation details.
        </li>
        <li>
          <strong className="text-slate-800">Communications</strong> — messages you send us for
          support or inquiries.
        </li>
      </ul>
      <p className="mt-2">
        We also collect limited usage data automatically, such as your IP address, browser type, and
        pages visited, to improve our service.
      </p>
    </Section>

    <Section title="3. How We Use Your Information">
      <p>We use the information we collect to:</p>
      <ul className="ml-5 mt-2 list-disc space-y-1">
        <li>Process and fulfil your orders.</li>
        <li>Send order confirmations and shipping updates via email.</li>
        <li>Respond to your questions and support requests.</li>
        <li>Improve and personalise your shopping experience.</li>
        <li>Detect and prevent fraudulent transactions.</li>
        <li>Comply with legal obligations.</li>
      </ul>
      <p className="mt-2">
        We do <strong className="text-slate-800">not</strong> sell or rent your personal information
        to third parties.
      </p>
    </Section>

    <Section title="4. Sharing of Information">
      <p>We may share your information only in the following limited circumstances:</p>
      <ul className="ml-5 mt-2 list-disc space-y-1">
        <li>
          <strong className="text-slate-800">Payment processors</strong> — Razorpay processes
          payments on our behalf. Your card details are handled directly by Razorpay and are never
          stored on our servers.
        </li>
        <li>
          <strong className="text-slate-800">Delivery partners</strong> — your address is shared
          with our logistics partner solely for order delivery.
        </li>
        <li>
          <strong className="text-slate-800">Legal requirements</strong> — when required by law or to
          protect our rights.
        </li>
      </ul>
    </Section>

    <Section title="5. Data Security">
      <p>
        We implement industry-standard security measures, including encrypted connections (HTTPS),
        hashed passwords, and JWT-based authentication, to protect your data against unauthorised
        access, alteration, or disclosure.
      </p>
      <p>
        While we strive to use commercially acceptable means to protect your personal information, no
        method of transmission over the internet is 100% secure.
      </p>
    </Section>

    <Section title="6. Cookies">
      <p>
        We use session tokens stored in your browser's local storage to keep you logged in. We do
        not use third-party tracking cookies. You can clear your browser storage at any time to
        remove session data.
      </p>
    </Section>

    <Section title="7. Data Retention">
      <p>
        We retain your account and order data for as long as your account is active or as needed to
        provide services and comply with legal obligations. You may request deletion of your account
        by contacting us.
      </p>
    </Section>

    <Section title="8. Your Rights">
      <p>You have the right to:</p>
      <ul className="ml-5 mt-2 list-disc space-y-1">
        <li>Access the personal information we hold about you.</li>
        <li>Request correction of inaccurate data.</li>
        <li>Request deletion of your account and associated data.</li>
        <li>Withdraw consent to marketing communications at any time.</li>
      </ul>
      <p className="mt-2">
        To exercise any of these rights, email us at{" "}
        <strong className="text-slate-800">admin@astraval.com</strong>.
      </p>
    </Section>

    <Section title="9. Children's Privacy">
      <p>
        Our service is not directed to individuals under the age of 18. We do not knowingly collect
        personal information from children. If you believe a child has provided us with personal
        data, please contact us and we will promptly delete it.
      </p>
    </Section>

    <Section title="10. Changes to This Policy">
      <p>
        We may update this Privacy Policy from time to time. We will notify you of significant
        changes by updating the "Last updated" date at the top of this page. Continued use of our
        service after changes constitutes acceptance of the revised policy.
      </p>
    </Section>

    <Section title="11. Contact Us">
      <p>If you have any questions about this Privacy Policy, please reach out:</p>
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

export default PrivacyPolicyView;
