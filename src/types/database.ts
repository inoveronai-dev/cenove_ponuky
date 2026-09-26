export type QuoteLineItem = {
  id: string;
  category: string;
  widthMm: number;
  heightMm: number;
  count: number;
  color?: string | null;
  glazing?: string | null;
  notes?: string | null;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          id: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };
      companies: {
        Row: {
          id: string;
          name: string;
          subtitle: string | null;
          address: string | null;
          ico: string | null;
          dic: string | null;
          ic_dph: string | null;
          email: string | null;
          phone: string | null;
          website: string | null;
          logo_url: string | null;
          primary_color: string;
          quote_validity_days: number;
          notify_on_first_open: boolean;
          notify_on_later_open: boolean;
          notification_cooldown_hours: number;
          notification_email: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["companies"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["companies"]["Row"]>;
      };
      company_members: {
        Row: {
          id: string;
          company_id: string;
          user_id: string;
          role: string;
          created_at: string;
        };
        Insert: {
          company_id: string;
          user_id: string;
          role?: string;
        };
        Update: Partial<Database["public"]["Tables"]["company_members"]["Row"]>;
      };
      pricing_settings: {
        Row: {
          id: string;
          company_id: string;
          price_per_m2_plastove_okna: number;
          price_per_m2_plastove_dvere: number;
          price_per_m2_hlinik: number;
          price_per_m2_interierove_dvere: number;
          price_per_m2_tieniaca: number;
          price_per_m2_garazove_brany: number;
          fixed_fee: number;
          montaz_per_m2: number;
          demontaz_per_unit: number;
          likvidacia_fee: number;
          parapet_vnutorny_fee: number;
          parapet_vonkajsi_fee: number;
          siete_fee: number;
          other_surcharge: number;
          minimum_job_price: number;
          buffer_min_multiplier: number;
          buffer_max_multiplier: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["pricing_settings"]["Row"]> & {
          company_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["pricing_settings"]["Row"]>;
      };
      quotes: {
        Row: QuoteRow;
        Insert: Partial<QuoteRow> & {
          public_id: string;
          company_id: string;
          customer_name: string;
        };
        Update: Partial<QuoteRow>;
      };
      quote_versions: {
        Row: {
          id: string;
          quote_id: string;
          version_number: number;
          snapshot: Record<string, unknown>;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          quote_id: string;
          version_number: number;
          snapshot: Record<string, unknown>;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["quote_versions"]["Row"]>;
      };
      quote_views: {
        Row: {
          id: string;
          quote_id: string;
          viewed_at: string;
          session_id: string | null;
          user_agent: string | null;
          referrer: string | null;
          ip_hash: string | null;
        };
        Insert: {
          quote_id: string;
          session_id?: string | null;
          user_agent?: string | null;
          referrer?: string | null;
          ip_hash?: string | null;
          viewed_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["quote_views"]["Row"]>;
      };
      notifications: {
        Row: {
          id: string;
          company_id: string;
          user_id: string | null;
          quote_id: string | null;
          type: string;
          title: string;
          body: string | null;
          email_status: string;
          email_error: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          company_id: string;
          user_id?: string | null;
          quote_id?: string | null;
          type: string;
          title: string;
          body?: string | null;
          email_status?: string;
          email_error?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Row"]>;
      };
    };
  };
};

export type QuoteRow = {
  id: string;
  public_id: string;
  company_id: string;
  created_by: string | null;
  status: "draft" | "ready" | "sent" | "opened";
  customer_first_name: string | null;
  customer_last_name: string | null;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  site_address: string | null;
  property_type: string | null;
  floor: number | null;
  line_items: QuoteLineItem[];
  montaz: boolean;
  demontaz_starych: boolean;
  likvidacia: boolean;
  parapet_vnutorny: boolean;
  parapet_vonkajsi: boolean;
  siete_proti_hmyzu: boolean;
  other_service: boolean;
  install_date: string | null;
  internal_notes: string | null;
  customer_notes: string | null;
  ai_intro: string | null;
  ai_summary: string | null;
  ai_scope_note: string | null;
  products_amount: number | null;
  montaz_amount: number | null;
  extras_amount: number | null;
  base_estimate: number | null;
  price_min: number | null;
  price_max: number | null;
  price_is_manual: boolean;
  valid_until: string | null;
  sent_at: string | null;
  first_viewed_at: string | null;
  last_viewed_at: string | null;
  view_count: number;
  unique_session_count: number;
  last_notified_at: string | null;
  version: number;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Company = Database["public"]["Tables"]["companies"]["Row"];
export type PricingSettings = Database["public"]["Tables"]["pricing_settings"]["Row"];
export type Quote = QuoteRow;
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type QuoteView = Database["public"]["Tables"]["quote_views"]["Row"];
