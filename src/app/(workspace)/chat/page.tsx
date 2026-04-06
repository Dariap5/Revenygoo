import { Suspense } from "react";

import { ChatWorkspace } from "@/components/chat/chat-workspace";

function ChatFallback() {
  return (
    <div className="flex h-[50vh] items-center justify-center text-sm text-muted-foreground">
      Загрузка чата…
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<ChatFallback />}>
      <ChatWorkspace />
    </Suspense>
  );
}
