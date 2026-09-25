"use client";
import Link from "next/link";
import { Button, EmptyState, Header } from "./components/ui";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <>
      <Header />
      <main id="main-content">
        <EmptyState
          title="A small timeout from the action."
          action={
            <div className="form-stack">
              <Button onClick={reset}>Try again</Button>
              <Link className="text-link" href="/">
                Back to home
              </Link>
            </div>
          }
        >
          We couldn’t load this page. Please try again in a moment.
        </EmptyState>
      </main>
    </>
  );
}
