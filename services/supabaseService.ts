
import { supabase, isSupabaseConfigured } from './supabaseClient.ts';
import { PickingOrder, ReceptionOrder, ConditioningOrder, StorageOrder, MasterOrder, ArticleMaster, Operator } from '../types.ts';

// Service result types
export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface BatchResult {
  success: boolean;
  successCount: number;
  failureCount: number;
  errors: string[];
}

// Table mapping for type safety
type TableData = {
  'picking_orders': PickingOrder;
  'reception_orders': ReceptionOrder;
  'conditioning_orders': ConditioningOrder;
  'storage_orders': StorageOrder;
  'master_orders': MasterOrder;
  'article_master': ArticleMaster;
  'operators': Operator;
};

type TableName = keyof TableData;

export const supabaseService = {
  /**
   * Fetch all records from a table with proper error handling
   */
  async fetchTable<T extends TableName>(tableName: T): Promise<ServiceResult<TableData[T][]>> {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase not configured' };
    }
    
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order('createdAt', { ascending: false });
        
      if (error) {
        console.error(`Error fetching ${tableName}:`, error);
        return { success: false, error: `Failed to fetch ${tableName}: ${error.message}` };
      }
      
      return { success: true, data: data as TableData[T][] || [] };
    } catch (error) {
      console.error(`Unexpected error fetching ${tableName}:`, error);
      return { success: false, error: `Unexpected error: ${String(error)}` };
    }
  },

  /**
   * Upsert a single record with validation
   */
  async upsert<T extends TableName>(tableName: T, record: Partial<TableData[T]>): Promise<ServiceResult<TableData[T][]>> {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase not configured' };
    }
    
    if (!record || typeof record !== 'object') {
      return { success: false, error: 'Invalid record data' };
    }

    try {
      // Add timestamps
      const recordWithTimestamp = {
        ...record
        //updatedAt: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from(tableName)
        .upsert(recordWithTimestamp, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        })
        .select();
        
      if (error) {
        console.error(`Error upserting to ${tableName}:`, error);
        return { success: false, error: `Failed to save to ${tableName}: ${error.message}` };
      }
      
      return { success: true, data: data as TableData[T][] };
    } catch (error) {
      console.error(`Unexpected error upserting to ${tableName}:`, error);
      return { success: false, error: `Unexpected error: ${String(error)}` };
    }
  },

  /**
   * Delete a record by ID
   */
  async delete<T extends TableName>(tableName: T, id: string): Promise<ServiceResult<void>> {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase not configured' };
    }
    
    if (!id) {
      return { success: false, error: 'ID is required for deletion' };
    }

    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error(`Error deleting from ${tableName}:`, error);
        return { success: false, error: `Failed to delete from ${tableName}: ${error.message}` };
      }
      
      return { success: true };
    } catch (error) {
      console.error(`Unexpected error deleting from ${tableName}:`, error);
      return { success: false, error: `Unexpected error: ${String(error)}` };
    }
  },

  /**
   * Batch upsert multiple records
   */
  async batchUpsert<T extends TableName>(tableName: T, records: Partial<TableData[T]>[]): Promise<BatchResult> {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, successCount: 0, failureCount: records.length, errors: ['Supabase not configured'] };
    }
    
    if (!Array.isArray(records) || records.length === 0) {
      return { success: false, successCount: 0, failureCount: 0, errors: ['No records provided'] };
    }

    const results = await Promise.allSettled(
      records.map(record => this.upsert(tableName, record))
    );

    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failureCount = records.length - successCount;
    const errors = results
      .filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success))
      .map(r => r.status === 'rejected' ? r.reason : (r.value as ServiceResult<any>).error)
      .filter(Boolean);

    return {
      success: failureCount === 0,
      successCount,
      failureCount,
      errors
    };
  },

  /**
   * Specialized method for master orders with documento conflict resolution
   */
  async upsertMaster(record: Partial<MasterOrder>): Promise<ServiceResult<MasterOrder[]>> {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase not configured' };
    }
    
    if (!record.documento) {
      return { success: false, error: 'Document number is required for master orders' };
    }

    try {
      const { data, error } = await supabase
        .from('master_orders')
        .upsert(record, { onConflict: 'documento' })
        .select();
        
      if (error) {
        console.error('Error upserting master:', error);
        return { success: false, error: `Failed to save master order: ${error.message}` };
      }
      
      return { success: true, data: data as MasterOrder[] };
    } catch (error) {
      console.error('Unexpected error upserting master:', error);
      return { success: false, error: `Unexpected error: ${String(error)}` };
    }
  },

  /**
   * Specialized method for article master with codigo conflict resolution
   */
  async upsertArticleMaster(record: Partial<ArticleMaster>): Promise<ServiceResult<ArticleMaster[]>> {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase not configured' };
    }
    
    if (!record.codigo) {
      return { success: false, error: 'Product code is required for article master' };
    }

    try {
      const { data, error } = await supabase
        .from('article_master')
        .upsert(record, { onConflict: 'codigo' })
        .select();
        
      if (error) {
        console.error('Error upserting article master:', error);
        return { success: false, error: `Failed to save article master: ${error.message}` };
      }
      
      return { success: true, data: data as ArticleMaster[] };
    } catch (error) {
      console.error('Unexpected error upserting article master:', error);
      return { success: false, error: `Unexpected error: ${String(error)}` };
    }
  },

  /**
   * Health check for Supabase connection
   */
  async healthCheck(): Promise<ServiceResult<boolean>> {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { error } = await supabase
        .from('operators')
        .select('count', { count: 'exact', head: true });
        
      if (error) {
        return { success: false, error: `Database connection failed: ${error.message}` };
      }
      
      return { success: true, data: true };
    } catch (error) {
      return { success: false, error: `Connection test failed: ${String(error)}` };
    }
  }
};
