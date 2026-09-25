"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Button,
  EmptyState,
  ErrorModal,
  Field,
  Footer,
  Header,
  LoadingState,
} from "@/app/components/ui";
import { errorMessage, request, RequestError } from "@/lib/client";
import type {
  DashboardData,
  Group,
  ParticipantRecord,
  PublicGame,
} from "@/lib/types";

type Tab = "overview" | "participants" | "settings";
type EditableGroup = Group & { id: number; originalName?: string };

export function EventManager({ slug: slugOverride }: { slug?: string }) {
  const { slug: routeSlug } = useParams<{ slug: string }>();
  const slug = slugOverride || routeSlug;
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [participants, setParticipants] = useState<ParticipantRecord[]>([]);
  const [loadedParticipants, setLoadedParticipants] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<ParticipantRecord | null>(null);
  const [deleting, setDeleting] = useState<ParticipantRecord | null>(null);
  const [newParticipant, setNewParticipant] = useState({
    name: "",
    identifier: "",
    groupName: "",
  });
  const [eventForm, setEventForm] = useState({
    name: "",
    description: "",
    themeColor: "#557445",
    themeSecondaryColor: "#D18B48",
    groups: [] as EditableGroup[],
  });
  const groupId = useRef(100);
  const linkRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState("");

  const unauthorised = useCallback(
    (err: unknown) => {
      if (err instanceof RequestError && err.status === 401) {
        router.replace(`/game/${slug}/admin/login`);
        return true;
      }
      return false;
    },
    [router, slug],
  );
  const copyGameToForm = useCallback(
    (game: PublicGame) =>
      setEventForm({
        name: game.name,
        description: game.description || "",
        themeColor: game.themeColor,
        themeSecondaryColor: game.themeSecondaryColor || "#D18B48",
        groups: game.groups.map((group) => ({
          ...group,
          id: groupId.current++,
          originalName: group.name,
        })),
      }),
    [],
  );
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await request<DashboardData>(
        `/api/game/${slug}/admin/stats`,
      );
      setStats(data);
      copyGameToForm(data.game);
    } catch (err) {
      if (!unauthorised(err)) setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [slug, unauthorised, copyGameToForm]);
  const loadParticipants = useCallback(async () => {
    setBusy(true);
    try {
      const data = await request<{ participants: ParticipantRecord[] }>(
        `/api/game/${slug}/admin/participants`,
      );
      setParticipants(data.participants);
      setLoadedParticipants(true);
    } catch (err) {
      if (!unauthorised(err)) setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }, [slug, unauthorised]);
  useEffect(() => {
    setUrl(`${window.location.origin}/game/${slug}`);
    void load();
  }, [load, slug]);
  useEffect(() => {
    if (tab === "participants" && !loadedParticipants) void loadParticipants();
  }, [tab, loadedParticipants, loadParticipants]);
  const game = stats?.game;
  const filtered = useMemo(
    () =>
      participants.filter((person) =>
        `${person.name} ${person.groupName} ${Object.values(person.data || {}).join(" ")}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [participants, search],
  );
  const duplicateNames = useMemo(() => {
    const counts = new Map<string, number>();
    participants.forEach((person) => {
      const name = person.name.trim().toLocaleLowerCase();
      if (name) counts.set(name, (counts.get(name) || 0) + 1);
    });
    return new Set(
      [...counts].filter(([, count]) => count > 1).map(([name]) => name),
    );
  }, [participants]);
  const run = async (operation: () => Promise<void>) => {
    setBusy(true);
    try {
      await operation();
    } catch (err) {
      if (!unauthorised(err)) setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };
  const countFor = (name: string) =>
    stats?.groupCounts.find((item) => item._id === name)?.count || 0;
  async function toggleRegistration() {
    if (!game) return;
    await run(async () => {
      const result = await request<{ registrationOpen: boolean }>(
        `/api/game/${slug}/admin/stats`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ registrationOpen: !game.registrationOpen }),
        },
      );
      setStats((prev) =>
        prev
          ? {
              ...prev,
              game: { ...prev.game, registrationOpen: result.registrationOpen },
            }
          : prev,
      );
      setNotice(
        result.registrationOpen
          ? "Registration is now open."
          : "Registration is now closed.",
      );
    });
  }
  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(url);
      setNotice("Invite link copied.");
    } catch {
      linkRef.current?.focus();
      linkRef.current?.select();
      setError(
        "Your browser couldn’t copy the link. Select it and copy it manually.",
      );
    }
  }
  async function addParticipant(event: React.FormEvent) {
    event.preventDefault();
    await run(async () => {
      const data = await request<{ participant: ParticipantRecord }>(
        `/api/game/${slug}/admin/participants`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newParticipant),
        },
      );
      setParticipants((prev) => [data.participant, ...prev]);
      setNewParticipant({ name: "", identifier: "", groupName: "" });
      setLoadedParticipants(true);
      setNotice("Participant added.");
      await load();
    });
  }
  async function saveParticipant(person: ParticipantRecord) {
    await run(async () => {
      const data = await request<{ participant: ParticipantRecord }>(
        `/api/game/${slug}/admin/participants`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: person._id,
            name: person.name,
            groupName: person.groupName,
          }),
        },
      );
      setParticipants((prev) =>
        prev.map((item) => (item._id === person._id ? data.participant : item)),
      );
      setEditing(null);
      setNotice("Participant updated.");
      await load();
    });
  }
  async function removeParticipant() {
    if (!deleting) return;
    await run(async () => {
      await request(`/api/game/${slug}/admin/participants?id=${deleting._id}`, {
        method: "DELETE",
      });
      setParticipants((prev) =>
        prev.filter((item) => item._id !== deleting._id),
      );
      setDeleting(null);
      setNotice("Participant removed.");
      await load();
    });
  }
  function updateGroup(index: number, key: keyof Group, value: string) {
    setEventForm((prev) => ({
      ...prev,
      groups: prev.groups.map((group, i) =>
        i === index ? { ...group, [key]: value } : group,
      ),
    }));
  }
  async function saveSettings(event: React.FormEvent) {
    event.preventDefault();
    await run(async () => {
      const data = await request<{ game: PublicGame }>(
        `/api/game/${slug}/admin/settings`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...eventForm,
            groups: eventForm.groups.map(({ id, ...group }) => group),
          }),
        },
      );
      setStats((prev) => (prev ? { ...prev, game: data.game } : prev));
      copyGameToForm(data.game);
      setNotice("Event settings saved.");
    });
  }
  async function logout() {
    await run(async () => {
      await request(`/api/game/${slug}/admin/login`, { method: "DELETE" });
      router.replace(`/game/${slug}/admin/login`);
    });
  }
  if (loading)
    return (
      <>
        <Header />
        <main id="main-content">
          <LoadingState label="Opening your dashboard…" />
        </main>
      </>
    );
  if (!stats || !game)
    return (
      <>
        <Header />
        <main id="main-content">
          <EmptyState
            title="We couldn’t load your dashboard."
            action={<Button onClick={load}>Try again</Button>}
          >
            Sign in again to manage your event.
          </EmptyState>
        </main>
      </>
    );
  return (
    <>
      <Header>
        <Button
          className="ghost small"
          loading={busy}
          loadingText="Working…"
          onClick={logout}
        >
          Sign out
        </Button>
      </Header>
      <main id="main-content" className="page-shell">
        <div className="dashboard-heading">
          <div>
            <div className="eyebrow">Event management</div>
            <h1>{game.name}</h1>
            <p>Create, manage, and organise every part of your event.</p>
          </div>
          <div className="dashboard-actions">
            <Button className="ghost small" onClick={load}>
              ↻ Refresh
            </Button>
            <Link className="button secondary small" href="/admin">
              All events
            </Link>
            <Link className="button secondary small" href="/create">
              New event
            </Link>
            <Link className="button small" href={`/game/${slug}`}>
              View event ↗
            </Link>
          </div>
        </div>
        <nav className="dashboard-tabs" aria-label="Dashboard sections">
          {(["overview", "participants", "settings"] as Tab[]).map((item) => (
            <button
              key={item}
              type="button"
              className={tab === item ? "active" : ""}
              onClick={() => setTab(item)}
            >
              {item === "overview"
                ? "Overview"
                : item === "participants"
                  ? `Participants${loadedParticipants ? ` (${participants.length})` : ""}`
                  : "Event settings"}
            </button>
          ))}
        </nav>
        {tab === "overview" && (
          <>
            <div className="stat-grid">
              <div className="panel stat-card featured">
                <p>Total participants</p>
                <div className="stat-value">{stats.totalParticipants}</div>
              </div>
              <div className="panel stat-card">
                <p>Teams in the mix</p>
                <div className="stat-value">{game.groups.length}</div>
              </div>
              <div className="panel stat-card">
                <p>Registration</p>
                <div style={{ marginTop: 20 }}>
                  <span
                    className={`badge ${game.registrationOpen ? "" : "closed"}`}
                  >
                    {game.registrationOpen ? "● Open" : "● Closed"}
                  </span>
                </div>
              </div>
            </div>
            <div className="dashboard-main">
              <section className="panel">
                <div className="toolbar">
                  <h2>Team distribution</h2>
                  <p>
                    {stats.totalParticipants} participants ·{" "}
                    {game.groups.length} teams
                  </p>
                </div>
                <p className="panel-intro">
                  Move participants between teams in the Participants tab.
                </p>
                {game.groups.map((group) => {
                  const count = countFor(group.name);
                  const percentage = stats.totalParticipants
                    ? (count / stats.totalParticipants) * 100
                    : 0;
                  return (
                    <div className="distribution-row" key={group.name}>
                      <div className="distribution-label">
                        <span>
                          <span className="group-icon">
                            {group.emoji || "✦"}
                          </span>
                          <strong>{group.name}</strong>
                        </span>
                        <span>
                          {count} · {Math.round(percentage)}%
                        </span>
                      </div>
                      <div className="distribution-track">
                        <span
                          style={{
                            width: `${percentage}%`,
                            background: group.colorHex,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </section>
              <aside className="dashboard-side">
                <section className="panel">
                  <h2>Invite participants</h2>
                  <p>Share this link so people can register themselves.</p>
                  <label className="field-hint" htmlFor="invite-link">
                    Participant invite link
                  </label>
                  <input
                    ref={linkRef}
                    id="invite-link"
                    className="input share-input"
                    value={url}
                    readOnly
                    onFocus={(event) => event.target.select()}
                  />
                  <Button className="full-width" onClick={copyInvite}>
                    Copy invite link
                  </Button>
                </section>
                <section className="panel">
                  <h2>Registration controls</h2>
                  <p>
                    {game.registrationOpen
                      ? "Registration is accepting new people."
                      : "Registration is currently paused."}
                  </p>
                  <Button
                    className="secondary full-width"
                    loading={busy}
                    loadingText="Saving…"
                    onClick={toggleRegistration}
                  >
                    {game.registrationOpen
                      ? "Close registration"
                      : "Open registration"}
                  </Button>
                </section>
              </aside>
            </div>
          </>
        )}
        {tab === "participants" && (
          <div className="form-stack">
            <section className="panel">
              <div className="toolbar">
                <div>
                  <h2>Add a participant</h2>
                  <p className="panel-intro">
                    Use this when someone cannot register themselves.
                  </p>
                </div>
                <Button
                  className="secondary small"
                  loading={busy}
                  loadingText="Refreshing…"
                  onClick={loadParticipants}
                >
                  ↻ Refresh
                </Button>
              </div>
              <form className="participant-add" onSubmit={addParticipant}>
                <Field id="new-name" label="Name">
                  <input
                    id="new-name"
                    required
                    value={newParticipant.name}
                    onChange={(event) =>
                      setNewParticipant((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }))
                    }
                  />
                </Field>
                <Field id="new-email" label="Email">
                  <input
                    id="new-email"
                    type="email"
                    required
                    value={newParticipant.identifier}
                    onChange={(event) =>
                      setNewParticipant((prev) => ({
                        ...prev,
                        identifier: event.target.value,
                      }))
                    }
                  />
                </Field>
                <Field id="new-group" label="Team">
                  <select
                    id="new-group"
                    required
                    value={newParticipant.groupName}
                    onChange={(event) =>
                      setNewParticipant((prev) => ({
                        ...prev,
                        groupName: event.target.value,
                      }))
                    }
                  >
                    <option value="">Choose a team</option>
                    {game.groups.map((group) => (
                      <option key={group.name} value={group.name}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Button type="submit" loading={busy} loadingText="Adding…">
                  Add participant
                </Button>
              </form>
            </section>
            <section className="panel">
              <div className="toolbar">
                <div>
                  <h2>Participants</h2>
                  <p className="panel-intro">
                    Edit names, teams, or remove registrations.
                  </p>
                </div>
                <input
                  className="input participant-search"
                  aria-label="Search participants"
                  placeholder="Search name, email, or team"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              {!loadedParticipants && busy ? (
                <LoadingState label="Loading participants…" />
              ) : filtered.length === 0 ? (
                <p className="notice">No participants match this search.</p>
              ) : (
                <div className="participant-list">
                  {filtered.map((person) => (
                    <article className="participant-row" key={person._id}>
                      {editing?._id === person._id ? (
                        <>
                          <Field id={`edit-name-${person._id}`} label="Name">
                            <input
                              value={editing.name}
                              onChange={(event) =>
                                setEditing({
                                  ...editing,
                                  name: event.target.value,
                                })
                              }
                            />
                          </Field>
                          <Field id={`edit-team-${person._id}`} label="Team">
                            <select
                              value={editing.groupName}
                              onChange={(event) =>
                                setEditing({
                                  ...editing,
                                  groupName: event.target.value,
                                })
                              }
                            >
                              {game.groups.map((group) => (
                                <option key={group.name} value={group.name}>
                                  {group.name}
                                </option>
                              ))}
                            </select>
                          </Field>
                          <div className="row-actions">
                            <Button
                              className="small"
                              loading={busy}
                              loadingText="Saving…"
                              onClick={() => saveParticipant(editing)}
                            >
                              Save
                            </Button>
                            <Button
                              className="ghost small"
                              disabled={busy}
                              onClick={() => setEditing(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <strong>{person.name}</strong>
                            {duplicateNames.has(
                              person.name.trim().toLocaleLowerCase(),
                            ) && (
                              <span className="duplicate-warning">
                                Possible duplicate name
                              </span>
                            )}
                            <p>
                              {Object.values(person.data || {})
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          </div>
                          <span className="participant-team">
                            {person.groupName}
                          </span>
                          <div className="row-actions">
                            <Button
                              className="ghost small"
                              onClick={() => setEditing(person)}
                            >
                              Edit
                            </Button>
                            <Button
                              className="danger small"
                              onClick={() => setDeleting(person)}
                            >
                              Remove
                            </Button>
                          </div>
                        </>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
        {tab === "settings" && (
          <form onSubmit={saveSettings} className="settings-layout">
            <section className="panel form-stack">
              <div>
                <h2>Event details</h2>
                <p className="panel-intro">
                  Update what participants see on the registration page.
                </p>
              </div>
              <Field id="event-name" label="Event name">
                <input
                  required
                  maxLength={100}
                  value={eventForm.name}
                  onChange={(event) =>
                    setEventForm((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field id="event-description" label="Description">
                <textarea
                  maxLength={500}
                  value={eventForm.description}
                  onChange={(event) =>
                    setEventForm((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field id="event-color" label="Primary theme color">
                <input
                  type="color"
                  value={eventForm.themeColor}
                  onChange={(event) =>
                    setEventForm((prev) => ({
                      ...prev,
                      themeColor: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field id="event-secondary-color" label="Secondary theme color">
                <input
                  type="color"
                  value={eventForm.themeSecondaryColor}
                  onChange={(event) =>
                    setEventForm((prev) => ({
                      ...prev,
                      themeSecondaryColor: event.target.value,
                    }))
                  }
                />
              </Field>
            </section>
            <section className="panel">
              <div className="section-title">
                <div>
                  <h2>Teams</h2>
                  <p className="panel-intro">
                    Add teams, edit teams, and remove teams that have no
                    participants.
                  </p>
                </div>
                <Button
                  type="button"
                  className="secondary small"
                  onClick={() =>
                    setEventForm((prev) => ({
                      ...prev,
                      groups: [
                        ...prev.groups,
                        {
                          id: groupId.current++,
                          name: "",
                          emoji: "✦",
                          colorHex: "#7585AF",
                          whatsappLink: "",
                        },
                      ],
                    }))
                  }
                >
                  + Add team
                </Button>
              </div>
              {eventForm.groups.map((group, index) => (
                <div className="group-editor" key={group.id}>
                  <div className="group-editor-title">
                    <span>Team {index + 1}</span>
                    {eventForm.groups.length > 2 && (
                      <button
                        type="button"
                        className="remove-button"
                        onClick={() =>
                          setEventForm((prev) => ({
                            ...prev,
                            groups: prev.groups.filter(
                              (item) => item.id !== group.id,
                            ),
                          }))
                        }
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="group-fields">
                    <Field id={`team-name-${group.id}`} label="Name">
                      <input
                        required
                        maxLength={50}
                        value={group.name}
                        onChange={(event) =>
                          updateGroup(index, "name", event.target.value)
                        }
                      />
                    </Field>
                    <Field id={`team-emoji-${group.id}`} label="Symbol">
                      <input
                        maxLength={12}
                        value={group.emoji || ""}
                        onChange={(event) =>
                          updateGroup(index, "emoji", event.target.value)
                        }
                      />
                    </Field>
                    <Field id={`team-color-${group.id}`} label="Color">
                      <input
                        type="color"
                        value={group.colorHex}
                        onChange={(event) =>
                          updateGroup(index, "colorHex", event.target.value)
                        }
                      />
                    </Field>
                  </div>
                  <Field
                    id={`team-link-${group.id}`}
                    label="Team link (optional)"
                  >
                    <input
                      type="url"
                      placeholder="https://chat.whatsapp.com/…"
                      value={group.whatsappLink || ""}
                      onChange={(event) =>
                        updateGroup(index, "whatsappLink", event.target.value)
                      }
                    />
                  </Field>
                </div>
              ))}
              <Button
                type="submit"
                loading={busy}
                loadingText="Saving settings…"
              >
                Save event settings
              </Button>
            </section>
          </form>
        )}
        <div className="feedback dashboard-feedback" role="status">
          {notice}
        </div>
        <ErrorModal message={error} onClose={() => setError("")} />
        {deleting && (
          <div
            className="modal-overlay"
            role="presentation"
            onMouseDown={() => !busy && setDeleting(null)}
          >
            <section
              className="error-dialog modal-card"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="remove-participant-title"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="dialog-content">
                <span className="error-symbol">!</span>
                <h2 id="remove-participant-title">Remove {deleting.name}?</h2>
                <p>
                  This deletes their registration and team assignment. This
                  cannot be undone.
                </p>
                <div className="dialog-actions">
                  <Button
                    className="danger"
                    loading={busy}
                    loadingText="Removing…"
                    onClick={removeParticipant}
                  >
                    Remove participant
                  </Button>
                  <Button
                    className="secondary"
                    disabled={busy}
                    onClick={() => setDeleting(null)}
                    autoFocus
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

export default function LegacyEventManager() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  useEffect(() => {
    router.replace(`/admin?event=${encodeURIComponent(slug)}`);
  }, [router, slug]);
  return (
    <main id="main-content">
      <LoadingState label="Opening your organizer dashboard…" />
    </main>
  );
}
