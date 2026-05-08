export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          display_name: string | null
          bio: string | null
          avatar_url: string | null
          cover_photo_url: string | null
          website: string | null
          location: string | null
          created_at: string
        }
        Insert: {
          id: string
          username: string
          display_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          cover_photo_url?: string | null
          website?: string | null
          location?: string | null
          created_at?: string
        }
        Update: {
          username?: string
          display_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          cover_photo_url?: string | null
          website?: string | null
          location?: string | null
        }
        Relationships: []
      }
      posts: {
        Row: {
          id: string
          user_id: string
          content: string
          image_url: string | null
          parent_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content: string
          image_url?: string | null
          parent_id?: string | null
          created_at?: string
        }
        Update: {
          content?: string
          image_url?: string | null
        }
        Relationships: []
      }
      likes: {
        Row: {
          post_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          post_id: string
          user_id: string
          created_at?: string
        }
        Update: Record<string, never>
        Relationships: []
      }
      follows: {
        Row: {
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: Record<string, never>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      get_posts: {
        Args: { p_user_id: string; p_limit?: number; p_offset?: number }
        Returns: {
          id: string
          user_id: string
          content: string
          image_url: string | null
          parent_id: string | null
          created_at: string
          likes_count: number
          comments_count: number
          liked_by_user: boolean
          profile_username: string
          profile_bio: string | null
          profile_avatar_url: string | null
        }[]
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type Post = Database["public"]["Tables"]["posts"]["Row"] & {
  profiles: Profile
  likes_count: number
  comments_count: number
  liked_by_user: boolean
}
export type Like = Database["public"]["Tables"]["likes"]["Row"]
export type Follow = Database["public"]["Tables"]["follows"]["Row"]
