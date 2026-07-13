/**
 * AI / LLM prompt-injection posture (OWASP LLM01).
 *
 * This monorepo currently has NO OpenAI/Anthropic/AI SDK usage. Contact and
 * career form input goes to SMTP only — never into a model prompt.
 *
 * If AI features are added later, follow these rules (do not weaken them):
 *  1. Treat all user text as untrusted data — never concatenate it into the
 *     system prompt string.
 *  2. Use structured chat roles: system (fixed instructions) vs user/assistant
 *     messages; keep system instructions in code/config, not in user fields.
 *  3. Delimit untrusted content explicitly when embedding (e.g. XML-ish tags
 *     like <user_input>...</user_input>) and instruct the model to treat the
 *     interior as data, not instructions.
 *  4. Validate/filter length and dangerous patterns at the API boundary;
 *     rate-limit AI endpoints; never send secrets/API keys in prompts.
 *  5. Prefer tool/function calling with allowlisted tools over free-form
 *     instruction following for privileged actions.
 */

export const HAS_AI_FEATURES = false as const;

/** Wrap untrusted text for future LLM user-message payloads. */
export function wrapUntrustedUserInput(text: string): string {
  const safe = text.replace(/<\/?user_input>/gi, "");
  return `<user_input>\n${safe}\n</user_input>`;
}
