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
      bno_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      bno_embeddings: {
        Row: {
          bno_code_id: string
          created_at: string | null
          embedding: string | null
          id: string
          source_type: string
          text_source: string
          updated_at: string | null
        }
        Insert: {
          bno_code_id: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          source_type?: string
          text_source: string
          updated_at?: string | null
        }
        Update: {
          bno_code_id?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          source_type?: string
          text_source?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bno_embeddings_bno_code_id_fkey"
            columns: ["bno_code_id"]
            isOneToOne: false
            referencedRelation: "bno_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          anyja_neve: string | null
          azonosito_okmany_tipusa: string | null
          created_at: string
          id: string
          inaktiv_paciens: boolean | null
          iranyitoszam: string | null
          kapcsolattarto_email: string | null
          kaphat_email_ertesitot: boolean | null
          keresztnev: string
          naptar_megjegyzes: string | null
          nem_ker_levelet: boolean | null
          nem_kivant_paciens: boolean | null
          nem_kivant_paciens_ok: string | null
          neme: string | null
          orszag: string | null
          szuletesi_hely: string | null
          szuletesi_ido: string | null
          szuletesi_keresztnev: string | null
          szuletesi_vezeteknev: string | null
          taj_szam: string | null
          telefon_1_hivoszam: string | null
          telefon_1_korzet: string | null
          telefon_1_leiras: string | null
          telefon_1_orszagkod: string | null
          titulus: string | null
          updated_at: string
          utca_hazszam: string | null
          varos: string | null
          vezeteknev: string
        }
        Insert: {
          anyja_neve?: string | null
          azonosito_okmany_tipusa?: string | null
          created_at?: string
          id?: string
          inaktiv_paciens?: boolean | null
          iranyitoszam?: string | null
          kapcsolattarto_email?: string | null
          kaphat_email_ertesitot?: boolean | null
          keresztnev: string
          naptar_megjegyzes?: string | null
          nem_ker_levelet?: boolean | null
          nem_kivant_paciens?: boolean | null
          nem_kivant_paciens_ok?: string | null
          neme?: string | null
          orszag?: string | null
          szuletesi_hely?: string | null
          szuletesi_ido?: string | null
          szuletesi_keresztnev?: string | null
          szuletesi_vezeteknev?: string | null
          taj_szam?: string | null
          telefon_1_hivoszam?: string | null
          telefon_1_korzet?: string | null
          telefon_1_leiras?: string | null
          telefon_1_orszagkod?: string | null
          titulus?: string | null
          updated_at?: string
          utca_hazszam?: string | null
          varos?: string | null
          vezeteknev: string
        }
        Update: {
          anyja_neve?: string | null
          azonosito_okmany_tipusa?: string | null
          created_at?: string
          id?: string
          inaktiv_paciens?: boolean | null
          iranyitoszam?: string | null
          kapcsolattarto_email?: string | null
          kaphat_email_ertesitot?: boolean | null
          keresztnev?: string
          naptar_megjegyzes?: string | null
          nem_ker_levelet?: boolean | null
          nem_kivant_paciens?: boolean | null
          nem_kivant_paciens_ok?: string | null
          neme?: string | null
          orszag?: string | null
          szuletesi_hely?: string | null
          szuletesi_ido?: string | null
          szuletesi_keresztnev?: string | null
          szuletesi_vezeteknev?: string | null
          taj_szam?: string | null
          telefon_1_hivoszam?: string | null
          telefon_1_korzet?: string | null
          telefon_1_leiras?: string | null
          telefon_1_orszagkod?: string | null
          titulus?: string | null
          updated_at?: string
          utca_hazszam?: string | null
          varos?: string | null
          vezeteknev?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      voice_jobs: {
        Row: {
          audio_path: string | null
          claude_cleaned_text: string | null
          completed_at: string | null
          created_at: string
          error: string | null
          id: string
          mode: string
          patient_id: string | null
          progress_message: string | null
          progress_percent: number | null
          raw_audio_text: string | null
          result: Json | null
          status: string
          updated_at: string
        }
        Insert: {
          audio_path?: string | null
          claude_cleaned_text?: string | null
          completed_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          mode?: string
          patient_id?: string | null
          progress_message?: string | null
          progress_percent?: number | null
          raw_audio_text?: string | null
          result?: Json | null
          status?: string
          updated_at?: string
        }
        Update: {
          audio_path?: string | null
          claude_cleaned_text?: string | null
          completed_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          mode?: string
          patient_id?: string | null
          progress_message?: string | null
          progress_percent?: number | null
          raw_audio_text?: string | null
          result?: Json | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "voice_jobs_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
