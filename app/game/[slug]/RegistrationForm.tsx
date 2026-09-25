"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, ErrorModal, Field } from "@/app/components/ui";
import {
  errorMessage,
  getBrowserRegistrationToken,
  rememberGroup,
  request,
  RequestError,
} from "@/lib/client";
import type { PublicGame } from "@/lib/types";

export default function RegistrationForm({
  game,
  slug,
}: {
  game: PublicGame;
  slug: string;
}) {
  const router = useRouter();
  const busy = useRef(false);
  const ref = useRef<HTMLFormElement>(null);
  const [data, setData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [closed, setClosed] = useState(false);
  const [businessFax, setBusinessFax] = useState("");
  function finish(groupName: string) {
    rememberGroup(slug, groupName);
    router.replace(
      `/game/${slug}/result?group=${encodeURIComponent(groupName)}`,
    );
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy.current) return;
    const problems: Record<string, string> = {};
    game.registrationFields.forEach((field) => {
      const value = (data[field.name] || "").trim();
      if (field.required && !value)
        problems[field.name] = `Enter your ${field.name.toLowerCase()}.`;
      else if (
        value &&
        field.type === "email" &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      )
        problems[field.name] = "Enter a valid email address.";
      else if (
        value &&
        field.type === "number" &&
        !Number.isFinite(Number(value))
      )
        problems[field.name] = "Enter a valid number.";
      else if (
        value &&
        field.type === "select" &&
        field.options?.length &&
        !field.options.includes(value)
      )
        problems[field.name] = "Choose one of the available options.";
    });
    setErrors(problems);
    if (Object.keys(problems).length) {
      requestAnimationFrame(() =>
        ref.current
          ?.querySelector<HTMLElement>('[aria-invalid="true"]')
          ?.focus(),
      );
      return;
    }
    busy.current = true;
    setLoading(true);
    setError("");
    try {
      const result = await request<{ groupName: string }>(
        `/api/game/${slug}/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...data,
            browserToken: getBrowserRegistrationToken(slug),
            businessFax,
          }),
        },
      );
      finish(result.groupName);
    } catch (err) {
      if (
        err instanceof RequestError &&
        err.details.alreadyRegistered &&
        typeof err.details.groupName === "string"
      ) {
        finish(err.details.groupName);
        return;
      }
      if (err instanceof RequestError && err.status === 403) setClosed(true);
      setError(errorMessage(err));
      busy.current = false;
      setLoading(false);
    }
  }
  return (
    <>
      <form ref={ref} onSubmit={submit} noValidate className="form-stack">
        <div className="honeypot" aria-hidden="true">
          <label htmlFor="businessFax">Leave this field empty</label>
          <input
            id="businessFax"
            name="business_fax"
            tabIndex={-1}
            autoComplete="off"
            value={businessFax}
            onChange={(event) => setBusinessFax(event.target.value)}
          />
        </div>
        <fieldset disabled={loading || closed} className="form-stack">
          {game.registrationFields.map((field, i) => {
            const id = `registration-${i}`;
            const props = {
              id,
              name: field.name,
              required: field.required,
              value: data[field.name] || "",
              "aria-invalid": !!errors[field.name],
              "aria-describedby": errors[field.name]
                ? `${id}-error`
                : undefined,
              onChange: (
                e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
              ) => {
                setData((prev) => ({ ...prev, [field.name]: e.target.value }));
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next[field.name];
                  return next;
                });
              },
            };
            return (
              <Field
                key={field.name}
                id={id}
                label={`${field.name}${field.required ? "" : " (optional)"}`}
                error={errors[field.name]}
              >
                {field.type === "select" && field.options?.length ? (
                  <select {...props}>
                    <option value="">Choose an option</option>
                    {field.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    {...props}
                    type={field.type === "select" ? "text" : field.type}
                    maxLength={300}
                    autoComplete={
                      field.type === "email"
                        ? "email"
                        : /name/i.test(field.name)
                          ? "name"
                          : "off"
                    }
                    placeholder={`Your ${field.name.toLowerCase()}`}
                  />
                )}
              </Field>
            );
          })}
          <Button
            type="submit"
            loading={loading}
            loadingText="Finding your team…"
            disabled={closed}
            className="full-width"
          >
            {closed ? "Registration closed" : "Find my team"}{" "}
            <span aria-hidden="true">↗</span>
          </Button>
        </fieldset>
        <p className="field-hint">
          Already registered? Use the same details to find your original team.
          Your information is saved for this event.
        </p>
      </form>
      <ErrorModal message={error} onClose={() => setError("")} />
    </>
  );
}
