/** Hand-written until `supabase gen types` is wired. Keep in sync with migrations. */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type OrgRole = "owner" | "admin" | "manager" | "employee";

export type ChatMessageRole = "user" | "assistant" | "system";

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: OrgRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role?: OrgRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          role?: OrgRole;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      chat_threads: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          title: string;
          scenario_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          title?: string;
          scenario_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          title?: string;
          scenario_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      chat_messages: {
        Row: {
          id: string;
          organization_id: string;
          thread_id: string;
          user_id: string | null;
          role: ChatMessageRole;
          content: string;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          thread_id: string;
          user_id?: string | null;
          role: ChatMessageRole;
          content?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          thread_id?: string;
          user_id?: string | null;
          role?: ChatMessageRole;
          content?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      audit_events: {
        Row: {
          id: string;
          organization_id: string;
          actor_user_id: string | null;
          event_type: string;
          resource_type: string | null;
          resource_id: string | null;
          payload: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          actor_user_id?: string | null;
          event_type: string;
          resource_type?: string | null;
          resource_id?: string | null;
          payload?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          actor_user_id?: string | null;
          event_type?: string;
          resource_type?: string | null;
          resource_id?: string | null;
          payload?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      org_role: OrgRole;
      chat_message_role: ChatMessageRole;
    };
    CompositeTypes: Record<string, never>;
  };
}
