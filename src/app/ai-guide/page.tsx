import { redirect } from "next/navigation";

/** Совместимость со старым URL из кабинета: инструкция теперь в потоке onboarding. */
export default function AiGuideLegacyRedirectPage() {
  redirect("/onboarding/ai-guide");
}
