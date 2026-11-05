import { Link } from "react-router-dom";
import StoreIcon from "./StoreIcon";

export default function StoreFooter() {
  return (
    <footer className="store-footer">
      <div className="store-container store-footer-main">
        <div>
          <Link to="/" className="store-logo">
            <span className="store-logo-mark">
              <StoreIcon name="chip" />
            </span>
            <span>
              villpo.<small>THE COMPONENT STORE</small>
            </span>
          </Link>
          <p>
            From the first circuit to your next big idea.
            <br />
            Find the parts. Make it happen.
          </p>
        </div>
        <div>
          <h2>Explore</h2>
          <Link to="/#products">Shop all components</Link>
          <Link to="/#categories">Browse categories</Link>
          <Link to="/client/orders">Your orders</Link>
        </div>
        <div>
          <h2>Here to help</h2>
          <a href="mailto:admin@astraval.com">admin@astraval.com</a>
          <a href="tel:+919043368684">+91 90433 68684</a>
          <Link to="/legal/returns">Returns & refunds</Link>
        </div>
      </div>
      <div className="store-container store-footer-bottom">
        <span>© {new Date().getFullYear()} Villpo Store</span>
        <div>
          <Link to="/legal/privacy">Privacy</Link>
          <Link to="/legal/terms">Terms of use</Link>
          <span>Made for makers.</span>
        </div>
      </div>
    </footer>
  );
}
