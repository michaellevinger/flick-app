// Exchange Cleanup Edge Function
// Cleans up expired number exchanges (15-min TTL only)
//
// Note: No user or message auto-deletion
// - Accounts persist indefinitely
// - Users control their own data deletion via logout
// - Status ON/OFF doesn't affect account persistence

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key (has admin privileges)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Running auto-cleanup function...')

    // Note: User auto-wipe removed - accounts persist until manual logout
    // Users can be OFF indefinitely without losing data

    // Clean up expired number exchanges (15-min TTL)
    const { data: deletedExchanges, error: exchangesError } = await supabase.rpc('cleanup_expired_exchanges')

    if (exchangesError) {
      console.error('Error cleaning up expired exchanges:', exchangesError)
      // Don't fail the whole function, just log it
    } else {
      console.log(`Cleaned up ${deletedExchanges} expired number exchanges`)
    }

    // Note: Messages and users are NOT auto-deleted
    // Data persists until manual logout by user

    return new Response(
      JSON.stringify({
        success: true,
        deleted_exchanges: deletedExchanges || 0,
        timestamp: new Date().toISOString(),
        message: `Deleted ${deletedExchanges || 0} expired exchange(s)`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Unexpected error in auto-cleanup:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
