import Link from "next/link";
import { cache } from "react";
import { notFound } from "next/navigation";
import connectDB from "@/lib/mongodb";
import { Game } from "@/models/Game";
import { Header, Footer, EmptyState } from "@/app/components/ui";
import type { PublicGame } from "@/lib/types";
import { eventThemeStyle } from "@/lib/eventTheme";
import RegistrationForm from "./RegistrationForm";

export const dynamic = "force-dynamic";
const getGame = cache(async (slug: string) => {
  await connectDB();
  return Game.findOne({ slug })
    .select(
      "name slug description themeColor themeSecondaryColor registrationOpen closedMessage groups registrationFields",
    )
    .lean<PublicGame | null>();
});
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const game = await getGame(slug);
  return {
    title: game ? `${game.name} | Gamehouse` : "Event not found | Gamehouse",
  };
}
export default async function GameRegistrationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const game = await getGame(slug);
  if (!game) notFound();
  const publicGame: PublicGame = JSON.parse(JSON.stringify(game));
  return (
    <div
      className="event-theme"
      style={eventThemeStyle(game.themeColor, game.themeSecondaryColor)}
    >
      <Header />
      <main id="main-content">
        {!game.registrationOpen ? (
          <EmptyState
            title="Registration is taking a break."
            action={
              <div className="form-stack">
                <Link className="button" href={`/game/${slug}/result`}>
                  View my existing team
                </Link>
                <Link className="text-link" href="/">
                  Back to home
                </Link>
              </div>
            }
          >
            {game.closedMessage ||
              "Registration is currently closed. Please check with your event organizer."}
          </EmptyState>
        ) : (
          <div className="event-layout">
            <section className="event-intro">
              <div className="eyebrow">
                <span
                  className="status-dot"
                  style={{ background: publicGame.themeColor }}
                />{" "}
                You’re invited
              </div>
              <h1>{game.name}</h1>
              <p>
                {game.description ||
                  "Your next team is waiting. Add your details and let a little chance bring you together."}
              </p>
              <div className="event-groups">
                {publicGame.groups.map((group) => (
                  <span className="group-chip" key={group.name}>
                    <span aria-hidden="true">{group.emoji || "✦"}</span>
                    <span
                      className="status-dot"
                      style={{ background: group.colorHex }}
                    />
                    {group.name}
                  </span>
                ))}
              </div>
              <p className="event-footnote">
                Everyone gets a fair start. New participants are randomly
                assigned to one of the smallest teams.
              </p>
            </section>
            <section className="panel event-form">
              <span className="badge">
                <span className="status-dot" /> Registration open
              </span>
              <h2 style={{ marginTop: 22 }}>Find your people.</h2>
              <p className="panel-intro">
                Fill in your details to discover your team.
              </p>
              <RegistrationForm game={publicGame} slug={slug} />
            </section>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
