/**
 * bson (via mongodb -> mongoose) calls
 *   process.getBuiltinModule('v8').startupSnapshot.isBuildingSnapshot()
 * at import time. Bun 1.3.14 throws NotImplementedError on that call, so
 * importing mongoose crashes the process before the server ever starts.
 *
 * bson optional-chains `startupSnapshot?.`, so hiding the property makes it
 * skip the call entirely.
 *
 * ponytail: drop this file (and the bunfig preload) once Bun implements
 * node:v8 startupSnapshot.
 */

const originalGetBuiltinModule = process.getBuiltinModule;

process.getBuiltinModule = ((id: string) => {
  const mod = originalGetBuiltinModule.call(process, id);
  return id === 'v8' && mod
    ? Object.create(mod, { startupSnapshot: { value: undefined } })
    : mod;
}) as typeof process.getBuiltinModule;
