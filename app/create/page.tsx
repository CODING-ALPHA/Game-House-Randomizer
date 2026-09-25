"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Button,
  ErrorModal,
  Field,
  Footer,
  Header,
  PasswordInput,
} from "../components/ui";
import { errorMessage, request, RequestError } from "@/lib/client";
import { validateEvent, slugify } from "@/lib/validation";
import type { Group } from "@/lib/types";

export default function CreateEventPage() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const submitting = useRef(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [slugEdited, setSlugEdited] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    adminPassword: "",
    adminEmail: "",
    themeColor: "#557445",
    themeSecondaryColor: "#D18B48",
  });
  const [groups, setGroups] = useState<(Group & { id: number })[]>([
    {
      id: 1,
      name: "Green Rockets",
      colorHex: "#557445",
      emoji: "🌿",
      whatsappLink: "",
    },
    {
      id: 2,
      name: "Orange Sparks",
      colorHex: "#D18B48",
      emoji: "⚡",
      whatsappLink: "",
    },
  ]);
  const nextId = useRef(3);
  function clearError(key: string) {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }
  function update(key: keyof typeof form, value: string) {
    clearError(key);
    setForm((prev) => ({
      ...prev,
      [key]: value,
      ...(key === "name" && !slugEdited ? { slug: slugify(value) } : {}),
    }));
  }
  function updateGroup(index: number, key: keyof Group, value: string) {
    setGroups((prev) =>
      prev.map((group, i) =>
        i === index ? { ...group, [key]: value } : group,
      ),
    );
    clearError("groups");
    clearError(`group-${index}-${key}`);
  }
  function fieldProps(key: string) {
    return {
      id: key,
      name: key,
      "aria-invalid": !!errors[key],
      "aria-describedby": errors[key]
        ? `${key}-error`
        : ["slug", "adminPassword"].includes(key)
          ? `${key}-hint`
          : undefined,
    };
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting.current) return;
    const validation = validateEvent({ ...form, groups });
    if (form.adminPassword !== confirmation)
      validation.confirmation = "Your passwords don’t match.";
    setErrors(validation);
    if (Object.keys(validation).length) {
      requestAnimationFrame(() =>
        formRef.current
          ?.querySelector<HTMLElement>('[aria-invalid="true"]')
          ?.focus(),
      );
      return;
    }
    submitting.current = true;
    setLoading(true);
    setError("");
    try {
      const data = await request<{ slug: string }>("/api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          name: form.name.trim(),
          description: form.description.trim(),
          groups: groups.map(({ id, ...group }) => ({
            ...group,
            name: group.name.trim(),
            whatsappLink: group.whatsappLink?.trim(),
          })),
        }),
      });
      router.push(`/admin?event=${encodeURIComponent(data.slug)}`);
    } catch (err) {
      if (err instanceof RequestError && err.details.fields) {
        setErrors(err.details.fields as Record<string, string>);
      }
      setError(errorMessage(err));
      setLoading(false);
      submitting.current = false;
    }
  }
  return (
    <>
      <Header>
        <Link className="text-link" href="/">
          Back to home <span aria-hidden="true">↗</span>
        </Link>
      </Header>
      <main id="main-content" className="page-shell">
        <div className="page-heading">
          <div className="eyebrow">Let the good teams begin</div>
          <h1>Make room for a little rivalry.</h1>
          <p>
            Set up your event, make your teams, and we’ll take care of the
            sorting.
          </p>
        </div>
        <div className="form-layout">
          <form
            ref={formRef}
            onSubmit={submit}
            noValidate
            className="form-stack"
          >
            <fieldset disabled={loading} className="form-stack">
              <section className="panel">
                <div className="section-title">
                  <h2>
                    <span className="step-number">1</span> The occasion
                  </h2>
                  <span className="field-hint">
                    All fields required unless marked
                  </span>
                </div>
                <div className="form-stack">
                  <Field id="name" label="Event name" error={errors.name}>
                    <input
                      {...fieldProps("name")}
                      required
                      maxLength={100}
                      autoComplete="off"
                      placeholder="e.g. Friday field day"
                      value={form.name}
                      onChange={(e) => update("name", e.target.value)}
                    />
                  </Field>
                  <Field
                    id="slug"
                    label="Your event link"
                    hint="3–60 lowercase letters, numbers, or hyphens. This becomes your shareable link."
                    error={errors.slug}
                  >
                    <div className="slug-input">
                      <span>/game/</span>
                      <input
                        {...fieldProps("slug")}
                        required
                        readOnly
                        maxLength={60}
                        autoCapitalize="none"
                        spellCheck={false}
                        autoComplete="off"
                        placeholder="friday-field-day"
                        value={form.slug}
                      />
                    </div>
                  </Field>
                  <Field
                    id="description"
                    label="A little about your event (optional)"
                    hint="Give participants a reason to get excited. Up to 500 characters."
                  >
                    <textarea
                      id="description"
                      name="description"
                      aria-describedby="description-hint"
                      maxLength={500}
                      placeholder="A day of games, good people, and friendly competition."
                      value={form.description}
                      onChange={(e) => update("description", e.target.value)}
                    />
                  </Field>
                  <Field
                    id="themeColor"
                    label="Primary theme color"
                    hint="Participant pages use your two colors as accents while keeping text readable."
                  >
                    <input
                      id="themeColor"
                      aria-describedby="themeColor-hint"
                      type="color"
                      value={form.themeColor}
                      onChange={(e) => update("themeColor", e.target.value)}
                    />
                  </Field>
                  <Field id="themeSecondaryColor" label="Secondary theme color">
                    <input
                      id="themeSecondaryColor"
                      type="color"
                      value={form.themeSecondaryColor}
                      onChange={(e) =>
                        update("themeSecondaryColor", e.target.value)
                      }
                    />
                  </Field>
                </div>
              </section>
              <section className="panel">
                <div className="section-title">
                  <h2>
                    <span className="step-number">2</span> Pick your teams
                  </h2>
                  <Button
                    className="secondary small"
                    type="button"
                    disabled={groups.length >= 20}
                    onClick={() =>
                      setGroups((prev) => [
                        ...prev,
                        {
                          id: nextId.current++,
                          name: "",
                          colorHex: "#7585AF",
                          emoji: "✦",
                          whatsappLink: "",
                        },
                      ])
                    }
                  >
                    + Add team
                  </Button>
                </div>
                <p className="panel-intro">
                  At least two teams, up to twenty. Give each one its own
                  identity.
                </p>
                {errors.groups && (
                  <p className="field-error" role="alert">
                    {errors.groups}
                  </p>
                )}
                {groups.map((group, i) => (
                  <div className="group-editor" key={group.id}>
                    <div className="group-editor-title">
                      <span>Team {String(i + 1).padStart(2, "0")}</span>
                      {groups.length > 2 && (
                        <button
                          className="remove-button"
                          type="button"
                          aria-label={`Remove team ${i + 1}`}
                          onClick={() => {
                            setGroups((prev) =>
                              prev.filter((g) => g.id !== group.id),
                            );
                            setErrors({});
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="group-fields">
                      <Field
                        id={`group-${i}-name`}
                        label="Team name"
                        error={errors[`group-${i}-name`]}
                      >
                        <input
                          {...fieldProps(`group-${i}-name`)}
                          required
                          maxLength={50}
                          placeholder="Team name"
                          value={group.name}
                          onChange={(e) =>
                            updateGroup(i, "name", e.target.value)
                          }
                        />
                      </Field>
                      <Field id={`group-${i}-emoji`} label="Symbol">
                        <input
                          id={`group-${i}-emoji`}
                          maxLength={12}
                          aria-label={`Team ${i + 1} symbol`}
                          value={group.emoji}
                          onChange={(e) =>
                            updateGroup(i, "emoji", e.target.value)
                          }
                        />
                      </Field>
                      <Field id={`group-${i}-colorHex`} label="Color">
                        <input
                          id={`group-${i}-colorHex`}
                          type="color"
                          aria-label={`Team ${i + 1} color`}
                          value={group.colorHex}
                          onChange={(e) =>
                            updateGroup(i, "colorHex", e.target.value)
                          }
                        />
                      </Field>
                    </div>
                    <Field
                      id={`group-${i}-whatsappLink`}
                      label="Team link (optional)"
                      error={errors[`group-${i}-whatsappLink`]}
                    >
                      <input
                        {...fieldProps(`group-${i}-whatsappLink`)}
                        type="url"
                        maxLength={300}
                        placeholder="https://chat.whatsapp.com/…"
                        value={group.whatsappLink}
                        onChange={(e) =>
                          updateGroup(i, "whatsappLink", e.target.value)
                        }
                      />
                    </Field>
                  </div>
                ))}
              </section>
              <section className="panel">
                <div className="section-title">
                  <h2>
                    <span className="step-number">3</span> Keep the keys
                  </h2>
                </div>
                <p className="panel-intro">
                  Your password opens this event’s dashboard. Save it somewhere
                  safe; password recovery isn’t available.
                </p>
                <div className="field-grid">
                  <Field
                    id="adminEmail"
                    label="Admin email"
                    error={errors.adminEmail}
                  >
                    <input
                      {...fieldProps("adminEmail")}
                      type="email"
                      autoComplete="email"
                      required
                      maxLength={254}
                      placeholder="you@example.com"
                      value={form.adminEmail}
                      onChange={(e) => update("adminEmail", e.target.value)}
                    />
                  </Field>
                  <Field
                    id="adminPassword"
                    label="Admin password"
                    hint="Use at least 8 characters."
                    error={errors.adminPassword}
                  >
                    <PasswordInput
                      {...fieldProps("adminPassword")}
                      autoComplete="new-password"
                      required
                      minLength={8}
                      maxLength={128}
                      placeholder="Create a password"
                      value={form.adminPassword}
                      onChange={(e) => update("adminPassword", e.target.value)}
                    />
                  </Field>
                  <Field
                    id="confirmation"
                    label="Confirm password"
                    error={errors.confirmation}
                  >
                    <PasswordInput
                      {...fieldProps("confirmation")}
                      autoComplete="new-password"
                      required
                      maxLength={128}
                      placeholder="Enter it again"
                      value={confirmation}
                      onChange={(e) => {
                        setConfirmation(e.target.value);
                        clearError("confirmation");
                      }}
                    />
                  </Field>
                </div>
              </section>
            </fieldset>
            <div className="form-bottom">
              <p>
                Participants register with their name and email. Registration
                opens when you create your event.
              </p>
              <Button
                loading={loading}
                loadingText="Creating your event…"
                type="submit"
              >
                Create event <span aria-hidden="true">↗</span>
              </Button>
            </div>
          </form>
          <aside className="panel preview-panel" aria-label="Event preview">
            <div className="eyebrow">
              <span
                className="status-dot"
                style={{ background: form.themeColor }}
              />{" "}
              A first look
            </div>
            <h2 className="preview-event">
              {form.name.trim() || "Your next great event"}
            </h2>
            {groups.map((group, i) => (
              <div className="preview-group" key={group.id}>
                <span
                  className="group-icon"
                  style={{ borderBottom: `3px solid ${group.colorHex}` }}
                >
                  {group.emoji || "✦"}
                </span>
                {group.name.trim() || `Team ${i + 1}`}
              </div>
            ))}
            <p className="preview-note">
              ✓ &nbsp; Balanced team assignment
              <br />✓ &nbsp; One registration per email
              <br />✓ &nbsp; Your own shareable event link
            </p>
          </aside>
        </div>
        <ErrorModal message={error} onClose={() => setError("")} />
      </main>
      <Footer />
    </>
  );
}
