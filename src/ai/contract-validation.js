export function validateReferences(references = [], allowedReferences = []) {
  const allowed = new Set(allowedReferences.map(reference => `${reference.type}:${reference.id}:${reference.version ?? ""}`));
  const invalid = references.filter(reference => !allowed.has(`${reference.type}:${reference.id}:${reference.version ?? ""}`));
  return {valid: invalid.length === 0, invalid};
}

export function validateTaskOutput({assessmentId, assessmentVersionId, output, allowedReferences = [], material = false} = {}) {
  const errors = [];
  if (!output || typeof output !== "object" || Array.isArray(output)) errors.push("STRUCTURED_OUTPUT_INVALID");
  if (output && output.assessmentId && output.assessmentId !== assessmentId) errors.push("ASSESSMENT_SCOPE_MISMATCH");
  if (output && output.assessmentVersionId && output.assessmentVersionId !== assessmentVersionId) errors.push("ASSESSMENT_VERSION_MISMATCH");
  const refs = [...(output?.evidenceReferences ?? []), ...(output?.citationReferences ?? [])];
  const referenceCheck = validateReferences(refs, allowedReferences);
  if (!referenceCheck.valid) errors.push("INVALID_REFERENCE");
  if (material && refs.length === 0) errors.push("MATERIAL_CITATION_REQUIRED");
  return {valid: errors.length === 0, errors, invalidReferences: referenceCheck.invalid};
}
