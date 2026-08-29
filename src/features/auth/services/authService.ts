import { supabase } from "@/integrations/supabase/client";
import { createClient } from "@supabase/supabase-js";
import { Profile } from "@/shared/types";

const getSecondaryClient = () => {
  const url = import.meta.env.VITE_SUPABASE_URL || "https://myqtvbfibvgxkqwxvuru.supabase.co";
  const key =
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    "sb_publishable_srgqLn2ZvysGKh47yCQ0Kg_IW02yjDf";
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
};

export const authService = {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw error;
    return data as Profile | null;
  },

  async getUsers(): Promise<Profile[]> {
    const { data, error } = await supabase.from("profiles").select("*").order("created_at");
    if (error) throw error;
    return (data ?? []) as Profile[];
  },

  async upsertProfile(profile: Partial<Profile> & { id: string }): Promise<Profile> {
    const { data, error } = await supabase.from("profiles").upsert(profile).select().single();
    if (error) throw error;
    return data as Profile;
  },

  async deleteUser(id: string): Promise<void> {
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (error) throw error;
  },

  async signUpNewUser(email: string, password: string, profileData: any) {
    const secondaryClient = getSecondaryClient();
    const { data, error } = await secondaryClient.auth.signUp({
      email,
      password,
      options: {
        data: profileData,
      },
    });
    if (error) throw error;
    return data;
  },
};
