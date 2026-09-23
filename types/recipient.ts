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
  merit_amount: number | null;
  class_name: string | null;
  level: string | null;
  received_place: string | null;
  created_at: string;
  updated_at: string;
}
export type RecipientInput = Omit<
  DharmaRecipient,
  "id" | "created_at" | "updated_at"
>;
export interface Database {
  public: {
    Tables: {
      registry_options: {
        Row: RegistryOption;
        Insert: Pick<RegistryOption, "category" | "value">;
        Update: Partial<Pick<RegistryOption, "category" | "value">>;
        Relationships: [];
      };
      dharma_recipients: {
        Row: { [K in keyof DharmaRecipient]: DharmaRecipient[K] };
        Insert: RecipientInput & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<RecipientInput>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      manage_registry_option: {
        Args: {
          option_id: string;
          operation: string;
          new_value: string | null;
        };
        Returns: undefined;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}
