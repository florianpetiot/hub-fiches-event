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
    PostgrestVersion: "14.1"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      event_documents: {
        Row: {
          file_path: string
          form_id: string
          id: string
          type: Database["public"]["Enums"]["document_type"]
          uploaded_at: string | null
        }
        Insert: {
          file_path: string
          form_id: string
          id?: string
          type: Database["public"]["Enums"]["document_type"]
          uploaded_at?: string | null
        }
        Update: {
          file_path?: string
          form_id?: string
          id?: string
          type?: Database["public"]["Enums"]["document_type"]
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_documents_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "event_forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_documents_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "event_forms_public"
            referencedColumns: ["id"]
          },
        ]
      }
      event_forms: {
        Row: {
          agent_secu: Json | null
          alcohol: Json | null
          budget: number | null
          category: string
          communication: Json | null
          created_at: string | null
          deadline: string | null
          description: string | null
          equipment: Json | null
          estimated_attendees: number | null
          event_date: string
          event_end_date: string | null
          event_end_time: string
          event_start_time: string
          food: Json | null
          has_external_people: boolean | null
          has_food: boolean | null
          id: string
          location: string
          needs_agent_secu: boolean | null
          needs_bulle_ssi: boolean | null
          needs_communication: boolean | null
          needs_equipment: boolean | null
          profile_id: string
          responsible_organisation: Json | null
          responsible_prevention: Json | null
          responsible_security: Json | null
          security: Json | null
          signed_at: string | null
          signed_by: string | null
          site_plan_path: string | null
          status: Database["public"]["Enums"]["event_status"]
          submitted_at: string | null
          title: string
          updated_at: string | null
          version: number
        }
        Insert: {
          agent_secu?: Json | null
          alcohol?: Json | null
          budget?: number | null
          category: string
          communication?: Json | null
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          equipment?: Json | null
          estimated_attendees?: number | null
          event_date: string
          event_end_date?: string | null
          event_end_time: string
          event_start_time: string
          food?: Json | null
          has_external_people?: boolean | null
          has_food?: boolean | null
          id?: string
          location: string
          needs_agent_secu?: boolean | null
          needs_bulle_ssi?: boolean | null
          needs_communication?: boolean | null
          needs_equipment?: boolean | null
          profile_id: string
          responsible_organisation?: Json | null
          responsible_prevention?: Json | null
          responsible_security?: Json | null
          security?: Json | null
          signed_at?: string | null
          signed_by?: string | null
          site_plan_path?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          submitted_at?: string | null
          title: string
          updated_at?: string | null
          version?: number
        }
        Update: {
          agent_secu?: Json | null
          alcohol?: Json | null
          budget?: number | null
          category?: string
          communication?: Json | null
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          equipment?: Json | null
          estimated_attendees?: number | null
          event_date?: string
          event_end_date?: string | null
          event_end_time?: string
          event_start_time?: string
          food?: Json | null
          has_external_people?: boolean | null
          has_food?: boolean | null
          id?: string
          location?: string
          needs_agent_secu?: boolean | null
          needs_bulle_ssi?: boolean | null
          needs_communication?: boolean | null
          needs_equipment?: boolean | null
          profile_id?: string
          responsible_organisation?: Json | null
          responsible_prevention?: Json | null
          responsible_security?: Json | null
          security?: Json | null
          signed_at?: string | null
          signed_by?: string | null
          site_plan_path?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          submitted_at?: string | null
          title?: string
          updated_at?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_forms_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_forms_signed_by_fkey"
            columns: ["signed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reads: {
        Row: {
          message_id: string
          profile_id: string
          read_at: string | null
        }
        Insert: {
          message_id: string
          profile_id: string
          read_at?: string | null
        }
        Update: {
          message_id?: string
          profile_id?: string
          read_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_reads_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reads_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          form_id: string
          form_version: number
          id: string
          is_system: boolean | null
          sender_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          form_id: string
          form_version?: number
          id?: string
          is_system?: boolean | null
          sender_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          form_id?: string
          form_version?: number
          id?: string
          is_system?: boolean | null
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "event_forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "event_forms_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          form_id: string | null
          id: string
          is_sent: boolean | null
          profile_id: string
          send_after: string | null
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          created_at?: string | null
          form_id?: string | null
          id?: string
          is_sent?: boolean | null
          profile_id: string
          send_after?: string | null
          type: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          created_at?: string | null
          form_id?: string | null
          id?: string
          is_sent?: boolean | null
          profile_id?: string
          send_after?: string | null
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "notifications_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "event_forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "event_forms_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string
          role_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          name: string
          role_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string | null
          id: string
          is_system: boolean | null
          label: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_system?: boolean | null
          label: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_system?: boolean | null
          label?: string
          name?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      signatures: {
        Row: {
          created_at: string | null
          form_id: string
          id: string
          role_label: string | null
          signed_at: string | null
          signed_by: string | null
          status: string
          workflow_etape_id: string | null
        }
        Insert: {
          created_at?: string | null
          form_id: string
          id?: string
          role_label?: string | null
          signed_at?: string | null
          signed_by?: string | null
          status?: string
          workflow_etape_id?: string | null
        }
        Update: {
          created_at?: string | null
          form_id?: string
          id?: string
          role_label?: string | null
          signed_at?: string | null
          signed_by?: string | null
          status?: string
          workflow_etape_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signatures_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "event_forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signatures_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "event_forms_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signatures_signed_by_fkey"
            columns: ["signed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signatures_workflow_etape_id_fkey"
            columns: ["workflow_etape_id"]
            isOneToOne: false
            referencedRelation: "workflow_etapes"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_etapes: {
        Row: {
          created_at: string | null
          id: string
          ordre: number
          role_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          ordre: number
          role_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          ordre?: number
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_etapes_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      event_forms_public: {
        Row: {
          event_date: string | null
          event_end_date: string | null
          id: string | null
          profile_id: string | null
          status: Database["public"]["Enums"]["event_status"] | null
          title: string | null
        }
        Insert: {
          event_date?: string | null
          event_end_date?: string | null
          id?: string | null
          profile_id?: string | null
          status?: Database["public"]["Enums"]["event_status"] | null
          title?: string | null
        }
        Update: {
          event_date?: string | null
          event_end_date?: string | null
          id?: string | null
          profile_id?: string | null
          status?: Database["public"]["Enums"]["event_status"] | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_forms_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_my_role: { Args: never; Returns: string }
    }
    Enums: {
      document_type:
        | "plan_materiel"
        | "bulle_ssi"
        | "ddb_mairie"
        | "ddb_prev"
        | "autre"
      event_status:
        | "brouillon"
        | "soumise"
        | "en_revision"
        | "validee"
        | "refusee"
      notification_type: "nouveau_message" | "statut_change" | "deadline_proche"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      document_type: [
        "plan_materiel",
        "bulle_ssi",
        "ddb_mairie",
        "ddb_prev",
        "autre",
      ],
      event_status: [
        "brouillon",
        "soumise",
        "en_revision",
        "validee",
        "refusee",
      ],
      notification_type: [
        "nouveau_message",
        "statut_change",
        "deadline_proche",
      ],
    },
  },
} as const
