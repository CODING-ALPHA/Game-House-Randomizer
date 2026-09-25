"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Button,
  ErrorModal,
  Field,
  Footer,
  Header,
  PasswordInput,
} from "@/app/components/ui";
import { errorMessage, request } from "@/lib/client";

export default function AdminLoginPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const busy = useRef(false);
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(false);
  useEffect(() => {
    setCreated(new URLSearchParams(window.location.search).has("created"));
  }, []);
  async function login(event: React.FormEvent) {
    event.preventDefault();
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    setError("");
    try {
      await request(`/api/game/${slug}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      router.replace(`/admin?event=${encodeURIComponent(slug)}`);
    } catch (err) {
      setError(errorMessage(err));
      setLoading(false);
      busy.current = false;
    }
  }
  return (
    <>
      <Header />
      <main id="main-content" className="auth-page">
        <Link className="back-link" href={`/game/${slug}`}>
          ← Back to event
        </Link>
        <section className="panel">
          {created && (
            <p className="notice" role="status" style={{ marginBottom: 24 }}>
              Your event is ready! Sign in to copy your invite link and manage
              registration.
            </p>
          )}
          <div className="auth-icon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <rect x="5" y="10" width="14" height="11" rx="3" />
              <path d="M8 10V6a4 4 0 0 1 8 0v4M12 14v3" />
            </svg>
          </div>
          <h1>Behind the scenes.</h1>
          <p className="panel-intro">
            Enter your event’s admin password to manage the teams and keep
            things moving.
          </p>
          <form onSubmit={login} className="form-stack">
            <Field id="admin-email" label="Admin email">
              <input
                id="admin-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                disabled={loading}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field
              id="admin-password"
              label="Admin password"
              hint="The password you chose when creating this event."
            >
              <PasswordInput
                id="admin-password"
                name="password"
                required
                autoComplete="current-password"
                maxLength={128}
                aria-describedby="admin-password-hint"
                placeholder="Enter your password"
                value={password}
                disabled={loading}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            <Button
              loading={loading}
              loadingText="Signing you in…"
              className="full-width"
              type="submit"
            >
              Open dashboard <span aria-hidden="true">↗</span>
            </Button>
          </form>
        </section>
        <p className="auth-note">
          Joining as a participant?{" "}
          <Link className="text-link" href={`/game/${slug}`}>
            Head to registration
          </Link>
        </p>
        <ErrorModal message={error} onClose={() => setError("")} />
      </main>
      <Footer />
    </>
  );
}
