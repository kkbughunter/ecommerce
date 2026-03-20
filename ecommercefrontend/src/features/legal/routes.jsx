import PrivacyPolicyView from "./views/PrivacyPolicyView";
import TermsOfUseView from "./views/TermsOfUseView";
import ReturnsRefundsView from "./views/ReturnsRefundsView";

const legalRoutes = [
  { path: "/legal/privacy", element: <PrivacyPolicyView /> },
  { path: "/legal/terms", element: <TermsOfUseView /> },
  { path: "/legal/returns", element: <ReturnsRefundsView /> },
];

export default legalRoutes;
