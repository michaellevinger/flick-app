// Push Notification Edge Function
//
// Sends a push notification to a specific user via the Expo Push API.
// The server owns the notification copy (title/body) based on the type —
// the client only sends (toUserId, type, fromName, data?).
//
// Notification preferences are checked before sending — if the user has
// disabled a notification type, the request is silently dropped.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Maps notification type → notification_preferences key
const PREFERENCE_KEY: Record<string, string> = {
  flick: 'flicks',
  match: 'matches',
  message: 'messages',
  exchange_request: 'exchanges',
  exchange_accepted: 'exchanges',
}

// Server-controlled message copy
function formatMessage(type: string, fromName: string, data: Record<string, unknown> = {}) {
  switch (type) {
    case 'flick':
      return {
        title: 'Someone wants to meet you 👀',
        body: 'Check the radar',
      }
    case 'match':
      return {
        title: "It's a match! 🎉",
        body: `${fromName} also flicked you!`,
      }
    case 'message':
      return {
        title: fromName,
        body: (data.content as string) || 'Sent you a message',
      }
    case 'exchange_request':
      return {
        title: 'Number request',
        body: `${fromName} wants to exchange numbers`,
      }
    case 'exchange_accepted':
      return {
        title: 'Request accepted! 📞',
        body: `${fromName} accepted your number request`,
      }
    default:
      return {
        title: 'flick',
        body: `New notification from ${fromName}`,
      }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { toUserId, type, fromName, data = {} } = await req.json()

    if (!toUserId || !type || !fromName) {
      return new Response(
        JSON.stringify({ success: false, reason: 'Missing required fields: toUserId, type, fromName' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch recipient's push token and notification preferences
    const { data: user, error } = await supabase
      .from('users')
      .select('expo_push_token, notification_preferences')
      .eq('id', toUserId)
      .single()

    if (error || !user) {
      return new Response(
        JSON.stringify({ success: false, reason: 'User not found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!user.expo_push_token) {
      return new Response(
        JSON.stringify({ success: false, reason: 'No push token registered' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check notification preferences
    const prefs = user.notification_preferences || {}
    const prefKey = PREFERENCE_KEY[type]
    if (prefKey && prefs[prefKey] === false) {
      return new Response(
        JSON.stringify({ success: false, reason: `Notification type '${type}' disabled by user` }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Format message
    const { title, body } = formatMessage(type, fromName, data)

    // Send via Expo Push API
    const pushResponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: user.expo_push_token,
        title,
        body,
        data: { type, ...data },
        sound: prefs.sound !== false ? 'default' : undefined,
        priority: 'high',
      }),
    })

    const pushResult = await pushResponse.json()
    console.log(`Push sent to ${toUserId} (${type}):`, JSON.stringify(pushResult))

    return new Response(
      JSON.stringify({ success: true, result: pushResult }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Unexpected error in push-notification:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
