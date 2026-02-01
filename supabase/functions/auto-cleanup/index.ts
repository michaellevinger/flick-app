// Auto-Cleanup Edge Function
// Runs every 5 minutes to delete inactive users (20+ minutes without heartbeat)

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

    // Call the auto_wipe_inactive_users() SQL function
    const { data: deletedUsers, error: usersError } = await supabase.rpc('auto_wipe_inactive_users')

    if (usersError) {
      console.error('Error running auto_wipe_inactive_users:', usersError)
      return new Response(
        JSON.stringify({
          success: false,
          error: usersError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log(`Auto-cleanup completed: ${deletedUsers} inactive users deleted`)

    // Also clean up expired number exchanges
    const { data: deletedExchanges, error: exchangesError } = await supabase.rpc('cleanup_expired_exchanges')

    if (exchangesError) {
      console.error('Error cleaning up expired exchanges:', exchangesError)
      // Don't fail the whole function, just log it
    } else {
      console.log(`Cleaned up ${deletedExchanges} expired number exchanges`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        deleted_users: deletedUsers,
        deleted_exchanges: deletedExchanges || 0,
        timestamp: new Date().toISOString(),
        message: `Deleted ${deletedUsers} inactive user(s) and ${deletedExchanges || 0} expired exchange(s)`,
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
