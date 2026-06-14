/**
 * Recommendation Templates - Maps categories to recommended actions.
 *
 * REWRITE NOTES (full rationale in AISLING-EDITS.md):
 *  - "Feature Request" previously recommended "Ask user to check billing
 *    portal." — a copy-paste bug. Fixed to a real product-team action.
 *  - getRecommendedAction() took an `urgency` arg it never used. It now
 *    prepends an escalation note for High-urgency tickets.
 *  - shouldEscalate() previously escalated on message length > 100 and was
 *    never called anywhere. It now keys off urgency + category and is wired
 *    into AnalyzePage.
 */

const actionTemplates = {
  'Billing Issue':
    'Route to the billing team. Ask the customer to confirm the invoice number or last 4 digits of the card via the secure billing portal.',
  'Technical Problem':
    'Route to technical support. Collect steps to reproduce, browser/OS, and a screenshot or error message.',
  'General Inquiry':
    'Send the relevant help-center / FAQ link. No specialist routing needed.',
  'Feature Request':
    'Log the request in the product backlog and acknowledge the customer. No immediate support action required.',
  Unknown: 'Review manually and assign a category.',
};

/**
 * Get recommended action for a given category and urgency.
 *
 * @param {string} category - The message category
 * @param {string} [urgency] - The urgency level ("High" | "Medium" | "Low")
 * @returns {string} - Recommended next step
 */
export function getRecommendedAction(category, urgency) {
  const base = actionTemplates[category] || 'No recommendation available.';
  if (urgency === 'High') {
    return `⚠ Escalate immediately — do not leave in the standard queue. ${base}`;
  }
  return base;
}

/**
 * Get all available categories
 *
 * @returns {string[]} - List of categories
 */
export function getAvailableCategories() {
  return Object.keys(actionTemplates);
}

/**
 * Determines if a message should be escalated past the normal queue.
 *
 * @param {string} category - The message category
 * @param {string} urgency - The urgency level ("High" | "Medium" | "Low")
 * @returns {boolean} - Whether to escalate
 */
export function shouldEscalate(category, urgency) {
  if (urgency === 'High') return true;
  // A technical problem that isn't clearly low-priority warrants a closer look.
  if (category === 'Technical Problem' && urgency === 'Medium') return true;
  return false;
}
