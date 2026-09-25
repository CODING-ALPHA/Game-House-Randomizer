"use client";
import Link from "next/link";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

export function Mark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
    </span>
  );
}
export function Header({ children }: { children?: ReactNode }) {
  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="Gamehouse home">
        <Mark />
        gamehouse<span className="brand-dot">.</span>
      </Link>
      <nav aria-label="Main navigation">
        {children ?? (
          <Link className="text-link" href="/create">
            Create an event <span aria-hidden="true">↗</span>
          </Link>
        )}
      </nav>
    </header>
  );
}
export function Footer() {
  return (
    <footer className="site-footer">
      <Link href="/" className="brand">
        <Mark />
        gamehouse.
      </Link>
      <span>Made for a little friendly competition.</span>
    </footer>
  );
}
export function Spinner() {
  return <span className="spinner" aria-hidden="true" />;
}
export function Button({
  loading,
  loadingText = "Please wait…",
  children,
  className = "",
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  loadingText?: string;
}) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`button ${className}`}
    >
      {loading && <Spinner />}
      {loading ? loadingText : children}
    </button>
  );
}
export function Field({
  label,
  hint,
  error,
  id,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  id: string;
  children: ReactNode;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && (
        <p id={`${id}-hint`} className="field-hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
export function PasswordInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false);
  const [caps, setCaps] = useState(false);
  return (
    <div>
      <div className="password-wrap">
        <input
          {...props}
          type={visible ? "text" : "password"}
          onKeyUp={(e) => setCaps(e.getModifierState("CapsLock"))}
          onBlur={(e) => {
            setCaps(false);
            props.onBlur?.(e);
          }}
        />
        <button
          type="button"
          className="password-toggle"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          disabled={props.disabled}
          onClick={() => setVisible(!visible)}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
      {caps && (
        <p className="field-hint" role="status">
          Caps Lock is on.
        </p>
      )}
    </div>
  );
}
export function ErrorModal({
  message,
  onClose,
  title = "Let’s try that again",
}: {
  message: string;
  onClose: () => void;
  title?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    if (!message) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    dialog?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [message]);
  return (
    <dialog
      ref={ref}
      className="error-dialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dialog-content">
        <span className="error-symbol" aria-hidden="true">
          !
        </span>
        <h2 id={titleId}>{title}</h2>
        <p id={descriptionId}>{message}</p>
        <Button
          type="button"
          autoFocus
          onClick={onClose}
          className="full-width"
        >
          Got it
        </Button>
      </div>
    </dialog>
  );
}
export function ConfirmModal({
  open,
  title,
  children,
  confirmLabel,
  confirmingLabel,
  busy,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  confirmingLabel: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className="error-dialog confirm-dialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel();
      }}
    >
      <div className="dialog-content">
        <span className="error-symbol" aria-hidden="true">
          !
        </span>
        <h2 id={titleId}>{title}</h2>
        <p id={descriptionId}>{children}</p>
        <div className="dialog-actions">
          <Button
            className="danger"
            loading={busy}
            loadingText={confirmingLabel}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
          <Button
            className="secondary"
            disabled={busy}
            onClick={onCancel}
            autoFocus
          >
            Cancel
          </Button>
        </div>
      </div>
    </dialog>
  );
}
export function LoadingState({
  label = "Getting things ready…",
}: {
  label?: string;
}) {
  return (
    <div className="loading-state" role="status">
      <Spinner />
      <p>{label}</p>
      <div className="skeleton" />
      <div className="skeleton short" />
    </div>
  );
}
export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-symbol" aria-hidden="true">
        ↗
      </span>
      <h1>{title}</h1>
      <p>{children}</p>
      {action}
    </div>
  );
}
