/**
 * Подложки иконок сценариев — чуть мягче по насыщенности, чем «неон».
 */
export const SCENARIO_ICON_GRADIENT: Record<string, string> = {
  "write-email":
    "linear-gradient(135deg, #7b82ef 0%, #a78bfa 52%, #c9b6f5 100%)",
  "doc-summary":
    "linear-gradient(135deg, #38a3d9 0%, #5ec8d8 50%, #7dd3c0 100%)",
  research:
    "linear-gradient(135deg, #8b7fd8 0%, #6d7ae8 48%, #5b8def 100%)",
  presentation:
    "linear-gradient(135deg, #e85a9b 0%, #f288b8 48%, #fbad7c 100%)",
  translate:
    "linear-gradient(135deg, #2fa8a0 0%, #4ab8c9 50%, #6b9ee8 100%)",
  "code-help":
    "linear-gradient(135deg, #6b7288 0%, #5b7bc8 48%, #8b7fd8 100%)",
  "meeting-recap":
    "linear-gradient(135deg, #d4a82a 0%, #e8955c 52%, #e8837a 100%)",
  brainstorm:
    "linear-gradient(135deg, #d4c038 0%, #e8b04a 48%, #f0a868 100%)",
};

const FALLBACK =
  "linear-gradient(135deg, #94a3b8 0%, #7c8aa0 100%)";

export function scenarioIconGradientStyle(scenarioId: string): {
  background: string;
} {
  const background = SCENARIO_ICON_GRADIENT[scenarioId];
  return { background: background ?? FALLBACK };
}
