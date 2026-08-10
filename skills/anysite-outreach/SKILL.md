---
name: anysite-outreach
description: Write first-touch and follow-up outreach (cold email, LinkedIn DM) grounded in a REAL detail collected by the other anysite skills - a funding round, a job change, a recent post, a competitor switch, a hiring signal - not generic personalization. Turns "we found the contact" into "here's the message". Use when the user wants to draft outreach, a cold email, a DM, a follow-up sequence, subject lines, or personalize a message to a prospect - "напиши письмо", "cold email", "аутрич", "сообщение лиду". Pairs with anysite-crm-signals/champions/prospect/account-brief (the detail) and the email cascade (the address). Drafts text; sending is the operator's own tool.
---

# Outreach

The other skills end at "found the contact, here's the email". This one writes
the message — and its whole value is that the message rides a **specific fact you
already collected**, not a generic template every competitor also sends.

The rule that decides everything: **could this exact message be sent to another
company?** If yes, it's generic — rewrite it or don't send it. If no, it's ready.

## Where the detail comes from (don't invent it)

A good first touch names one concrete, non-transferable thing. You already have
these from the sourcing/signal skills — use them, in rough order of strength:

| Source skill | The detail to open on |
|---|---|
| `anysite-crm-champions` | they just changed jobs / were your champion at <old co> |
| `anysite-crm-signals` | fresh funding round, exec hire, hiring surge, layoff, news |
| `anysite-crm-competitor-intel` | they use <competitor>, and a pain from its reviews |
| `anysite-account-brief` / `people-sourcing` | a recent post/comment, a stated priority, tenure milestone |
| `anysite-company-sourcing` | a homepage quote, a product name, a specific metric |

**No specific detail found → do NOT manufacture one.** Manufactured insight
("AI agents fail more on stale data than bad logic") reads as mansplaining and is
worse than no touch. Either fall back to a plainly-labelled category template, or
mark the lead "weak data, skip" and tell the user.

## The formula (first touch)

```
[one detail about THEM] — [what you offer, one line] — [one simple question]?
```

Hard constraints (violate none):
- **≤2 sentences, ~25–40 words** (a DM ≤ ~250 chars). Five seconds to read.
- **Exactly one detail about them** — not three.
- **Exactly one number** (your price/metric) — never two competing figures.
- **End on a question, not a CTA.** "worth a look?" / "open to a test?" — never
  "book a 15-min demo".
- **Plain language.** No analyst-speak ("compounding savings", "unit economics"),
  no sycophancy ("you say X — agreed"), no "Saw…/I noticed…" openers (mass-mail
  tell).

## Channel differences

- **Email:** needs a subject line — 2–4 words, lower-case, curiosity or the
  detail itself ("stale lists", "your Series B"); never the pitch. Run copy
  through a spam-word check (avoid "free", "guarantee", "act now", "$$$",
  ALL-CAPS, many exclamation points) — they wreck deliverability. Verify the
  address is a WORK email and validated (per the email cascade in `anysite-mcp`);
  never send to a personal or unverified address.
- **LinkedIn DM:** lower-case start, no subject, and **do not mention "LinkedIn"
  in the text** (moderation risk). Even tighter — one detail, one question.

## The sequence (4 touches, one idea each)

| # | Job | Length | Contents |
|---|---|---|---|
| 1 Hook | catch them with the detail | 25–40 w | 1 detail + 1 line of value + simple question |
| 2 Math/Fit | the value in THEIR numbers | 30–45 w | their scale × the stakes + "worth comparing?" |
| 3 Proof | one relevant proof point | 30–50 w | similar customer + one figure + soft CTA |
| 4 Break-up | close, door open | 20–30 w | "no worries" + a low-friction offer if ever useful |

Space them; each carries a single new idea. Incentives (a free trial, a credit
grant) belong in touch 3–4, never touch 1 — the first message is only a question.

## Self-check before it ships (all must pass)

- [ ] One detail, and it's concrete (product name / quote / metric / event) — not
      "your outbound", "your AI".
- [ ] Mental test passes: this message can't be sent to another company.
- [ ] One number only. Ends on a question. ≤2 sentences.
- [ ] No "Saw…", no analyst-speak, no forced agreement.
- [ ] Email: subject present, spam-word-clean, address is verified work email.
- [ ] DM: lower-case, no "linkedin" in the text.
- [ ] Nothing invented — every claim about them traces to collected data.

Fail one → rewrite. This is deterministic; run it on every draft, like the
`validate_hook` discipline it's ported from.

## Boundaries

- **Drafts only.** This skill produces text; the operator sends via their own
  tool. If they want the copy stored, `anysite-crm-*` can write it to a mapped
  field (e.g. `hook_text`) via the profile — dry-run first, per the Writing rules.
- Compliance: personalize from facts, not from private inference; respect that a
  personal inbox and an unconsented contact are not fair game for a work sequence.
- Anti-patterns live in `sales_agent/anysite_hook_style_guide.md` (5 gold
  examples + the four failure modes) — consult it when a draft feels off.
