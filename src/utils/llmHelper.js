import Groq from 'groq-sdk';

/**
 * LLM Helper for categorizing customer support messages.
 *
 * REWRITE NOTES (full rationale in AISLING-EDITS.md):
 * The original asked the model to "Categorize this message" with no taxonomy,
 * no output format, and temperature 0.7 — then picked a category by substring-
 * matching the model's prose (`content.includes('billing')`). That meant
 * "this is NOT a billing issue" still tagged Billing, and the same message
 * could land in different categories on repeat runs.
 *
 * This version constrains the model: a fixed category enum in a system prompt,
 * JSON output (response_format), and temperature 0 for determinism. We parse a
 * guaranteed `category` field and validate it against the enum instead of
 * scanning free text.
 */

// The allowed categories. Keep in sync with templates.js actionTemplates keys.
export const CATEGORIES = [
  'Billing Issue',
  'Technical Problem',
  'Feature Request',
  'General Inquiry',
];

const FALLBACK_CATEGORY = 'General Inquiry';

const SYSTEM_PROMPT = `You are a customer support triage assistant for a SaaS product.
Classify each customer message into exactly ONE of these categories:
- "Billing Issue": payments, invoices, refunds, subscriptions, charges, plan changes.
- "Technical Problem": bugs, errors, outages, things not working, access/login problems.
- "Feature Request": suggestions, enhancements, "it would be nice if", new functionality.
- "General Inquiry": questions, how-to, info requests, or anything that fits none of the above.

Respond ONLY with a JSON object of this exact shape, no extra text:
{"category": "<one of the categories above, verbatim>", "reasoning": "<one or two sentences explaining the choice>"}`;

// Initialize Groq client
const groq = import.meta.env.VITE_GROQ_API_KEY ? new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true // Required for browser-based calls (not recommended for production!)
}) : null;

/**
 * Categorize a customer support message using Groq AI.
 *
 * @param {string} message - The customer support message
 * @returns {Promise<{category: string, reasoning: string, source: 'ai'|'mock'}>}
 *   `source` is 'mock' when the keyword fallback produced the result (no API
 *   key, API error, or unparseable response) so the UI can flag it as not real AI.
 */
export async function categorizeMessage(message) {
  if (!groq) {
    // No API key configured — fall back to the local keyword classifier
    // rather than throwing, but mark the result so the UI can warn.
    return getMockCategorization(message);
  }

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: message },
      ],
      temperature: 0,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content ?? '';
    const parsed = JSON.parse(content);

    // Validate against the enum — never trust the model to stay in-vocabulary.
    const category = CATEGORIES.includes(parsed.category)
      ? parsed.category
      : FALLBACK_CATEGORY;

    const reasoning =
      typeof parsed.reasoning === 'string' && parsed.reasoning.trim()
        ? parsed.reasoning.trim()
        : 'No reasoning provided by the model.';

    return { category, reasoning, source: 'ai' };
  } catch (error) {
    console.warn('Groq API/parse failed, using keyword fallback:', error.message);
    return getMockCategorization(message);
  }
}

/**
 * Local keyword-based classifier used when the LLM is unavailable.
 * Always tags `source: 'mock'` so callers can surface "AI unavailable".
 */
function getMockCategorization(message) {
  const lowerMessage = message.toLowerCase();

  const reasoningVariations = {
    billing: [
      'Contains billing terminology (payments, invoices, or charges); likely a billing concern.',
      'References account charges or payment matters; routed as a billing issue.',
    ],
    technical: [
      'Describes errors or functionality problems; routed as a technical issue.',
      'Mentions a bug or system problem requiring technical support.',
    ],
    feature: [
      'Reads as a suggestion or enhancement request rather than a support problem.',
      'Requests new or improved functionality; routed to product as a feature request.',
    ],
    inquiry: [
      'A general question or information request with no specific problem.',
      'Informational request; routed as a general inquiry.',
    ],
  };

  const pick = (key) => {
    const reasons = reasoningVariations[key];
    return reasons[Math.floor(Math.random() * reasons.length)];
  };

  const result = (category, key) => ({
    category,
    reasoning: `[Keyword fallback — AI unavailable] ${pick(key)}`,
    source: 'mock',
  });

  // Billing-related detection
  if (lowerMessage.includes('bill') || lowerMessage.includes('payment') ||
      lowerMessage.includes('charge') || lowerMessage.includes('invoice') ||
      lowerMessage.includes('credit card') || lowerMessage.includes('subscription') ||
      lowerMessage.includes('refund') || (lowerMessage.includes('cancel') && lowerMessage.includes('account'))) {
    return result('Billing Issue', 'billing');
  }

  // Technical problem detection
  if (lowerMessage.includes('bug') || lowerMessage.includes('error') ||
      lowerMessage.includes('broken') || lowerMessage.includes('not working') ||
      lowerMessage.includes('crash') || lowerMessage.includes('down') ||
      lowerMessage.includes('server') || lowerMessage.includes('loading') ||
      lowerMessage.includes('slow') || lowerMessage.includes('issue') ||
      (lowerMessage.includes('problem') && !lowerMessage.includes('no problem'))) {
    return result('Technical Problem', 'technical');
  }

  // Feature request detection
  if (lowerMessage.includes('feature') || lowerMessage.includes('improve') ||
      lowerMessage.includes('would like to see') || lowerMessage.includes('suggestion') ||
      lowerMessage.includes('wish') || lowerMessage.includes('enhancement') ||
      lowerMessage.includes('would be great') ||
      (lowerMessage.includes('add') && (lowerMessage.includes('please') || lowerMessage.includes('could')))) {
    return result('Feature Request', 'feature');
  }

  // Default: general inquiry
  return result('General Inquiry', 'inquiry');
}
