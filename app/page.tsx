import Link from "next/link";
import { Footer, Header } from "./components/ui";

export default function GlobalLandingPage() {
  return (
    <>
      <Header>
        <Link className="text-link desktop-link" href="#how-it-works">
          How it works
        </Link>
        <Link className="text-link" href="/login">
          Organizer login
        </Link>
        <Link className="button small" href="/create">
          Create an event <span aria-hidden="true">↗</span>
        </Link>
      </Header>
      <main id="main-content">
        <section className="landing-hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="status-dot" /> A little chance. A lot of team
              spirit.
            </div>
            <h1>
              Less sorting.
              <br />
              More <em>playing.</em>
            </h1>
            <p>
              Bring your people together. Create an event, share a link, and let
              chance build the teams.
            </p>
            <div className="hero-actions">
              <Link className="button" href="/create">
                Create your event <span aria-hidden="true">↗</span>
              </Link>
              <Link className="text-link" href="#how-it-works">
                See how it works <span aria-hidden="true">↓</span>
              </Link>
            </div>
            <div className="hero-note">
              <span aria-hidden="true">✓</span> No participant accounts. Just
              one simple link.
            </div>
          </div>
          <div
            className="hero-art"
            role="img"
            aria-label="Example: six participants are sorted into two balanced teams, the Green Rockets and Orange Sparks."
          >
            <div className="art-caption">
              <span>A fair start for everyone</span>
              <span>01 — 06</span>
            </div>
            <span className="hero-spark" aria-hidden="true">
              ✳
            </span>
            <div className="shuffle-label">↓ &nbsp; A little mixing magic</div>
            <div className="demo-card">
              <div className="demo-card-top">
                Friday field day <span>6 people, endless possibilities</span>
              </div>
              <div className="avatar-list">
                {["AJ", "MO", "KA", "EL", "JO", "SA"].map((name) => (
                  <span className="avatar" key={name}>
                    {name}
                  </span>
                ))}
              </div>
            </div>
            <div className="demo-arrow" aria-hidden="true">
              ⤵
            </div>
            <div className="demo-teams">
              <div className="demo-team">
                <div className="team-name">🌿 Green Rockets</div>
                <p>New teammates. Big energy.</p>
                <div className="avatar-list">
                  {["AJ", "EL", "SA"].map((name) => (
                    <span className="avatar" key={name}>
                      {name}
                    </span>
                  ))}
                </div>
              </div>
              <div className="demo-team">
                <div className="team-name">⚡ Orange Sparks</div>
                <p>A little friendly competition.</p>
                <div className="avatar-list">
                  {["KA", "JO", "MO"].map((name) => (
                    <span className="avatar" key={name}>
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="demo-check">
              ✓ &nbsp; All mixed up. Evenly matched.
            </div>
          </div>
        </section>
        <div className="use-cases">
          <span>For whatever brings you together</span>
          <p>
            <span aria-hidden="true">⚑</span> Sports days
          </p>
          <p>
            <span aria-hidden="true">⌘</span> Hackathons
          </p>
          <p>
            <span aria-hidden="true">✳</span> Team activities
          </p>
          <p>
            <span aria-hidden="true">◇</span> Campus events
          </p>
        </div>
        <section className="how-section" id="how-it-works">
          <div className="section-heading">
            <div>
              <div className="eyebrow">From “who’s on my team?” to game on</div>
              <h2>Three steps. Everyone’s in.</h2>
            </div>
            <p>
              You handle the occasion. We’ll handle getting everyone onto a
              team.
            </p>
          </div>
          <div className="steps-grid">
            {[
              {
                icon: "✎",
                title: "Make it yours",
                text: "Name your event, pick your team colors, and add a little personality. Your event, your rules.",
              },
              {
                icon: "↗",
                title: "Send the invite",
                text: "Share your event link. Participants enter their details and get a team in just a few taps.",
              },
              {
                icon: "⇄",
                title: "Let chance take over",
                text: "New arrivals join one of the smallest teams at random. Follow the numbers from your dashboard.",
              },
            ].map((step, i) => (
              <article className="step-card" key={step.title}>
                <div className="step-card-top">
                  <div className="step-icon" aria-hidden="true">
                    {step.icon}
                  </div>
                  <span>0{i + 1}</span>
                </div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="landing-bottom">
          <div>
            <h2>Your people. Their next team.</h2>
            <p>
              Turn a room full of people into a little friendly competition.
            </p>
          </div>
          <Link className="button lime" href="/create">
            Let’s make an event <span aria-hidden="true">↗</span>
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
