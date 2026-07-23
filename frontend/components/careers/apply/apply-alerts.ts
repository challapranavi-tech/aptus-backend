/**
 * Shared careers-apply alert copy — keep wording here so banners stay consistent
 * and "Please fix…" phrasing cannot creep back into the wizard.
 */

export const APPLY_STEP_ERROR_HEADING =
  "Some details need your attention before you continue:";

/** Build the submit-error banner from server field errors. */
export function formatApplySubmitErrors(
  fieldMessages: string[],
  formMsg = "",
): string {
  const list = fieldMessages.map((m) => m.trim()).filter(Boolean);
  const form = formMsg.trim();
  if (list.length === 0) return form;

  const preview = list.slice(0, 3).join(" · ");
  const more = list.length > 3 ? ` · (+${list.length - 3} more)` : "";
  const details = `${preview}${more}`;

  return form
    ? `${form} ${details}`
    : `Some details need your attention: ${details}`;
}
