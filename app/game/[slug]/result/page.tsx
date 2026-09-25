"use client";
import { useCallback, useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Button,
  EmptyState,
  Footer,
  Header,
  LoadingState,
} from "@/app/components/ui";
import {
  errorMessage,
  isWhatsAppLink,
  recallGroup,
  request,
} from "@/lib/client";
import type { Group, PublicGame } from "@/lib/types";
import { eventThemeStyle } from "@/lib/eventTheme";

export default function ResultPage() {
  const { slug } = useParams<{ slug: string }>();
  const [group, setGroup] = useState<Group | null>(null);
  const [eventName, setEventName] = useState("");
  const [theme, setTheme] = useState({
    primary: "#557445",
    secondary: "#D18B48",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [missing, setMissing] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setMissing(false);
    const groupName =
      new URLSearchParams(window.location.search).get("group") ||
      recallGroup(slug);
    if (!groupName) {
      setMissing(true);
      setLoading(false);
      return;
    }
    try {
      const { game } = await request<{ game: PublicGame }>(
        `/api/game/${slug}/info`,
      );
      const matched = game.groups.find((g) => g.name === groupName);
      if (!matched) {
        setMissing(true);
        return;
      }
      setGroup(matched);
      setEventName(game.name);
      setTheme({
        primary: game.themeColor,
        secondary: game.themeSecondaryColor || "#D18B48",
      });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [slug]);
  useEffect(() => {
    void load();
  }, [load]);
  return (
    <div
      className="event-theme"
      style={eventThemeStyle(theme.primary, theme.secondary)}
    >
      <Header />
      <main id="main-content">
        {loading ? (
          <LoadingState label="Finding your team…" />
        ) : error ? (
          <EmptyState
            title="Your team is still waiting."
            action={<Button onClick={load}>Try again</Button>}
          >
            {error}
          </EmptyState>
        ) : missing || !group ? (
          <EmptyState
            title="Let’s find your team."
            action={
              <Link className="button" href={`/game/${slug}`}>
                Go to registration
              </Link>
            }
          >
            We couldn’t find a saved assignment on this device. Register with
            your original details to see your team.
          </EmptyState>
        ) : (
          <div className="result-wrap">
            <section
              className="panel result-card"
              style={{ "--group-color": group.colorHex } as CSSProperties}
            >
              <div className="eyebrow">A little chance brought you here</div>
              <span className="result-emoji" aria-hidden="true">
                {group.emoji || "🎉"}
              </span>
              <span className="badge">You’re on the team</span>
              <h1>{group.name}</h1>
              <p>
                Welcome to your crew for <strong>{eventName}</strong>.<br />
                Time to make a little team history.
              </p>
              <div className="result-actions">
                {group.whatsappLink && isWhatsAppLink(group.whatsappLink) ? (
                  <>
                    <p>Your teammates are one tap away.</p>
                    <a
                      className="button full-width"
                      href={group.whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open team link ↗
                    </a>
                    <p className="field-hint">Opens WhatsApp in a new tab.</p>
                  </>
                ) : (
                  <p>
                    Your spot is saved. Check with your organizer for the next
                    steps.
                  </p>
                )}
              </div>
            </section>
            <Link className="text-link" href={`/game/${slug}`}>
              ← Back to event
            </Link>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
