const AdminRightPanel = ({
  isOpen,
  title,
  subtitle = "",
  onClose,
  children,
  widthClass = "sm:max-w-[560px]",
}) => {
  return (
    <>
      <button
        type="button"
        aria-label="Close details panel"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-[#0f172a]/35 backdrop-blur-[1px] transition ${
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`fixed right-0 top-0 z-50 h-screen w-full ${widthClass} transform border-l border-[#e2e6ee] bg-white shadow-[-24px_0_60px_rgba(15,23,42,0.22)] transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-start justify-between gap-3 border-b border-[#e2e6ee] px-4 py-4 sm:px-5">
          <div>
            <h2 className="text-base font-semibold text-[#111827] sm:text-lg">{title}</h2>
            {subtitle ? <p className="mt-1 text-xs text-[#64748b]">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#d8dde6] bg-white text-sm font-semibold text-[#334155]"
          >
            x
          </button>
        </header>
        <div className="h-[calc(100vh-78px)] overflow-y-auto px-4 py-4 sm:px-5">{children}</div>
      </aside>
    </>
  );
};

export default AdminRightPanel;
