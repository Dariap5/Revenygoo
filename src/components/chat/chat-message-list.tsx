"use client";

import type { ChatMessage } from "@/types";

import { ChatMessageBubble } from "./chat-message-bubble";

export function ChatMessageList({
  messages,
  onRegenerateLastAssistant,
  onEditUserMessage,
}: {
  messages: ChatMessage[];
  onRegenerateLastAssistant: () => void;
  onEditUserMessage?: (text: string) => void;
}) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-3 py-5 sm:gap-4 sm:py-6">
      {messages.map((m) => (
        <ChatMessageBubble
          key={m.id}
          message={m}
          onRegenerate={
            m.role === "assistant" ? onRegenerateLastAssistant : undefined
          }
          onEditUser={m.role === "user" ? onEditUserMessage : undefined}
        />
      ))}
    </div>
  );
}
