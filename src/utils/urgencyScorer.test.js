/* global process */
/**
 * Test harness for the urgency scorer.
 *
 * Plain Node, no test framework — run with:  npm test   (or: node src/utils/urgencyScorer.test.js)
 *
 * These cases are the TARGETS. With the seeded policy some pass and some fail.
 * Filling in urgencyConfig.signals (in urgencyScorer.js) is how you turn the
 * FAILs green. A few targets are judgment calls (e.g. feature requests) — if
 * you disagree, change the `expected` value AND defend it in AISLING-EDITS.md.
 */
import { calculateUrgency } from './urgencyScorer.js'

const cases = [
  // ── Should be HIGH: real fires the old scorer buried as "Low" ──────────
  { message: 'Our production server is down', expected: 'High' },
  { message: 'Database connection lost', expected: 'High' },
  { message: 'Server down now', expected: 'High' },
  { message: "I can't access my account at all", expected: 'High' },
  { message: 'URGENT: payment system outage, customers affected', expected: 'High' },
  { message: 'Possible security breach — please respond ASAP', expected: 'High' },

  // ── Should be LOW: friendly / no-fire messages the old scorer spiked ───
  { message: 'Thank you so much! Your team has been incredibly helpful and I appreciate the fast response!', expected: 'Low' },
  { message: 'Just browsing your site and I love the new design, great work!', expected: 'Low' },
  { message: 'What are your business hours?', expected: 'Low' },
  { message: 'No rush, just wondering if a dark mode is on the roadmap', expected: 'Low' },

  // ── Should be MEDIUM: something's off, not an emergency ────────────────
  { message: "I'm getting an error when I save and it's not working right", expected: 'Medium' },
  { message: 'My export keeps failing, can you take a look when you get a chance?', expected: 'Medium' },
]

let pass = 0
const width = 60

console.log('\nUrgency scorer — test results')
console.log('='.repeat(width))
for (const { message, expected } of cases) {
  const actual = calculateUrgency(message)
  const ok = actual === expected
  if (ok) pass++
  const mark = ok ? 'PASS' : 'FAIL'
  const snippet = message.length > 46 ? message.slice(0, 43) + '...' : message
  console.log(`[${mark}] want ${expected.padEnd(6)} got ${actual.padEnd(6)} | ${snippet}`)
}
console.log('='.repeat(width))
console.log(`${pass}/${cases.length} passing\n`)

process.exit(pass === cases.length ? 0 : 1)
