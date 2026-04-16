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

export type LlmAdminProvider =
  | "openai"
  | "anthropic"
  | "gigachat"
  | "yandexgpt"
  | "routerai";

export type DlpPolicyAction = "warn" | "block" | "redact";
export type DlpPolicyAppliesTo = "all" | "role" | "user";

/** Статус файла в базе знаний (RAG позже меняет processing → ready). */
export type KnowledgeSourceStatusDb = "processing" | "ready" | "failed";

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
      invitations: {
        Row: {
          id: string;
          org_id: string;
          email: string;
          role: OrgRole;
          token: string;
          expires_at: string;
          accepted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          email: string;
          role?: OrgRole;
          token?: string;
          expires_at: string;
          accepted_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          email?: string;
          role?: OrgRole;
          token?: string;
          expires_at?: string;
          accepted_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      scenario_templates: {
        Row: {
          id: string;
          org_id: string | null;
          title: string;
          description: string;
          category: string;
          prompt_template: string;
          is_public: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id?: string | null;
          title: string;
          description: string;
          category: string;
          prompt_template: string;
          is_public?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string | null;
          title?: string;
          description?: string;
          category?: string;
          prompt_template?: string;
          is_public?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      policies: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          action: string;
          enabled_types: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          action?: string;
          enabled_types?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          action?: string;
          enabled_types?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      dlp_policies: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          enabled_types: string[];
          action: DlpPolicyAction;
          applies_to: DlpPolicyAppliesTo;
          target_id: string | null;
          priority: number;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          name: string;
          enabled_types?: string[];
          action: DlpPolicyAction;
          applies_to: DlpPolicyAppliesTo;
          target_id?: string | null;
          priority?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          name?: string;
          enabled_types?: string[];
          action?: DlpPolicyAction;
          applies_to?: DlpPolicyAppliesTo;
          target_id?: string | null;
          priority?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      org_settings: {
        Row: {
          organization_id: string;
          llm_provider: string | null;
          llm_api_key: string | null;
          llm_model: string | null;
          llm_base_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          organization_id: string;
          llm_provider?: string | null;
          llm_api_key?: string | null;
          llm_model?: string | null;
          llm_base_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          organization_id?: string;
          llm_provider?: string | null;
          llm_api_key?: string | null;
          llm_model?: string | null;
          llm_base_url?: string | null;
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
          pinned: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          title?: string;
          scenario_id?: string | null;
          pinned?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          title?: string;
          scenario_id?: string | null;
          pinned?: boolean;
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
      org_llm_settings: {
        Row: {
          id: string;
          organization_id: string;
          provider: LlmAdminProvider;
          api_key_encrypted: string;
          model_name: string;
          max_tokens: number;
          enabled: boolean;
          base_url: string | null;
          monthly_token_limit: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          provider: LlmAdminProvider;
          api_key_encrypted: string;
          model_name: string;
          max_tokens?: number;
          enabled?: boolean;
          base_url?: string | null;
          monthly_token_limit?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          provider?: LlmAdminProvider;
          api_key_encrypted?: string;
          model_name?: string;
          max_tokens?: number;
          enabled?: boolean;
          base_url?: string | null;
          monthly_token_limit?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      token_usage: {
        Row: {
          org_id: string;
          user_id: string;
          month: string;
          tokens_used: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          org_id: string;
          user_id: string;
          month: string;
          tokens_used?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          org_id?: string;
          user_id?: string;
          month?: string;
          tokens_used?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      knowledge_sources: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          file_path: string;
          size: number;
          status: KnowledgeSourceStatusDb;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          name: string;
          file_path: string;
          size: number;
          status?: KnowledgeSourceStatusDb;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          name?: string;
          file_path?: string;
          size?: number;
          status?: KnowledgeSourceStatusDb;
          created_at?: string;
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
          has_dlp_findings: boolean;
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
    Functions: {
      increment_token_usage: {
        Args: {
          p_org_id: string;
          p_user_id: string;
          p_month: string;
          p_delta: number;
        };
        Returns: undefined;
      };
    };
    Enums: {
      org_role: OrgRole;
      chat_message_role: ChatMessageRole;
      llm_admin_provider: LlmAdminProvider;
      dlp_policy_action: DlpPolicyAction;
      dlp_policy_applies_to: DlpPolicyAppliesTo;
      knowledge_source_status: KnowledgeSourceStatusDb;
    };
    CompositeTypes: Record<string, never>;
  };
}
