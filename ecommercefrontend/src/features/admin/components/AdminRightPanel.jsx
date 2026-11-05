import { useEffect, useId, useRef } from "react";

export default function AdminRightPanel({
  isOpen,
  title,
  subtitle = "",
  onClose,
  children,
  busy = false,
}) {
  const dialogRef = useRef(null);
  const closeRef = useRef(onClose);
  const titleId = useId();
  const subtitleId = useId();
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!isOpen) {
      if (dialog.open) dialog.close();
      return;
    }
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      if (dialog.open) dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [isOpen]);

  const trapFocus = (event) => {
    if (event.key !== "Tab") return;
    const dialog = dialogRef.current;
    const items = [
      ...dialog.querySelectorAll(
        "button, a[href], input, select, textarea, [tabindex]",
      ),
    ].filter(
      (element) =>
        !element.matches(":disabled") &&
        element.tabIndex >= 0 &&
        element.getClientRects().length > 0,
    );
    const first = items[0];
    const last = items[items.length - 1];
    if (!first) {
      event.preventDefault();
      dialog.focus();
      return;
    }
    if (
      event.shiftKey &&
      (document.activeElement === first || document.activeElement === dialog)
    ) {
      event.preventDefault();
      last.focus();
    } else if (
      !event.shiftKey &&
      (document.activeElement === last || document.activeElement === dialog)
    ) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="admin-console admin-right-panel"
      aria-labelledby={titleId}
      aria-describedby={subtitle ? subtitleId : undefined}
      onKeyDown={trapFocus}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) closeRef.current?.();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) {
          const bounds = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom
          )
            closeRef.current?.();
        }
      }}
    >
      <header className="admin-drawer-header">
        <div>
          <h2 id={titleId}>{title}</h2>
          {subtitle && <p id={subtitleId}>{subtitle}</p>}
        </div>
        <button
          type="button"
          aria-label="Close panel"
          onClick={onClose}
          disabled={busy}
          className="admin-drawer-close"
        >
          ×
        </button>
      </header>
      <div className="admin-drawer-body">{children}</div>
    </dialog>
  );
}
