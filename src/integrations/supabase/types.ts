export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      emergency_codes: {
        Row: {
          active: boolean
          code: string
          created_at: string
          owner_id: string
          show_address: boolean
          show_insurance: boolean
          subject_id: string
          subject_type: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          owner_id: string
          show_address?: boolean
          show_insurance?: boolean
          subject_id: string
          subject_type: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          owner_id?: string
          show_address?: boolean
          show_insurance?: boolean
          subject_id?: string
          subject_type?: string
        }
        Relationships: []
      }
      emergency_contacts: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          name: string
          owner_id: string
          phone: string
          relation: string | null
          subject_id: string
          subject_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          name: string
          owner_id: string
          phone: string
          relation?: string | null
          subject_id: string
          subject_type: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          name?: string
          owner_id?: string
          phone?: string
          relation?: string | null
          subject_id?: string
          subject_type?: string
        }
        Relationships: []
      }
      family_members: {
        Row: {
          created_at: string
          date_of_birth: string | null
          full_name: string
          gender: string | null
          height_cm: number | null
          id: string
          owner_id: string
          phone: string | null
          photo_url: string | null
          relation: string
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          created_at?: string
          date_of_birth?: string | null
          full_name: string
          gender?: string | null
          height_cm?: number | null
          id?: string
          owner_id: string
          phone?: string | null
          photo_url?: string | null
          relation: string
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          created_at?: string
          date_of_birth?: string | null
          full_name?: string
          gender?: string | null
          height_cm?: number | null
          id?: string
          owner_id?: string
          phone?: string | null
          photo_url?: string | null
          relation?: string
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      medical_documents: {
        Row: {
          category: string | null
          created_at: string
          id: string
          mime_type: string | null
          owner_id: string
          size_bytes: number | null
          storage_path: string
          subject_id: string
          subject_type: string
          title: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          mime_type?: string | null
          owner_id: string
          size_bytes?: number | null
          storage_path: string
          subject_id: string
          subject_type: string
          title: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          mime_type?: string | null
          owner_id?: string
          size_bytes?: number | null
          storage_path?: string
          subject_id?: string
          subject_type?: string
          title?: string
        }
        Relationships: []
      }
      medical_info: {
        Row: {
          alcohol: boolean
          allergies: string | null
          blood_group: string | null
          conditions: string | null
          created_at: string
          current_medications: string | null
          disabilities: string | null
          id: string
          insurance_expiry: string | null
          insurance_policy: string | null
          insurance_provider: string | null
          notes: string | null
          organ_donor: boolean
          owner_id: string
          past_surgeries: string | null
          pregnancy: boolean
          smoking: boolean
          subject_id: string
          subject_type: string
          updated_at: string
          vaccinations: string | null
        }
        Insert: {
          alcohol?: boolean
          allergies?: string | null
          blood_group?: string | null
          conditions?: string | null
          created_at?: string
          current_medications?: string | null
          disabilities?: string | null
          id?: string
          insurance_expiry?: string | null
          insurance_policy?: string | null
          insurance_provider?: string | null
          notes?: string | null
          organ_donor?: boolean
          owner_id: string
          past_surgeries?: string | null
          pregnancy?: boolean
          smoking?: boolean
          subject_id: string
          subject_type: string
          updated_at?: string
          vaccinations?: string | null
        }
        Update: {
          alcohol?: boolean
          allergies?: string | null
          blood_group?: string | null
          conditions?: string | null
          created_at?: string
          current_medications?: string | null
          disabilities?: string | null
          id?: string
          insurance_expiry?: string | null
          insurance_policy?: string | null
          insurance_provider?: string | null
          notes?: string | null
          organ_donor?: boolean
          owner_id?: string
          past_surgeries?: string | null
          pregnancy?: boolean
          smoking?: boolean
          subject_id?: string
          subject_type?: string
          updated_at?: string
          vaccinations?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          created_at: string
          date_of_birth: string | null
          full_name: string | null
          gender: string | null
          height_cm: number | null
          id: string
          phone: string | null
          photo_url: string | null
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          full_name?: string | null
          gender?: string | null
          height_cm?: number | null
          id: string
          phone?: string | null
          photo_url?: string | null
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          full_name?: string | null
          gender?: string | null
          height_cm?: number | null
          id?: string
          phone?: string | null
          photo_url?: string | null
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      reminders: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          kind: string
          notes: string | null
          owner_id: string
          recurrence: string | null
          remind_at: string
          subject_id: string
          subject_type: string
          title: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          kind: string
          notes?: string | null
          owner_id: string
          recurrence?: string | null
          remind_at: string
          subject_id: string
          subject_type: string
          title: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          kind?: string
          notes?: string | null
          owner_id?: string
          recurrence?: string | null
          remind_at?: string
          subject_id?: string
          subject_type?: string
          title?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_emergency_profile: { Args: { _code: string }; Returns: Json }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
