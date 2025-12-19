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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      bias_history: {
        Row: {
          bias: string
          created_at: string
          id: string
          outcome_id: string
          room_id: string
          timeframe: string
          user_id: string
          was_correct: boolean
        }
        Insert: {
          bias: string
          created_at?: string
          id?: string
          outcome_id: string
          room_id: string
          timeframe: string
          user_id: string
          was_correct: boolean
        }
        Update: {
          bias?: string
          created_at?: string
          id?: string
          outcome_id?: string
          room_id?: string
          timeframe?: string
          user_id?: string
          was_correct?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "bias_history_outcome_id_fkey"
            columns: ["outcome_id"]
            isOneToOne: false
            referencedRelation: "bias_outcomes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bias_history_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      bias_outcomes: {
        Row: {
          created_at: string
          id: string
          outcome: string
          recorded_at: string
          recorded_by: string
          room_id: string
          timeframe: string
        }
        Insert: {
          created_at?: string
          id?: string
          outcome: string
          recorded_at?: string
          recorded_by: string
          room_id: string
          timeframe: string
        }
        Update: {
          created_at?: string
          id?: string
          outcome?: string
          recorded_at?: string
          recorded_by?: string
          room_id?: string
          timeframe?: string
        }
        Relationships: [
          {
            foreignKeyName: "bias_outcomes_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          is_read: boolean
          message: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          message: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      room_members: {
        Row: {
          bias: string
          id: string
          is_online: boolean
          joined_at: string
          room_id: string
          timeframe_biases: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          bias?: string
          id?: string
          is_online?: boolean
          joined_at?: string
          room_id: string
          timeframe_biases?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          bias?: string
          id?: string
          is_online?: boolean
          joined_at?: string
          room_id?: string
          timeframe_biases?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_tags: {
        Row: {
          created_at: string
          id: string
          room_id: string
          tag: string
        }
        Insert: {
          created_at?: string
          id?: string
          room_id: string
          tag: string
        }
        Update: {
          created_at?: string
          id?: string
          room_id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_tags_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_templates: {
        Row: {
          asset_class: Database["public"]["Enums"]["asset_class"] | null
          created_at: string
          description: string | null
          id: string
          is_system: boolean
          name: string
          timeframes: string[]
          trading_style: Database["public"]["Enums"]["trading_style"] | null
        }
        Insert: {
          asset_class?: Database["public"]["Enums"]["asset_class"] | null
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
          timeframes: string[]
          trading_style?: Database["public"]["Enums"]["trading_style"] | null
        }
        Update: {
          asset_class?: Database["public"]["Enums"]["asset_class"] | null
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
          timeframes?: string[]
          trading_style?: Database["public"]["Enums"]["trading_style"] | null
        }
        Relationships: []
      }
      rooms: {
        Row: {
          asset_class: Database["public"]["Enums"]["asset_class"] | null
          created_at: string
          id: string
          instrument: string
          is_active: boolean
          join_code: string
          name: string
          owner_id: string
          participation_mode: string
          timeframes: string[]
          trading_style: Database["public"]["Enums"]["trading_style"] | null
          updated_at: string
        }
        Insert: {
          asset_class?: Database["public"]["Enums"]["asset_class"] | null
          created_at?: string
          id?: string
          instrument: string
          is_active?: boolean
          join_code?: string
          name: string
          owner_id: string
          participation_mode?: string
          timeframes?: string[]
          trading_style?: Database["public"]["Enums"]["trading_style"] | null
          updated_at?: string
        }
        Update: {
          asset_class?: Database["public"]["Enums"]["asset_class"] | null
          created_at?: string
          id?: string
          instrument?: string
          is_active?: boolean
          join_code?: string
          name?: string
          owner_id?: string
          participation_mode?: string
          timeframes?: string[]
          trading_style?: Database["public"]["Enums"]["trading_style"] | null
          updated_at?: string
        }
        Relationships: []
      }
      user_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      trader_stats: {
        Row: {
          accuracy_percentage: number | null
          correct_predictions: number | null
          rooms_participated: number | null
          total_predictions: number | null
          user_id: string | null
          username: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      reset_room_biases: { Args: { p_room_id: string }; Returns: undefined }
    }
    Enums: {
      asset_class: "forex" | "crypto" | "indices" | "commodities" | "stocks"
      notification_type:
        | "bias_change"
        | "follow"
        | "room_invite"
        | "accuracy_milestone"
      trading_style:
        | "scalping"
        | "day_trading"
        | "swing_trading"
        | "position_trading"
        | "news_trading"
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
    Enums: {
      asset_class: ["forex", "crypto", "indices", "commodities", "stocks"],
      notification_type: [
        "bias_change",
        "follow",
        "room_invite",
        "accuracy_milestone",
      ],
      trading_style: [
        "scalping",
        "day_trading",
        "swing_trading",
        "position_trading",
        "news_trading",
      ],
    },
  },
} as const
