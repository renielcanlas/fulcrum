export function looksLikeAssignmentRequest(message, hasKnownPersona = () => false) {
  const value = String(message ?? "");
  if (!/\b(assign|reassign|assignee|owner)\b/i.test(value)) return false;
  return /\b(assignee|owner|ticket|issue|work item|jira|this|it|current|that)\b/i.test(value) || hasKnownPersona(value);
}

export function refersToCurrentUser(message) {
  return /\b(me|myself)\b/i.test(String(message ?? ""));
}
