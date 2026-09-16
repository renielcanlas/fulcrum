export async function sandboxIsEnabled(runtime) {
  return Boolean((await runtime.configuration.get("application")).config.allowSyntheticSandbox);
}

export async function requireSandbox(runtime) {
  if (!(await sandboxIsEnabled(runtime))) throw new Error("sandbox_disabled");
}
