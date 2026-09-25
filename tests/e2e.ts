import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { MongoMemoryServer } from "mongodb-memory-server";
import { chromium, type Browser, type Page } from "@playwright/test";
import { MongoClient } from "mongodb";

async function screenshot(
  page: Page,
  options: { path: string; fullPage: boolean },
) {
  await page.locator("h1").waitFor();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({ ...options, animations: "disabled" });
}

async function main() {
  let database: MongoMemoryServer | undefined;
  let server: ChildProcess | undefined;
  let browser: Browser | undefined;
  let mongo: MongoClient | undefined;
  const logs: string[] = [];
  const checks: string[] = [];
  const base = "http://localhost:3100";
  function pass(message: string) {
    checks.push(message);
    console.log(`PASS ${message}`);
  }
  try {
    console.log("Starting an isolated MongoDB instance…");
    database = await MongoMemoryServer.create({
      binary: { version: "7.0.14" },
    });
    const uri = database.getUri("gamehouse_test");
    mongo = await new MongoClient(uri).connect();
    server = spawn(
      process.execPath,
      ["node_modules/next/dist/bin/next", "start", "-p", "3100"],
      {
        env: { ...process.env, MONGODB_URI: uri },
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    server.stdout?.on("data", (data) => logs.push(data.toString()));
    server.stderr?.on("data", (data) => logs.push(data.toString()));
    let ready = false;
    for (let i = 0; i < 90; i++) {
      try {
        if ((await fetch(base)).ok) {
          ready = true;
          break;
        }
      } catch {
        /* Wait for Next.js. */
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    assert.ok(ready, "Next.js starts");
    browser = await chromium.launch({
      channel: process.env.PLAYWRIGHT_CHANNEL || "msedge",
      headless: true,
    });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      permissions: ["clipboard-read", "clipboard-write"],
    });
    const page = await context.newPage();
    const runtimeErrors: string[] = [];
    page.on("pageerror", (error) => runtimeErrors.push(error.message));
    await mkdir("artifacts", { recursive: true });
    await page.goto(base);
    await screenshot(page, {
      path: "artifacts/landing-desktop.png",
      fullPage: true,
    });
    assert.ok(
      await page
        .getByRole("heading", { name: "Less sorting. More playing." })
        .isVisible(),
    );
    await page.getByRole("link", { name: "Create your event" }).click();
    await page.getByRole("button", { name: "Create event" }).click();
    assert.ok(
      await page
        .getByText("Enter an event name, up to 100 characters.")
        .isVisible(),
    );
    await page
      .getByLabel("Event name", { exact: true })
      .fill("Friday Field Day");
    assert.equal(await page.locator("#slug").inputValue(), "friday-field-day");
    await page
      .getByLabel("Admin password", { exact: true })
      .fill("TeamSpirit2026!");
    await page.getByLabel("Admin email", { exact: true }).fill("organizer@example.com");
    await page.getByLabel("Confirm password").fill("different");
    await page.getByRole("button", { name: "Create event" }).click();
    assert.ok(await page.getByText("Your passwords don’t match.").isVisible());
    await page
      .getByRole("button", { name: "Show password", exact: true })
      .first()
      .click();
    assert.equal(
      await page.locator("#adminPassword").getAttribute("type"),
      "text",
    );
    await page
      .getByRole("button", { name: "Hide password", exact: true })
      .click();
    await page.getByLabel("Confirm password").fill("TeamSpirit2026!");
    await page.getByRole("button", { name: "Add team" }).click();
    await page.locator("#group-2-name").fill("Blue Comets");
    await page.getByRole("button", { name: "Remove team 3" }).click();
    await page.locator("#group-1-name").fill("Green Rockets");
    await page.getByRole("button", { name: "Create event" }).click();
    assert.ok(
      await page.getByText("Each team needs a different name.").isVisible(),
    );
    await page.locator("#group-1-name").fill("Orange Sparks");
    await screenshot(page, {
      path: "artifacts/create-desktop.png",
      fullPage: true,
    });
    await page.route("**/api/game", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await route.continue();
    });
    await page.getByRole("button", { name: "Create event" }).click();
    await page.getByRole("button", { name: "Creating your event…" }).waitFor();
    assert.ok(
      await page
        .getByRole("button", { name: "Creating your event…" })
        .isDisabled(),
    );
    await page.waitForURL(/\/admin\?event=friday-field-day$/);
    await page.getByRole("heading", { name: "Team distribution" }).waitFor();
    pass(
      "Creation validates fields, passwords, unique teams, shows a busy state, and opens the dashboard",
    );
    const game = await mongo
      .db()
      .collection("games")
      .findOne({ slug: "friday-field-day" });
    assert.ok(game?.adminPassword.startsWith("scrypt:"));
    assert.notEqual(game?.adminPassword, "TeamSpirit2026!");
    const publicInfo = await (
      await fetch(`${base}/api/game/friday-field-day/info`)
    ).json();
    assert.equal(publicInfo.game.adminPassword, undefined);
    const registrationHtml = await (
      await fetch(`${base}/game/friday-field-day`)
    ).text();
    assert.ok(
      !registrationHtml.includes("scrypt:") &&
        !registrationHtml.includes("TeamSpirit2026!"),
    );
    const forged = await fetch(
      `${base}/api/game/friday-field-day/admin/stats`,
      { headers: { Cookie: "admin_token_friday-field-day=authorized" } },
    );
    assert.equal(forged.status, 401);
    pass(
      "Passwords are hashed, public pages exclude secrets, and forged admin cookies are rejected",
    );
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await page.waitForURL("**/admin/login");
    await page
      .getByLabel("Admin password", { exact: true })
      .fill("wrong-password");
    await page.getByLabel("Admin email", { exact: true }).fill("organizer@example.com");
    await page.getByRole("button", { name: "Open dashboard" }).click();
    await page.getByRole("dialog").waitFor();
    await screenshot(page, {
      path: "artifacts/login-error.png",
      fullPage: true,
    });
    await page.keyboard.press("Escape");
    assert.ok(!(await page.getByRole("dialog").isVisible()));
    await page
      .getByLabel("Admin password", { exact: true })
      .fill("TeamSpirit2026!");
    await page.getByRole("button", { name: "Open dashboard" }).click();
    await page.waitForURL(/\/admin\?event=friday-field-day$/);
    await page.getByRole("heading", { name: "Team distribution" }).waitFor();
    await page
      .getByText("Move participants between teams", { exact: false })
      .waitFor();
    pass(
      "Login errors use a keyboard-dismissible modal and successful login opens the empty dashboard",
    );
    await page.goto(`${base}/admin`);
    await page.getByRole("heading", { name: "Your events" }).waitFor();
    await page.getByRole("heading", { name: "Friday Field Day" }).waitFor();
    await page.getByRole("link", { name: "Manage event" }).click();
    await page.getByRole("heading", { name: "Team distribution" }).waitFor();
    pass(
      "The organizer workspace lists events and returns to event management",
    );
    await page.getByRole("button", { name: "Copy invite link" }).click();
    await page.getByText("Invite link copied.").waitFor();
    assert.equal(
      await page.evaluate(() => navigator.clipboard.readText()),
      `${base}/game/friday-field-day`,
    );
    await page.evaluate(`Object.defineProperty(navigator.clipboard, "writeText", {
      configurable: true,
      value: () => Promise.reject(new Error("Clipboard unavailable"))
    })`);
    await page.getByRole("button", { name: "Copy invite link" }).click();
    await page.getByRole("dialog").waitFor();
    await page.getByRole("button", { name: "Got it" }).click();
    assert.equal(
      await page
        .locator("#invite-link")
        .evaluate((element) => document.activeElement === element),
      true,
    );
    pass(
      "Invite copying confirms success and restores focus to a selectable link if the clipboard fails",
    );
    const api = context.request;
    const malformedToggle = await api.patch(
      `${base}/api/game/friday-field-day/admin/stats`,
      { data: { registrationOpen: "false" } },
    );
    assert.equal(malformedToggle.status(), 400);
    const guest = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    const participant = await guest.newPage();
    participant.on("pageerror", (error) => runtimeErrors.push(error.message));
    await participant.goto(`${base}/game/friday-field-day`);
    await screenshot(participant, {
      path: "artifacts/registration-mobile.png",
      fullPage: true,
    });
    await participant.getByRole("button", { name: "Find my team" }).click();
    await participant.getByText("Enter your full name.").waitFor();
    await participant
      .getByLabel("Full Name", { exact: true })
      .fill("Alex Player");
    await participant
      .getByLabel("Email Address", { exact: true })
      .fill("not-an-email");
    await participant.getByRole("button", { name: "Find my team" }).click();
    await participant.getByText("Enter a valid email address.").waitFor();
    await participant
      .getByLabel("Email Address", { exact: true })
      .fill("Alex@Example.com");
    await participant.getByRole("button", { name: "Find my team" }).click();
    await participant.waitForURL("**/result?group=*");
    await participant.getByText("You’re on the team").waitFor();
    const resultName = await participant.locator("h1").textContent();
    await screenshot(participant, {
      path: "artifacts/result-mobile.png",
      fullPage: true,
    });
    await participant.reload();
    await participant.getByText("You’re on the team").waitFor();
    const duplicate = await api.post(
      `${base}/api/game/friday-field-day/register`,
      {
        data: {
          "Full Name": "Alex Player",
          "Email Address": " alex@example.COM ",
        },
      },
    );
    assert.equal(duplicate.status(), 409);
    assert.equal((await duplicate.json()).groupName, resultName);
    const invalid = await api.post(
      `${base}/api/game/friday-field-day/register`,
      { data: { "Email Address": "bad" } },
    );
    assert.equal(invalid.status(), 400);
    pass(
      "Registration validates fields, renders a persistent result, and returns the same team for normalized duplicate emails",
    );
    const parallel = await Promise.all(
      Array.from({ length: 9 }, (_, i) =>
        api.post(`${base}/api/game/friday-field-day/register`, {
          data: {
            "Full Name": `Player ${i}`,
            "Email Address": `player${i}@example.com`,
          },
        }),
      ),
    );
    for (const response of parallel)
      assert.equal(response.status(), 201, await response.text());
    const stats = await (
      await api.get(`${base}/api/game/friday-field-day/admin/stats`)
    ).json();
    assert.equal(stats.totalParticipants, 10);
    assert.deepEqual(
      stats.groupCounts.map((group: { count: number }) => group.count).sort(),
      [5, 5],
    );
    await page.getByRole("button", { name: "Refresh", exact: false }).click();
    await page.getByText("10 participants · 2 teams").waitFor();
    await screenshot(page, {
      path: "artifacts/dashboard-desktop.png",
      fullPage: true,
    });
    pass(
      "Concurrent registrations stay balanced and refreshing updates the dashboard",
    );
    const lockedToken = crypto.randomUUID();
    const lockedFirst = await api.post(
      `${base}/api/game/friday-field-day/register`,
      {
        headers: { "X-Forwarded-For": "203.0.113.30" },
        data: {
          "Full Name": "Browser Lock",
          "Email Address": "browser-lock@example.com",
          browserToken: lockedToken,
        },
      },
    );
    assert.equal(lockedFirst.status(), 201);
    const lockedAgain = await api.post(
      `${base}/api/game/friday-field-day/register`,
      {
        headers: { "X-Forwarded-For": "203.0.113.30" },
        data: {
          "Full Name": "Browser Lock Again",
          "Email Address": "different-email@example.com",
          browserToken: lockedToken,
        },
      },
    );
    assert.equal(lockedAgain.status(), 409);
    assert.equal(
      (await lockedAgain.json()).groupName,
      (await lockedFirst.json()).groupName,
    );
    const honeypot = await api.post(
      `${base}/api/game/friday-field-day/register`,
      {
        headers: { "X-Forwarded-For": "203.0.113.31" },
        data: {
          "Full Name": "Bot",
          "Email Address": "bot@example.com",
          businessFax: "filled-by-bot",
        },
      },
    );
    assert.equal(honeypot.status(), 400);
    pass(
      "Browser tokens return the original team across different emails, and honeypot submissions are rejected",
    );
    await page.route("**/api/game/*/admin/stats", async (route) => {
      if (route.request().method() === "PATCH")
        await route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({ error: "Temporary test outage." }),
        });
      else await route.continue();
    });
    await page.getByRole("button", { name: "Close registration" }).click();
    await page.getByRole("dialog").waitFor();
    await page.getByRole("button", { name: "Got it" }).click();
    assert.ok(
      await page
        .getByRole("button", { name: "Close registration" })
        .isVisible(),
    );
    await page.unroute("**/api/game/*/admin/stats");
    await page.getByRole("button", { name: "Close registration" }).click();
    await page
      .getByRole("button", { name: "Open registration", exact: true })
      .waitFor();
    await participant.goto(`${base}/game/friday-field-day`);
    await participant
      .getByRole("heading", { name: "Registration is taking a break." })
      .waitFor();
    await screenshot(participant, {
      path: "artifacts/closed-mobile.png",
      fullPage: true,
    });
    assert.equal(
      (
        await api.post(`${base}/api/game/friday-field-day/register`, {
          data: { "Full Name": "Late", "Email Address": "late@example.com" },
        })
      ).status(),
      403,
    );
    await page
      .getByRole("button", { name: "Open registration", exact: true })
      .click();
    await page.getByRole("button", { name: "Close registration" }).waitFor();
    pass(
      "Failed status changes preserve state; close/reopen controls update registration and the public closed page",
    );
    await participant.route("**/api/game/*/info", (route) => route.abort());
    await participant.goto(`${base}/game/friday-field-day/result`);
    await participant
      .getByRole("heading", { name: "Your team is still waiting." })
      .waitFor();
    await participant.unroute("**/api/game/*/info");
    await participant.getByRole("button", { name: "Try again" }).click();
    await participant.getByText("You’re on the team").waitFor();
    pass("Result network failures show a working retry action");
    const fresh = await browser.newContext();
    const freshPage = await fresh.newPage();
    await freshPage.goto(`${base}/game/friday-field-day/result`);
    await freshPage
      .getByRole("heading", { name: "Let’s find your team." })
      .waitFor();
    await freshPage.goto(`${base}/game/nonexistent-event`);
    await freshPage
      .getByRole("heading", { name: "This event is off the map." })
      .waitFor();
    pass("Missing saved results and unknown events have useful recovery pages");
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const path of [
        "/",
        "/create",
        "/game/friday-field-day",
        "/admin?event=friday-field-day",
        "/game/friday-field-day/admin/login",
        "/game/friday-field-day/result?group=Green%20Rockets",
      ]) {
        await page.goto(`${base}${path}`);
        await page.locator("h1").waitFor();
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth,
        );
        assert.equal(
          overflow,
          false,
          `No horizontal overflow at ${width}px on ${path}`,
        );
      }
      if (width === 390) {
        await page.goto(base);
        await screenshot(page, {
          path: "artifacts/landing-mobile.png",
          fullPage: true,
        });
      }
    }
    pass(
      "All six pages fit 320px, 390px, 768px, and 1440px viewports without horizontal overflow",
    );
    const rateStatuses: number[] = [];
    for (let i = 0; i < 21; i++) {
      const rateContext = await browser.newContext();
      const response = await rateContext.request.post(
        `${base}/api/game/friday-field-day/register`,
        {
          headers: { "X-Forwarded-For": "198.51.100.8" },
          data: {
            "Full Name": `Rate ${i}`,
            "Email Address": `rate-${i}@example.com`,
            browserToken: crypto.randomUUID(),
          },
        },
      );
      rateStatuses.push(response.status());
      await rateContext.close();
    }
    assert.equal(rateStatuses.filter((status) => status === 201).length, 20);
    assert.equal(rateStatuses[20], 429);
    pass("Registration is rate-limited per event and connection");
    await page.goto(`${base}/admin?event=friday-field-day`);
    await page.getByRole("heading", { name: "Team distribution" }).waitFor();
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await page.waitForURL("**/admin/login");
    assert.equal(
      (await api.get(`${base}/api/game/friday-field-day/admin/stats`)).status(),
      401,
    );
    pass("Signing out removes dashboard access");
    assert.deepEqual(runtimeErrors, []);
    pass("No client runtime errors during tested flows");
    await writeFile(
      "artifacts/test-results.json",
      JSON.stringify({ checks }, null, 2),
    );
    console.log(`\n${checks.length} checks passed.`);
  } catch (error) {
    console.error(logs.join(""));
    throw error;
  } finally {
    await browser?.close();
    server?.kill();
    await mongo?.close();
    await database?.stop();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
