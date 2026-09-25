"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Button,
  ErrorModal,
  Field,
  Footer,
  Header,
  LoadingState,
  PasswordInput,
} from "@/app/components/ui";
import { errorMessage, request } from "@/lib/client";

type EventOption = { name: string; slug: string };

export default function OrganizerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [events, setEvents] = useState<EventOption[]>([]);
  const [slug, setSlug] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const locked = useRef(false);
  useEffect(() => {
    void request<{ events: EventOption[] }>("/api/admin/events")
      .then(({ events }) => {
        setEvents(events);
        setSlug(events[0]?.slug || "");
      })
      .catch((reason) => setError(errorMessage(reason)))
      .finally(() => setLoading(false));
  }, []);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (locked.current || !slug) return;
    locked.current = true;
    setSubmitting(true);
    setError("");
    try {
      await request(`/api/game/${slug}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      router.replace(`/admin?event=${encodeURIComponent(slug)}`);
    } catch (reason) {
      setError(errorMessage(reason));
      setSubmitting(false);
      locked.current = false;
    }
  }
  return (
    <>
      <Header>
        <Link className="text-link" href="/create">
          Create an event
        </Link>
      </Header>
      <main id="main-content" className="auth-page">
        <Link className="back-link" href="/">
          ← Back to home
        </Link>
        {loading ? (
          <LoadingState label="Loading events…" />
        ) : (
          <section className="panel">
            <div className="auth-icon" aria-hidden="true">
              ⌁
            </div>
            <h1>Organizer login</h1>
            <p className="panel-intro">
              Choose an event and enter its admin password. You’ll then have one
              workspace for all events.
            </p>
            {events.length ? (
              <form onSubmit={submit} className="form-stack">
                <Field id="admin-email" label="Admin email">
                  <input
                    id="admin-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    disabled={submitting}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </Field>
                <Field id="login-event" label="Event">
                  <select
                    id="login-event"
                    value={slug}
                    onChange={(event) => setSlug(event.target.value)}
                    disabled={submitting}
                  >
                    {events.map((item) => (
                      <option key={item.slug} value={item.slug}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field id="admin-password" label="Admin password">
                  <PasswordInput
                    id="admin-password"
                    name="password"
                    required
                    autoComplete="current-password"
                    maxLength={128}
                    value={password}
                    disabled={submitting}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </Field>
                <Button
                  type="submit"
                  className="full-width"
                  loading={submitting}
                  loadingText="Signing you in…"
                >
                  Open workspace
                </Button>
              </form>
            ) : (
              <p className="panel-intro">
                There are no events yet. Create one to get started.
              </p>
            )}
          </section>
        )}
        <ErrorModal message={error} onClose={() => setError("")} />
      </main>
      <Footer />
    </>
  );
}
