import Link from "next/link";
import { EmptyState, Footer, Header } from "./components/ui";
export default function NotFound() {
  return (
    <>
      <Header />
      <main id="main-content">
        <EmptyState
          title="This event is off the map."
          action={
            <Link className="button" href="/">
              Back to home ↗
            </Link>
          }
        >
          We couldn’t find that page. Check the invite link with your organizer,
          or head home to create an event.
        </EmptyState>
      </main>
      <Footer />
    </>
  );
}
