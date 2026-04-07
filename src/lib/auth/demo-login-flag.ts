/** Демо-логин (пароль `demo`) без Supabase — только если явно включено. */
export function isDemoLoginEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === "true";
}
