"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Button,
  EmptyState,
  ErrorModal,
  Footer,
  Header,
  LoadingState,
} from "@/app/components/ui";
import { errorMessage, request } from "@/lib/client";
import { EventManager } from "@/app/game/[slug]/admin/page";

type ManagedEvent = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  themeColor: string;
  registrationOpen: boolean;
  groups: unknown[];
  createdAt: string;
  canManage: boolean;
};

export default function OrganizerWorkspace() {
  const searchParams = useSearchParams();
  const eventSlug = searchParams.get("event");
  if (eventSlug && /^[a-z0-9-]{3,60}$/.test(eventSlug))
    return <EventManager slug={eventSlug} />;
  return <EventWorkspace />;
}

function EventWorkspace() {
  const [events, setEvents] = useState<ManagedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setEvents(
        (await request<{ events: ManagedEvent[] }>("/api/admin/events")).events,
      );
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  return (
    <>
      <Header>
        <Link className="button small" href="/create">
          Create event ↗
        </Link>
      </Header>
      <main id="main-content" className="page-shell">
        <div className="dashboard-heading">
          <div>
            <div className="eyebrow">Organizer workspace</div>
            <h1>Your events</h1>
            <p>Browse and manage every event from one organizer workspace.</p>
          </div>
          <Button
            className="secondary small"
            loading={loading}
            loadingText="Refreshing…"
            onClick={load}
          >
            ↻ Refresh
          </Button>
        </div>
        {loading ? (
          <LoadingState label="Loading your events…" />
        ) : events.length === 0 ? (
          <EmptyState
            title="No events here yet."
            action={
              <Link className="button" href="/create">
                Create your first event ↗
              </Link>
            }
          >
            Create the first event to get started.
          </EmptyState>
        ) : (
          <div className="event-grid">
            {events.map((event) => (
              <article key={event.slug} className="panel event-card">
                <span
                  className="event-color"
                  style={{ background: event.themeColor }}
                />
                <div className="eyebrow">
                  {event.registrationOpen
                    ? "● Registration open"
                    : "● Registration closed"}
                </div>
                <h2>{event.name}</h2>
                <p>{event.description || "Ready to organise."}</p>
                <div className="event-card-meta">
                  <span>{event.groups.length} teams</span>
                  <span>/{event.slug}</span>
                </div>
                <div className="row-actions">
                  <Link
                    className="button small"
                    href={`/admin?event=${encodeURIComponent(event.slug)}`}
                  >
                    Manage event
                  </Link>
                  <Link
                    className="button secondary small"
                    href={`/game/${event.slug}`}
                  >
                    View event
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
        <ErrorModal message={error} onClose={() => setError("")} />
      </main>
      <Footer />
    </>
  );
}
