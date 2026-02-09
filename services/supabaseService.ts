
import { supabase, isSupabaseConfigured } from './supabaseClient.ts';

export const supabaseService = {
  async fetchTable(tableName: string) {
    if (!isSupabaseConfigured || !supabase) return [];
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*');
      
    if (error) {
      console.error(`Error fetching ${tableName}:`, error);
      return [];
    }
    return data;
  },

  async upsert(tableName: string, record: any) {
    if (!isSupabaseConfigured || !supabase) return null;
    
    // Use id as the onConflict key for tables that have it
    const { data, error } = await supabase
      .from(tableName)
      .upsert(record, { onConflict: 'id' });
      
    if (error) console.error(`Error upserting to ${tableName}:`, error);
    return data;
  },

  async delete(tableName: string, id: string) {
    if (!isSupabaseConfigured || !supabase) return;
    
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id);
      
    if (error) console.error(`Error deleting from ${tableName}:`, error);
  },

  async upsertMaster(record: any) {
    if (!isSupabaseConfigured || !supabase) return;
    
    const { error } = await supabase
      .from('master_orders')
      .upsert(record, { onConflict: 'documento' });
      
    if (error) console.error('Error upserting master:', error);
  },

  async upsertArticleMaster(record: any) {
    if (!isSupabaseConfigured || !supabase) return;
    
    const { error } = await supabase
      .from('article_master')
      .upsert(record, { onConflict: 'codigo' });
      
    if (error) console.error('Error upserting article master:', error);
  }
};
