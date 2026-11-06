import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import categoryApi from "../../../core/api/categoryApi";
import StoreIcon from "./StoreIcon";

export default function CategoryDropdown({ home }) {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState("loading");
  const root = useRef(null);
  const trigger = useRef(null);
  const location = useLocation();

  useEffect(() => {
    let active = true;
    categoryApi.getAllCategories().then((response) => {
      if (!active) return;
      setCategories(Array.isArray(response?.data?.data) ? response.data.data : []);
      setStatus("ready");
    }).catch(() => { if (active) setStatus("error"); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!open) return;
    const dismiss = (event) => {
      if (!root.current?.contains(event.target)) setOpen(false);
    };
    const escape = (event) => {
      if (event.key === "Escape") { setOpen(false); trigger.current?.focus(); }
    };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  return (
    <div className="store-category-dropdown" ref={root} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
    }}>
      <button ref={trigger} type="button" className="store-category-trigger" aria-expanded={open} aria-controls="store-category-menu" onClick={() => setOpen(!open)}>
        <StoreIcon name="grid" /> All categories <StoreIcon name="chevron" className={open ? "is-open" : ""} />
      </button>
      {open && <div id="store-category-menu" className="store-category-menu">
        <p className="store-menu-heading">Explore our components</p>
        {status === "loading" && <p role="status">Loading categories…</p>}
        {status === "error" && <p role="status">Categories are unavailable. Browse all products below.</p>}
        {status === "ready" && !categories.length && <p>New collections are on their way.</p>}
        {categories.filter((item) => item.categoryId != null && item.categoryName).map((item) => (
          <Link key={item.categoryId} to={`${home}?category=${encodeURIComponent(item.categoryId)}#products`} aria-current={new URLSearchParams(location.search).get("category") === String(item.categoryId) ? "page" : undefined} onClick={() => setOpen(false)}>
            {item.categoryName}<StoreIcon name="chevron" />
          </Link>
        ))}
        <Link className="store-menu-all" to={`${home}#products`} onClick={() => setOpen(false)}>All products <StoreIcon name="arrow" /></Link>
      </div>}
    </div>
  );
}
