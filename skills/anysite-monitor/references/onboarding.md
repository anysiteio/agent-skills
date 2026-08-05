# Onboarding Playbook (Setup mode)

Onboarding is where the monitor is actually designed. Nothing about which sources
to use is decided in advance — that is the whole point. You start from the
user's decision, and only then search the live catalog for endpoints that serve
it. A monitor assembled from a canned list watches what someone else once found
interesting; a monitor assembled here watches what this user needs.

Run it interactively (`AskUserQuestion` when the user is present). Move in small
steps and reflect back what you heard — a monitor built on a misunderstanding
burns credits every single day and trains the user to ignore its digests.

## Step 1 — The decision, then the targets

Ask what **decision or action** this monitor should support. Not "what do you
want to watch" — "what will you do differently when it fires?" That answer
determines everything downstream: an answer like "I'd pick up the phone" needs
sharp, rare, high-confidence signals; "I want to stay generally informed" needs a
broader, quieter weekly digest.

Then get the targets, and push for **resolvable handles**: domain, LinkedIn slug,
subreddit, @handle, ticker, product page URL — not bare names. "Watch Acme" is
not a target; `acme.com` + `linkedin.com/company/acme` is. Vague targets produce
vague monitors and wasted calls.

Also establish up front, because they change the design:

- **Volume tolerance** — a daily digest they'll actually read, or everything?
- **Cadence** — daily/weekly/hourly, in the user's timezone.
- **Delivery** — where they'll actually see it (see Step 5).
- **Recency vs completeness** — is a missed item acceptable, or must nothing slip?

## Step 2 — Translate the decision into signals

Restate the goal as a short list of concrete **signals** in plain language, and
confirm the list before touching the catalog. Examples of the shape (not a menu
to copy — derive them from what the user said):

- "I'd act if a competitor changed pricing" → watch their pricing page for edits.
- "I'd act if they staffed up sales in Europe" → watch their job postings.
- "I'd act if someone in my market complained about them publicly" → watch
  community/review sources for mentions.

Each signal must be phrased so it's testable: *what item appears, and what makes
it worth reporting?* If a signal can't be phrased that way, it isn't ready to
automate — narrow it with the user.

## Step 3 — Find the sources live, then verify them

Now, and only now, go to the catalog. Follow `source-discovery.md` in full for
each signal: grep `llms-full.txt` for candidates → `discover` for the exact
params and `response_fields` → one small `execute` probe on a real target →
record the verified spec.

Two things to surface to the user while you do this, because they shape expectations:

- **What you found, in their words**: "for pricing I'll watch the page itself and
  flag text changes; for hiring I found their Greenhouse board and will report
  new postings" — plus anything you *couldn't* find, honestly ("no source covers
  their private Slack community; skipping").
- **Time filters**: if an endpoint supports one, say the monitor will only fetch
  since the last run (cheaper, faster). If it doesn't, say the monitor fetches
  the recent N and dedupes locally — that's where `max_items_per_source` matters.

Suggest 1–2 signals they did not ask for but that clearly serve the stated
decision, and let them decline. This is how users discover what's possible
without being handed a catalog.

## Step 4 — Size it before committing

Say the cost out loud, in calls, before registering anything:

```
targets × signals = N execute calls per run
N × runs/day × 30 = calls/month
```

Then ask if that's proportionate. Trimming happens here — one target the user is
lukewarm about, or a daily cadence that could be weekly, is the difference
between a monitor they keep and one they cancel. Also flag the reverse risk: if a
source is busy and the cadence is slow, `max_items_per_source` may overflow and
items will be missed silently — recommend a tighter cadence or a higher cap.

## Step 5 — Delivery that will actually be seen

A scheduled run has no one watching the session. Default to a channel that
reaches the user (email/push via the task's notifications, or a connector like
Telegram/Slack). `session` delivery is only right for a dry run, or when the user
explicitly reads their scheduled-task history.

## Step 6 — Agree, register, baseline

1. Show the whole monitor as a readable summary — targets, signals, the source
   behind each signal (in plain language), cadence, delivery, baseline mode,
   storage, and the call estimate. Not raw JSON.
2. Explicitly invite correction: "anything here you don't care about?" and
   "anything I missed?" Iterate until they confirm. This agreement step is the
   product of onboarding — don't skip to registration on the first draft.
3. Offer a **dry run**: execute one collection pass and show the real digest, so
   they approve the format and see actual data before a schedule exists.
4. Register the scheduled task (see SKILL.md → *Scheduling*), then run the silent
   baseline so the ledger is seeded. Tell them what's tracked and when the first
   real digest lands.

## Managing an existing monitor

Users come back to adjust. Support: add/remove targets or signals (re-run Step 3
for anything new, and baseline **only the additions** so they aren't spammed with
history), change cadence or delivery, pause/resume, tear down. When a source has
been reporting nothing for several runs, raise it — either the target went quiet
or the endpoint changed, and both deserve a decision rather than silent drift.
