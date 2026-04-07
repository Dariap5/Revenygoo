/** Простые сообщения при сбое PATCH/DELETE/duplicate списка чатов. */

export function alertThreadHistoryMutationError(
  r:
    | { kind: "unauthorized" }
    | { kind: "forbidden" }
    | { kind: "http_error"; status: number }
    | { kind: "network" },
): void {
  const msg =
    r.kind === "unauthorized"
      ? "Сессия истекла. Войдите снова."
      : r.kind === "forbidden"
        ? "Нет доступа к этому чату."
        : r.kind === "network"
          ? "Проблема с сетью. Попробуйте ещё раз."
          : `Не удалось выполнить действие (HTTP ${r.status}).`;
  window.alert(msg);
}
