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
  public: {
    Tables: {
      alert_rules: {
        Row: {
          chain: string
          config: Json
          created_at: string
          id: string
          is_enabled: boolean
          name: string
          rule_type: string
          scope: string
          severity: string
          subject: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          chain?: string
          config?: Json
          created_at?: string
          id?: string
          is_enabled?: boolean
          name: string
          rule_type: string
          scope: string
          severity?: string
          subject?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          chain?: string
          config?: Json
          created_at?: string
          id?: string
          is_enabled?: boolean
          name?: string
          rule_type?: string
          scope?: string
          severity?: string
          subject?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      alert_state: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      alerts: {
        Row: {
          chain: string
          created_at: string
          description: string
          evidence: Json
          id: string
          rule_id: string | null
          scope: string
          severity: string
          status: string
          subject: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          chain?: string
          created_at?: string
          description?: string
          evidence?: Json
          id?: string
          rule_id?: string | null
          scope: string
          severity?: string
          status?: string
          subject?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          chain?: string
          created_at?: string
          description?: string
          evidence?: Json
          id?: string
          rule_id?: string | null
          scope?: string
          severity?: string
          status?: string
          subject?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alerts_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "alert_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      case_items: {
        Row: {
          case_id: string
          chain: string
          created_at: string
          data: Json
          id: string
          item_type: string
          ref: string
          title: string | null
        }
        Insert: {
          case_id: string
          chain?: string
          created_at?: string
          data?: Json
          id?: string
          item_type: string
          ref: string
          title?: string | null
        }
        Update: {
          case_id?: string
          chain?: string
          created_at?: string
          data?: Json
          id?: string
          item_type?: string
          ref?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_items_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_notes: {
        Row: {
          body: string
          case_id: string
          created_at: string
          id: string
        }
        Insert: {
          body: string
          case_id: string
          created_at?: string
          id?: string
        }
        Update: {
          body?: string
          case_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_notes_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_share_links: {
        Row: {
          case_id: string
          created_at: string
          id: string
          is_enabled: boolean
          public_token: string
        }
        Insert: {
          case_id: string
          created_at?: string
          id?: string
          is_enabled?: boolean
          public_token?: string
        }
        Update: {
          case_id?: string
          created_at?: string
          id?: string
          is_enabled?: boolean
          public_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_share_links_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          chain: string
          created_at: string
          description: string
          id: string
          priority: string
          status: string
          tags: string[]
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          chain?: string
          created_at?: string
          description?: string
          id?: string
          priority?: string
          status?: string
          tags?: string[]
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          chain?: string
          created_at?: string
          description?: string
          id?: string
          priority?: string
          status?: string
          tags?: string[]
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      cluster_edges: {
        Row: {
          cluster_id: string
          created_at: string
          id: string
          net_flow: number
          source_address: string
          target_address: string
          time_window: string
          tx_count: number
          weight: number
        }
        Insert: {
          cluster_id: string
          created_at?: string
          id?: string
          net_flow?: number
          source_address: string
          target_address: string
          time_window?: string
          tx_count?: number
          weight?: number
        }
        Update: {
          cluster_id?: string
          created_at?: string
          id?: string
          net_flow?: number
          source_address?: string
          target_address?: string
          time_window?: string
          tx_count?: number
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "cluster_edges_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "clusters"
            referencedColumns: ["id"]
          },
        ]
      }
      cluster_members: {
        Row: {
          address: string
          cluster_id: string
          confidence: number
          created_at: string
          id: string
          reasons: Json
          role: string
        }
        Insert: {
          address: string
          cluster_id: string
          confidence?: number
          created_at?: string
          id?: string
          reasons?: Json
          role?: string
        }
        Update: {
          address?: string
          cluster_id?: string
          confidence?: number
          created_at?: string
          id?: string
          reasons?: Json
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "cluster_members_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "clusters"
            referencedColumns: ["id"]
          },
        ]
      }
      clusters: {
        Row: {
          chain: string
          confidence: number
          created_at: string
          id: string
          label: string | null
          member_count: number
          seed_address: string
          seed_type: string
          top_signals: Json
          updated_at: string
        }
        Insert: {
          chain?: string
          confidence?: number
          created_at?: string
          id?: string
          label?: string | null
          member_count?: number
          seed_address: string
          seed_type?: string
          top_signals?: Json
          updated_at?: string
        }
        Update: {
          chain?: string
          confidence?: number
          created_at?: string
          id?: string
          label?: string | null
          member_count?: number
          seed_address?: string
          seed_type?: string
          top_signals?: Json
          updated_at?: string
        }
        Relationships: []
      }
      invitation_codes: {
        Row: {
          code: string
          created_at: string
          device_id: string | null
          id: string
          is_used: boolean
          used_at: string | null
        }
        Insert: {
          code: string
          created_at?: string
          device_id?: string | null
          id?: string
          is_used?: boolean
          used_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          device_id?: string | null
          id?: string
          is_used?: boolean
          used_at?: string | null
        }
        Relationships: []
      }
      report_jobs: {
        Row: {
          case_id: string
          created_at: string
          error_message: string | null
          id: string
          output_json_url: string | null
          output_url: string | null
          status: string
          updated_at: string
        }
        Insert: {
          case_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          output_json_url?: string | null
          output_url?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          case_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          output_json_url?: string | null
          output_url?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_jobs_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_counterparties: {
        Row: {
          address: string
          bidirectional: boolean
          created_at: string
          first_seen: string | null
          id: string
          is_contract: boolean
          label: string | null
          last_seen: string | null
          link_score: number
          link_strength: string
          scan_id: string
          token_diversity: number
          tx_count: number
          volume_in: number
          volume_out: number
        }
        Insert: {
          address: string
          bidirectional?: boolean
          created_at?: string
          first_seen?: string | null
          id?: string
          is_contract?: boolean
          label?: string | null
          last_seen?: string | null
          link_score?: number
          link_strength?: string
          scan_id: string
          token_diversity?: number
          tx_count?: number
          volume_in?: number
          volume_out?: number
        }
        Update: {
          address?: string
          bidirectional?: boolean
          created_at?: string
          first_seen?: string | null
          id?: string
          is_contract?: boolean
          label?: string | null
          last_seen?: string | null
          link_score?: number
          link_strength?: string
          scan_id?: string
          token_diversity?: number
          tx_count?: number
          volume_in?: number
          volume_out?: number
        }
        Relationships: [
          {
            foreignKeyName: "wallet_counterparties_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "wallet_scans"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_scans: {
        Row: {
          address: string
          chain: string
          contracts_count: number
          counterparties_count: number
          created_at: string
          depth: number
          error_message: string | null
          first_seen: string | null
          id: string
          include_routers: boolean
          last_seen: string | null
          result: Json
          status: string
          total_tx_count: number
          total_volume_in: number
          total_volume_out: number
          updated_at: string
        }
        Insert: {
          address: string
          chain?: string
          contracts_count?: number
          counterparties_count?: number
          created_at?: string
          depth?: number
          error_message?: string | null
          first_seen?: string | null
          id?: string
          include_routers?: boolean
          last_seen?: string | null
          result?: Json
          status?: string
          total_tx_count?: number
          total_volume_in?: number
          total_volume_out?: number
          updated_at?: string
        }
        Update: {
          address?: string
          chain?: string
          contracts_count?: number
          counterparties_count?: number
          created_at?: string
          depth?: number
          error_message?: string | null
          first_seen?: string | null
          id?: string
          include_routers?: boolean
          last_seen?: string | null
          result?: Json
          status?: string
          total_tx_count?: number
          total_volume_in?: number
          total_volume_out?: number
          updated_at?: string
        }
        Relationships: []
      }
      wallet_tx_cache: {
        Row: {
          block_number: string | null
          block_timestamp: string
          created_at: string
          direction: string
          from_address: string
          id: string
          scan_id: string
          to_address: string
          token_address: string | null
          token_symbol: string | null
          token_value: number | null
          tx_hash: string
          value_native: number
        }
        Insert: {
          block_number?: string | null
          block_timestamp: string
          created_at?: string
          direction?: string
          from_address: string
          id?: string
          scan_id: string
          to_address: string
          token_address?: string | null
          token_symbol?: string | null
          token_value?: number | null
          tx_hash: string
          value_native?: number
        }
        Update: {
          block_number?: string | null
          block_timestamp?: string
          created_at?: string
          direction?: string
          from_address?: string
          id?: string
          scan_id?: string
          to_address?: string
          token_address?: string | null
          token_symbol?: string | null
          token_value?: number | null
          tx_hash?: string
          value_native?: number
        }
        Relationships: [
          {
            foreignKeyName: "wallet_tx_cache_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "wallet_scans"
            referencedColumns: ["id"]
          },
        ]
      }
      watchlists: {
        Row: {
          chain: string
          created_at: string
          id: string
          is_enabled: boolean
          label: string
          subject: string
          type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          chain?: string
          created_at?: string
          id?: string
          is_enabled?: boolean
          label?: string
          subject: string
          type: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          chain?: string
          created_at?: string
          id?: string
          is_enabled?: boolean
          label?: string
          subject?: string
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
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
