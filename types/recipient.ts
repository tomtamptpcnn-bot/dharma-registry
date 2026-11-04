import type { RegistryOption } from "@/types/options";
export interface DharmaRecipient {
  id: string;
  full_name: string;
  age: number | null;
  nickname: string | null;
  address: string | null;
  phone: string | null;
  recommended_by: string | null;
  certified_by: string | null;
  transmitted_by: string | null;
  received_date: string | null;
  received_time: string | null;
  received_end_time: string | null;
  merit_amount: number | null;
  class_name: string | null;
  level: string | null;
  received_place: string | null;
  created_at: string;
  updated_at: string;
  temple_id: string;
}
export type RecipientInput = Omit<
  DharmaRecipient,
  "id" | "created_at" | "updated_at" | "temple_id"
>;
export interface Database {
  public: {
    Tables: {
      dharma_user_access: {
        Row: { user_id: string; role: "super_admin" | "temple_admin"; temple_id: string | null; created_at: string };
        Insert: { user_id: string; role: "super_admin" | "temple_admin"; temple_id: string | null };
        Update: Partial<{ role: "super_admin" | "temple_admin"; temple_id: string | null }>;
        Relationships: [];
      };
      dharma_temples: {
        Row: { id: string; name: string; caretaker_name: string; manager_username: string; created_at: string };
        Insert: { name: string; caretaker_name?: string; manager_username?: string };
        Update: Partial<{ name: string; caretaker_name: string; manager_username: string }>;
        Relationships: [];
      };
      registry_options: {
        Row: RegistryOption;
        Insert: Pick<RegistryOption, "category" | "value" | "temple_id">;
        Update: Partial<Pick<RegistryOption, "category" | "value">>;
        Relationships: [];
      };
      dharma_recipients: {
        Row: { [K in keyof DharmaRecipient]: DharmaRecipient[K] };
        Insert: RecipientInput & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          temple_id: string;
        };
        Update: Partial<RecipientInput>;
        Relationships: [];
      };
      dharma_activity_logs: {
        Row: {
          id: number;
          actor_id: string | null;
          actor_role: string;
          actor_name: string | null;
          actor_email: string | null;
          temple_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          details: Record<string, unknown>;
          created_at: string;
        };
        Insert: Partial<{
          id: number;
          actor_id: string | null;
          actor_role: string;
          actor_name: string | null;
          actor_email: string | null;
          temple_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          details: Record<string, unknown>;
          created_at: string;
        }>;
        Update: never;
        Relationships: [{
          foreignKeyName: "dharma_activity_logs_temple_id_fkey";
          columns: ["temple_id"];
          isOneToOne: false;
          referencedRelation: "dharma_temples";
          referencedColumns: ["id"];
        }];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      create_dharma_temple: { Args: { temple_name: string }; Returns: string };
      manage_dharma_temple: {
        Args: {
          target_temple_id: string;
          operation: "rename";
          new_name: string | null;
          new_caretaker_name: string | null;
        };
        Returns: undefined;
      };
      manage_registry_option: {
        Args: {
          option_id: string;
          operation: string;
          new_value: string | null;
        };
        Returns: undefined;
      };
      log_activity_event: {
        Args: {
          event_action: "login" | "logout";
          event_type: string;
          event_id?: string | null;
          target_temple_id?: string | null;
          event_details?: Record<string, unknown>;
        };
        Returns: undefined;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}
