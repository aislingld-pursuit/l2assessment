/**
 * Urgency Scorer — classifies a customer message as "High" | "Medium" | "Low".
 *
 * REWRITE NOTES (full rationale in AISLING-EDITS.md):
 * The original scorer was inverted. Exclamation marks RAISED urgency, short
 * messages LOWERED it, and there were no urgency keywords at all — so
 * "Server down now" scored Low and "Thank you!!!" scored High. For a triage
 * product whose whole job is prioritization, that actively misroutes the
 * worst tickets to the bottom of the queue.
 *
 * This version scores on MEANING: it scans for words that actually signal how
 * urgent a support issue is. Wall-clock time was removed from the score —
 * WHEN a message arrives is a routing/SLA concern, not a property of the
 * message's severity (and it made the function non-deterministic / untestable).
 *
 * ARCHITECTURE — policy vs mechanism:
 *   • urgencyConfig (below)  = POLICY:    which words matter, how much, cutoffs.
 *   • calculateUrgency()     = MECHANISM: scans, tallies, maps to a label.
 * Tuning triage behavior = editing the config (data), not rewriting logic.
 */

// ════════════════════════════════════════════════════════════════════════
//  POLICY  ──  TODO(aisling): you own this block. It shapes the product.
//
//  Expand the `terms` for each tier and tune the `weights` + `thresholds`.
//  Run `npm test` after each change to watch the test cases flip.
//
//  Decisions worth making deliberately:
//    • What words mean "drop everything"?  (outage, breach, can't access…)
//    • Should polite / positive language LOWER urgency? (sentiment vs severity)
//    • Where do the High / Low cutoffs sit? Too low → everything reads High
//      (alert noise); too high → real fires get marked Medium (missed SLAs).
//
//  I seeded one or two terms per tier so you can see the shape and so the
//  mechanism runs. The rest is yours.
// ════════════════════════════════════════════════════════════════════════
export const urgencyConfig = {
  baseScore: 0,

  // Each group: if ANY term appears in the message, add `weight` once.
  // Positive weight = more urgent. Negative weight = calmer.
  signals: [
    {
      label: 'critical', // "drop everything" — these jump the queue
      weight: 50,
      terms: [
        'down',
        'outage',
        'offline',
        "can't access",
        'cannot access',
        "can't log in",
        'cannot log in',
        'locked out',
        'broken',
        'crashed',
        'urgent',
        'asap',
        'immediately',
        'emergency',
        'critical',
        'data loss',
        'connection lost',
        'breach',
        'hacked',
        'unauthorized',
        'fraud',
      ],
    },
    {
      label: 'elevated', // "something's wrong" — needs attention, not a fire
      weight: 25,
      terms: [
        'error',
        'not working',
        "isn't working",
        'failing',
        'failed',
        'stuck',
        'timeout',
        'timing out',
        'deadline',
        'still waiting',
        'overcharged',
        'double charged',
        'wrong charge',
      ],
    },
    {
      label: 'calming', // signals NO fire — friendly / informational
      weight: -30,
      terms: [
        'thank',
        'thanks',
        'appreciate',
        'love',
        'great',
        'awesome',
        'no rush',
        'no hurry',
        'just wondering',
        'whenever you get a chance',
      ],
    },
  ],

  // score >= high  → "High"   |   score <= low → "Low"   |   else → "Medium"
  // low = 0: a message with no urgency signal at all defaults to Low. See the
  // false-negative trade-off note in AISLING-EDITS.md.
  thresholds: {
    high: 40,
    low: 0,
  },
}

/**
 * Classify a customer message's urgency.
 *
 * @param {string} message - the raw customer support message
 * @returns {"High"|"Medium"|"Low"}
 */
export function calculateUrgency(message) {
  if (!message || !message.trim()) return 'Low'

  const text = message.toLowerCase()
  let score = urgencyConfig.baseScore

  for (const signal of urgencyConfig.signals) {
    const hit = signal.terms.some((term) => text.includes(term.toLowerCase()))
    if (hit) score += signal.weight
  }

  const { high, low } = urgencyConfig.thresholds
  if (score >= high) return 'High'
  if (score <= low) return 'Low'
  return 'Medium'
}
