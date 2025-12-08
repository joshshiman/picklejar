# PickleJar UX Navigation & Icon Language Guide

This guide keeps the product voice consistent whenever we design navigation, buttons, and iconography. Everything should feel like part of the same playful pickle universe while staying crystal clear to hosts and guests.

---

## 1. Brand Voice Principles

1. **Playfully decisive:** We help crews stop dithering—copy should feel confident, not sarcastic.
2. **Pickle-forward:** Use pickle metaphors where it aids delight, but always anchor with clarity (“Pickle Drop (new suggestion)”).
3. **Low-friction utility:** If a joke blocks comprehension, tone it down. Accessibility and speed still win.

---

## 2. Navigation Language Map

| Area | Primary Label | Helper/Tooltip | Notes |
|------|---------------|----------------|-------|
| Root CTA | `Start a PickleJar ↵` | – | Always use mixed case “PickleJar.” |
| Suggest phase | `Drop a Pickle` | `Add a new idea (suggestion)` | Keep verb (“Drop”) for buttons. |
| Vote phase | `Vote on Pickles` | `Spend your points on favorite pickles` | Reinforce points mechanic. |
| Results | `Winning Pickle` | `Revealed once voting wraps` | Use singular even if tie (tie handled in body copy). |
| Deadlines | `Pickle Drop Deadline` / `Pickle Voting Deadline` | `Automatically nudges the jar forward` | Keep “Deadline” suffix for clarity. |
| Meta navigation | `Pickle Jar (pickles/suggestions)` | – | Use parenthetical when bridging user understanding. |

**Rules of thumb**

- Top-level nav items = Title Case.
- Inline CTAs = imperative verb + pickle noun (e.g., “Review Pickles”).
- Breadcrumbs show literal system nouns (`Jar → Pickle Drop → Vote → Results`).

---

## 3. Icon System

PickleJar uses Lucide React. Map icons to actions consistently:

| Icon | Component | Usage | Rationale |
|------|-----------|-------|-----------|
| `GiPickle` *(custom SVG)* or `Sparkles` | Brand flourish | Optional accent in hero or timeline markers. |
| `Share2` | Share footer FAB/button | Universal share metaphor recognized by mobile browsers. |
| `Copy` | Copy-to-clipboard | Appears next to share URL. Pair with toast copy “Link copied to your pickle jar.” |
| `Edit2` | Host controls/phase edit | Indicates configuration, not suggestion editing (use `Pencil` inside cards instead). |
| `Circle` / `Check` | Timeline nodes | Empty circle = upcoming, half-fill gradient = in-progress, check = done. |
| `PlusSquare` | “Drop a Pickle” card | Conveys add action on card grid. |
| `Info` | Helper tooltips | Pair with aria-label “About pickles.” |
| `AlertTriangle` | Deadline passed / attention | Toast + inline for overdue states. |

**Icon styling**

- Stroke width 1.5px default; match Tailwind `text-gray-600` base.
- Keep consistent sizing: 20px inline, 28px for cards/CTA.
- When pairing icons with copy, pad with `gap-2` and align center.

---

## 4. Navigation Layout Patterns

1. **Sticky Share Footer**
   - Primary action cluster: `Copy Link`, `Share`, `View Results` (if available).
   - Background: translucent “brine” gradient (`from-emerald-50/90 to-white`), 16px padding.
   - On mobile, ensure 64px bottom padding in scroll containers to prevent overlap.

2. **Phase Timeline**
   - Vertical spine on desktop, collapsible accordion on mobile (<640px).
   - Current phase node uses pickle-brine gradient fill.
   - Each node includes: phase title, plain-English status, small icon (Circle/Check).

3. **Pickle Cards Grid**
   - One-column stack with dashed “Drop a Pickle” card pinned first.
   - Cards show title, optional tags (cost, location), and `Plus`/`Minus` voting controls when in voting phase.

---

## 5. Copy Blocks by Surface

### 5.1 Primary CTA Buttons
- **Create flow:** “Start PickleJar ↵”
- **Suggest header:** “Drop a Pickle”
- **Vote header:** “Spend Your Points”
- **Results CTA:** “Share Winning Pickle”

Always follow with a supportive description line:
- e.g., “Add context so everyone knows why this pickle rules.”

### 5.2 Toast Templates
| Scenario | Message | Tone |
|----------|---------|------|
| Success | “Your pickle is in the jar.” | Confident, short. |
| Error | “That pickle slipped. Try again in a moment.” | Light but informative. |
| Copy | “Link copied to your pickle jar.” | Reinforce metaphor. |

---

## 6. Accessibility & Localization Notes

1. **Aria labels** should mention both metaphor and function (“Drop a Pickle (add suggestion)”).
2. Keep icon-only buttons at 44px min hit area.
3. Avoid idioms that break when translated; keep “pickle” literal but pair with parentheses for first occurrence per screen.
4. High contrast: foreground `#0F172A` on backgrounds ≥ `#F8FAFC`.

---

## 7. Do / Don’t Checklist

| Do | Don’t |
|----|-------|
| Pair playful headlines with literal helper text. | Replace every internal term with pickle slang (maintain API clarity). |
| Reuse the same icon for the same intent everywhere. | Swap icons randomly because they “look fun.” |
| Keep navigation labels short (≤ 24 characters). | Stack multiple metaphors in one label (“Pickle Party Suggestion Portal”). |
| Use toast confirmations for async nav actions. | Trigger modal alerts for copy/share success states. |

---

## 8. Implementation Snippets

### 8.1 Nav Pill Component (conceptual)

Use consistent icon + label pattern:
```
<nav className="flex gap-3">
  <Link className="nav-pill active">
    <Circle className="icon" />
    Pickle Drop
  </Link>
  <Link className="nav-pill">
    <Circle className="icon icon-muted" />
    Voting
  </Link>
</nav>
```

Key styles:
- `.nav-pill`: rounded-full, `border border-emerald-200`, `text-sm font-medium`.
- `.active`: `bg-emerald-50 text-emerald-900 border-emerald-300`.

### 8.2 Icon Label Pairing

```
<button className="inline-flex items-center gap-2">
  <Share2 className="h-5 w-5 text-emerald-600" />
  Share the Pickle Jar
</button>
```

Always left-align icons for readability, especially inside long CTA bars.

---

## 9. Content Review Workflow

1. **Draft**: copy + icon selections inside Figma.
2. **Checklist pass**: ensure every nav element uses approved labels.
3. **Accessibility sweep**: verify aria labels and focus order.
4. **QA**: confirm toasts, tooltips, and icons show correct text in build.
5. **Sign-off**: product + brand review for large changes.

---

## 10. References

- `frontend/app/jar/[id]/page.tsx` for timeline + footer patterns.
- `frontend/app/how-it-works/page.tsx` for accordion tone.
- `ToastProvider` for wording examples.

Keep this guide close whenever we add routes, menus, or iconography. If a new surface needs language, log the decision here so every pickle stays in the same jar.