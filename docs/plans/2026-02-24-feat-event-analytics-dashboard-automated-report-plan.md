---
title: Event Analytics Dashboard + Automated Report
type: feat
status: active
date: 2026-02-24
---

# Event Analytics Dashboard + Automated Report

Provide couples with analytics insights during and after the wedding, including real-time engagement metrics and an automated PDF summary report.

## Overview

Build a comprehensive analytics system that gives event hosts visibility into guest engagement, interaction patterns, and post-event insights. Includes a real-time dashboard during the event and an automatically generated PDF report sent within 24 hours after the event ends.

## Problem Statement / Motivation

**Current State:**
- Only basic stats exist: `getFestivalStats()` returns active users and match count
- No host-facing dashboard or analytics UI
- No visibility into engagement patterns or guest activity
- No post-event reporting or data export
- Hosts have no way to measure event success

**Why This Matters:**
- Hosts want to see their event's impact in real-time ("How many guests are using the app?")
- Post-event data validates the investment ("52 matches made, 89% of guests participated")
- Analytics insights help hosts plan future events better
- Automated reports provide shareable proof of value
- Premium feature differentiator (analytics = pro tier)

**Impact:**
- Increases perceived product value (data-driven insights)
- Creates viral marketing moments (hosts share impressive stats on social)
- Enables upsell tier (basic events vs. analytics-enabled events)
- Provides retention hook (hosts come back to review their event)
- Generates testimonial material ("78 guests connected at our wedding!")

## Proposed Solution

Add host-only analytics capabilities:

```
ProfileScreen (Host user only)
  ↓
[View Event Analytics] button
  ↓
HostDashboardScreen (NEW)
  ├─ Real-time metrics (during event)
  │   ├─ Live participant count
  │   ├─ Total scans (QR code scans)
  │   ├─ Flicks sent
  │   ├─ Matches made
  │   ├─ Messages exchanged
  │   └─ Activity timeline (last 24h)
  │
  └─ Post-event insights (after event)
      ├─ Final participation stats
      ├─ Engagement funnel (scans → profiles → flicks → matches)
      ├─ Peak activity time
      ├─ Most popular icebreaker questions
      └─ [Download PDF Report] button
           ↓
PostEventReportPDF (Auto-generated)
  ├─ Cover page (event name, date, venue)
  ├─ Executive summary (key metrics)
  ├─ Engagement breakdown (charts + tables)
  ├─ Timeline analysis (activity by hour)
  ├─ Success stories (match highlights)
  └─ Footer (powered by flick branding)
```

## Technical Approach

### Database Schema Changes

**Add to `festivals` table:**
```sql
-- Host info
ALTER TABLE festivals
ADD COLUMN host_email TEXT,                    -- For sending reports
ADD COLUMN host_name TEXT;                     -- Display name

-- Event lifecycle
ALTER TABLE festivals
ADD COLUMN event_status TEXT DEFAULT 'draft',  -- 'draft', 'live', 'ended'
ADD COLUMN report_generated_at TIMESTAMP,
ADD COLUMN report_url TEXT;                    -- PDF stored in Supabase Storage
```

**Create `analytics_snapshots` table:**
```sql
CREATE TABLE analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  festival_id TEXT REFERENCES festivals(id) ON DELETE CASCADE,
  snapshot_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metrics JSONB NOT NULL,  -- Store aggregated metrics
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX analytics_snapshots_festival_idx ON analytics_snapshots(festival_id);
CREATE INDEX analytics_snapshots_time_idx ON analytics_snapshots(snapshot_time);

-- Example metrics JSON structure:
{
  "active_users": 42,
  "total_scans": 67,
  "total_flicks": 128,
  "mutual_matches": 23,
  "messages_sent": 456,
  "avg_messages_per_match": 19.8,
  "profile_completion_rate": 0.87,
  "male_female_ratio": "45:55"
}
```

**Create `engagement_events` table (granular tracking):**
```sql
CREATE TABLE engagement_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  festival_id TEXT REFERENCES festivals(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,  -- 'scan', 'profile_complete', 'flick_sent', 'match_made', 'message_sent'
  metadata JSONB,             -- Additional context
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX engagement_events_festival_idx ON engagement_events(festival_id);
CREATE INDEX engagement_events_type_idx ON engagement_events(event_type);
CREATE INDEX engagement_events_time_idx ON engagement_events(created_at);
```

### SQL Analytics Functions

#### `get_event_engagement_metrics(festival_id, start_time, end_time)`
```sql
CREATE OR REPLACE FUNCTION get_event_engagement_metrics(
  p_festival_id TEXT,
  p_start_time TIMESTAMP DEFAULT NULL,
  p_end_time TIMESTAMP DEFAULT NOW()
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  -- If no start time provided, use festival start_date
  IF p_start_time IS NULL THEN
    SELECT start_date INTO p_start_time
    FROM festivals
    WHERE id = p_festival_id;
  END IF;

  SELECT jsonb_build_object(
    'total_users', COUNT(DISTINCT u.id),
    'active_users', COUNT(DISTINCT u.id) FILTER (WHERE u.status = true),
    'total_flicks', (SELECT COUNT(*) FROM nudges WHERE from_user_id IN (SELECT id FROM users WHERE festival_id = p_festival_id)),
    'mutual_matches', (SELECT COUNT(*) FROM matches m WHERE m.user1_id IN (SELECT id FROM users WHERE festival_id = p_festival_id)),
    'messages_sent', (SELECT COUNT(*) FROM messages msg WHERE sender_id IN (SELECT id FROM users WHERE festival_id = p_festival_id)),
    'avg_age', AVG(u.age),
    'gender_distribution', jsonb_build_object(
      'male', COUNT(*) FILTER (WHERE u.gender = 'male'),
      'female', COUNT(*) FILTER (WHERE u.gender = 'female'),
      'other', COUNT(*) FILTER (WHERE u.gender NOT IN ('male', 'female'))
    )
  ) INTO result
  FROM users u
  WHERE u.festival_id = p_festival_id
    AND u.created_at BETWEEN p_start_time AND p_end_time;

  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

#### `get_hourly_activity(festival_id, date)`
```sql
CREATE OR REPLACE FUNCTION get_hourly_activity(
  p_festival_id TEXT,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  hour INTEGER,
  user_joins INTEGER,
  flicks_sent INTEGER,
  matches_made INTEGER,
  messages_sent INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH hours AS (
    SELECT generate_series(0, 23) AS hour
  ),
  user_activity AS (
    SELECT
      EXTRACT(HOUR FROM u.created_at) AS hour,
      COUNT(*) AS user_joins
    FROM users u
    WHERE u.festival_id = p_festival_id
      AND DATE(u.created_at) = p_date
    GROUP BY hour
  ),
  flick_activity AS (
    SELECT
      EXTRACT(HOUR FROM n.created_at) AS hour,
      COUNT(*) AS flicks_sent
    FROM nudges n
    JOIN users u ON n.from_user_id = u.id
    WHERE u.festival_id = p_festival_id
      AND DATE(n.created_at) = p_date
    GROUP BY hour
  ),
  match_activity AS (
    SELECT
      EXTRACT(HOUR FROM m.matched_at) AS hour,
      COUNT(*) AS matches_made
    FROM matches m
    JOIN users u ON m.user1_id = u.id
    WHERE u.festival_id = p_festival_id
      AND DATE(m.matched_at) = p_date
    GROUP BY hour
  ),
  message_activity AS (
    SELECT
      EXTRACT(HOUR FROM msg.created_at) AS hour,
      COUNT(*) AS messages_sent
    FROM messages msg
    JOIN users u ON msg.sender_id = u.id
    WHERE u.festival_id = p_festival_id
      AND DATE(msg.created_at) = p_date
    GROUP BY hour
  )
  SELECT
    h.hour::INTEGER,
    COALESCE(ua.user_joins, 0)::INTEGER,
    COALESCE(fa.flicks_sent, 0)::INTEGER,
    COALESCE(ma.matches_made, 0)::INTEGER,
    COALESCE(msg.messages_sent, 0)::INTEGER
  FROM hours h
  LEFT JOIN user_activity ua ON h.hour = ua.hour
  LEFT JOIN flick_activity fa ON h.hour = fa.hour
  LEFT JOIN match_activity ma ON h.hour = ma.hour
  LEFT JOIN message_activity msg ON h.hour = msg.hour
  ORDER BY h.hour;
END;
$$ LANGUAGE plpgsql;
```

#### `get_engagement_funnel(festival_id)`
```sql
CREATE OR REPLACE FUNCTION get_engagement_funnel(p_festival_id TEXT)
RETURNS TABLE (
  stage TEXT,
  count INTEGER,
  conversion_rate DECIMAL
) AS $$
DECLARE
  total_users INTEGER;
BEGIN
  -- Get total users
  SELECT COUNT(*) INTO total_users
  FROM users
  WHERE festival_id = p_festival_id;

  RETURN QUERY
  SELECT
    'Total Scans'::TEXT AS stage,
    total_users AS count,
    100.0::DECIMAL AS conversion_rate
  UNION ALL
  SELECT
    'Profiles Created'::TEXT,
    COUNT(*)::INTEGER,
    (COUNT(*) * 100.0 / NULLIF(total_users, 0))::DECIMAL
  FROM users
  WHERE festival_id = p_festival_id
    AND selfie_url IS NOT NULL
  UNION ALL
  SELECT
    'Flicks Sent'::TEXT,
    COUNT(DISTINCT from_user_id)::INTEGER,
    (COUNT(DISTINCT from_user_id) * 100.0 / NULLIF(total_users, 0))::DECIMAL
  FROM nudges n
  JOIN users u ON n.from_user_id = u.id
  WHERE u.festival_id = p_festival_id
  UNION ALL
  SELECT
    'Matches Made'::TEXT,
    COUNT(DISTINCT user1_id)::INTEGER,
    (COUNT(DISTINCT user1_id) * 100.0 / NULLIF(total_users, 0))::DECIMAL
  FROM matches m
  JOIN users u ON m.user1_id = u.id
  WHERE u.festival_id = p_festival_id
  UNION ALL
  SELECT
    'Messages Sent'::TEXT,
    COUNT(DISTINCT sender_id)::INTEGER,
    (COUNT(DISTINCT sender_id) * 100.0 / NULLIF(total_users, 0))::DECIMAL
  FROM messages msg
  JOIN users u ON msg.sender_id = u.id
  WHERE u.festival_id = p_festival_id;
END;
$$ LANGUAGE plpgsql;
```

### Implementation Architecture

**1. New Screens:**

#### `HostDashboardScreen.js`
Real-time analytics dashboard for event hosts:

**Section 1: Live Metrics (Real-time)**
```javascript
<View style={styles.metricsGrid}>
  <MetricCard
    icon="👥"
    value={activeUsers}
    label="Active Now"
    trend={+5}  // Change from 1h ago
    color="#00FF00"
  />
  <MetricCard
    icon="📱"
    value={totalScans}
    label="QR Scans"
    color="#FF6B9D"
  />
  <MetricCard
    icon="💘"
    value={totalFlicks}
    label="Flicks Sent"
    color="#C44CE0"
  />
  <MetricCard
    icon="✨"
    value={mutualMatches}
    label="Matches"
    color="#7B5EE3"
  />
</View>
```

**Section 2: Activity Timeline (Last 24h)**
```javascript
<LineChart
  data={hourlyActivity}
  width={screenWidth - 32}
  height={220}
  chartConfig={{
    backgroundColor: '#FFFFFF',
    backgroundGradientFrom: '#FF6B9D',
    backgroundGradientTo: '#C44CE0',
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`
  }}
  bezier
/>
```

**Section 3: Engagement Funnel**
```javascript
<FunnelChart
  stages={[
    { label: 'Total Scans', value: 67, conversion: 100 },
    { label: 'Profiles Created', value: 58, conversion: 87 },
    { label: 'Flicks Sent', value: 45, conversion: 67 },
    { label: 'Matches Made', value: 23, conversion: 34 },
    { label: 'Messages Sent', value: 19, conversion: 28 }
  ]}
/>
```

**Section 4: Top Insights**
```javascript
<InsightsList>
  <InsightCard
    icon="⏰"
    title="Peak Activity Time"
    value="8:30 PM"
    description="Most guests were active during cocktail hour"
  />
  <InsightCard
    icon="💬"
    title="Most Popular Question"
    value='"Meet me at the bar"'
    description="32 guests selected this icebreaker"
  />
  <InsightCard
    icon="🔥"
    title="Match Rate"
    value="34%"
    description="Above average for wedding events"
  />
</InsightsList>
```

**Section 5: Post-Event Actions** (Only after event ends)
```javascript
{eventEnded && (
  <View style={styles.postEventActions}>
    <TouchableOpacity
      style={styles.downloadButton}
      onPress={generateAndDownloadReport}
    >
      <Text style={styles.buttonText}>📄 Download PDF Report</Text>
    </TouchableOpacity>

    {reportUrl && (
      <TouchableOpacity
        style={styles.shareButton}
        onPress={() => shareReport(reportUrl)}
      >
        <Text style={styles.buttonText}>📤 Share Report</Text>
      </TouchableOpacity>
    )}
  </View>
)}
```

**2. New Components:**

#### `MetricCard.js`
```javascript
export function MetricCard({ icon, value, label, trend, color }) {
  return (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {trend && (
        <Text style={[styles.trend, trend > 0 ? styles.trendUp : styles.trendDown]}>
          {trend > 0 ? '↗' : '↘'} {Math.abs(trend)}
        </Text>
      )}
    </View>
  );
}
```

#### `ActivityChart.js` (Using `react-native-chart-kit`)
```javascript
import { LineChart } from 'react-native-chart-kit';

export function ActivityChart({ hourlyData }) {
  const data = {
    labels: ['6PM', '7PM', '8PM', '9PM', '10PM', '11PM'],
    datasets: [{
      data: hourlyData.map(h => h.flicks_sent),
      color: (opacity = 1) => `rgba(255, 107, 157, ${opacity})`,
      label: 'Flicks'
    }]
  };

  return (
    <LineChart
      data={data}
      width={screenWidth - 40}
      height={200}
      chartConfig={chartConfig}
      bezier
      style={styles.chart}
    />
  );
}
```

#### `FunnelChart.js`
```javascript
export function FunnelChart({ stages }) {
  return (
    <View style={styles.funnel}>
      {stages.map((stage, index) => (
        <View
          key={index}
          style={[
            styles.funnelStage,
            { width: `${stage.conversion}%` }
          ]}
        >
          <Text style={styles.stageLabel}>{stage.label}</Text>
          <Text style={styles.stageValue}>{stage.value}</Text>
          <Text style={styles.stageConversion}>{stage.conversion}%</Text>
        </View>
      ))}
    </View>
  );
}
```

**3. New Library Files:**

#### `src/lib/analytics.js`
```javascript
import { supabase } from './supabase';

// Get real-time engagement metrics
export async function getEventMetrics(festivalId) {
  const { data, error } = await supabase.rpc('get_event_engagement_metrics', {
    p_festival_id: festivalId
  });

  if (error) throw error;
  return data;
}

// Get hourly activity breakdown
export async function getHourlyActivity(festivalId, date = new Date()) {
  const { data, error } = await supabase.rpc('get_hourly_activity', {
    p_festival_id: festivalId,
    p_date: date.toISOString().split('T')[0]
  });

  if (error) throw error;
  return data;
}

// Get engagement funnel
export async function getEngagementFunnel(festivalId) {
  const { data, error } = await supabase.rpc('get_engagement_funnel', {
    p_festival_id: festivalId
  });

  if (error) throw error;
  return data;
}

// Subscribe to real-time metric updates
export function subscribeToMetrics(festivalId, callback) {
  const channel = supabase
    .channel(`analytics:${festivalId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'users',
        filter: `festival_id=eq.${festivalId}`
      },
      () => {
        // Refetch metrics when users table changes
        getEventMetrics(festivalId).then(callback);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'nudges'
      },
      () => {
        getEventMetrics(festivalId).then(callback);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// Create analytics snapshot (for historical tracking)
export async function createSnapshot(festivalId, metrics) {
  const { error } = await supabase
    .from('analytics_snapshots')
    .insert({
      festival_id: festivalId,
      metrics
    });

  if (error) throw error;
}

// Track engagement event
export async function trackEvent(festivalId, userId, eventType, metadata = {}) {
  const { error } = await supabase
    .from('engagement_events')
    .insert({
      festival_id: festivalId,
      user_id: userId,
      event_type: eventType,
      metadata
    });

  if (error) console.error('Failed to track event:', error);
}
```

#### `src/lib/reportGeneration.js`
```javascript
import { printToFileAsync } from 'expo-print';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { supabase } from './supabase';
import { getEventMetrics, getHourlyActivity, getEngagementFunnel } from './analytics';

// Generate PDF report
export async function generateEventReport(festivalId) {
  // Fetch all analytics data
  const [metrics, hourlyActivity, funnel, festival] = await Promise.all([
    getEventMetrics(festivalId),
    getHourlyActivity(festivalId),
    getEngagementFunnel(festivalId),
    supabase.from('festivals').select('*').eq('id', festivalId).single()
  ]);

  const eventData = festival.data;

  // Generate HTML for PDF
  const html = generateReportHTML(eventData, metrics, hourlyActivity, funnel);

  // Convert to PDF
  const { uri } = await printToFileAsync({ html });

  return uri;
}

// Generate HTML template
function generateReportHTML(event, metrics, hourlyActivity, funnel) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            color: #333;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #C44CE0;
            padding-bottom: 20px;
            margin-bottom: 40px;
          }
          h1 {
            color: #C44CE0;
            margin: 0;
            font-size: 32px;
          }
          .subtitle {
            color: #666;
            margin-top: 10px;
          }
          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin: 40px 0;
          }
          .metric-card {
            text-align: center;
            padding: 20px;
            background: #F5F5F5;
            border-radius: 8px;
          }
          .metric-value {
            font-size: 48px;
            font-weight: bold;
            color: #C44CE0;
          }
          .metric-label {
            color: #666;
            margin-top: 10px;
          }
          .section {
            margin: 40px 0;
          }
          h2 {
            color: #333;
            border-left: 4px solid #C44CE0;
            padding-left: 12px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
          }
          th {
            background: #C44CE0;
            color: white;
          }
          .footer {
            margin-top: 60px;
            text-align: center;
            color: #999;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${event.name}</h1>
          <p class="subtitle">${event.venue} • ${new Date(event.start_date).toLocaleDateString()}</p>
        </div>

        <div class="section">
          <h2>Executive Summary</h2>
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-value">${metrics.total_users}</div>
              <div class="metric-label">Total Participants</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${metrics.mutual_matches}</div>
              <div class="metric-label">Matches Made</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${metrics.messages_sent}</div>
              <div class="metric-label">Messages Exchanged</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>Engagement Funnel</h2>
          <table>
            <thead>
              <tr>
                <th>Stage</th>
                <th>Count</th>
                <th>Conversion Rate</th>
              </tr>
            </thead>
            <tbody>
              ${funnel.map(stage => `
                <tr>
                  <td>${stage.stage}</td>
                  <td>${stage.count}</td>
                  <td>${stage.conversion_rate.toFixed(1)}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>Activity Timeline</h2>
          <table>
            <thead>
              <tr>
                <th>Hour</th>
                <th>Flicks</th>
                <th>Matches</th>
                <th>Messages</th>
              </tr>
            </thead>
            <tbody>
              ${hourlyActivity.map(hour => `
                <tr>
                  <td>${hour.hour}:00</td>
                  <td>${hour.flicks_sent}</td>
                  <td>${hour.matches_made}</td>
                  <td>${hour.messages_sent}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="footer">
          <p>Generated by flick • Powered by Connection</p>
        </div>
      </body>
    </html>
  `;
}

// Upload report to Supabase Storage
export async function uploadReport(festivalId, pdfUri) {
  const filename = `event-report-${festivalId}-${Date.now()}.pdf`;

  const base64 = await FileSystem.readAsStringAsync(pdfUri, {
    encoding: FileSystem.EncodingType.Base64
  });

  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const uploadUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/event-reports/${filename}`;

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/pdf'
    },
    body: atob(base64)
  });

  if (!response.ok) throw new Error('Upload failed');

  const { data } = supabase.storage
    .from('event-reports')
    .getPublicUrl(filename);

  return data.publicUrl;
}

// Share report
export async function shareReport(pdfUri, eventName) {
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(pdfUri, {
      dialogTitle: `Share ${eventName} Analytics Report`,
      mimeType: 'application/pdf'
    });
  }
}
```

**4. Supabase Edge Function:**

#### `supabase/functions/send-event-report/index.ts`
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const { festivalId } = await req.json();

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get event and host details
    const { data: festival, error: festivalError } = await supabase
      .from('festivals')
      .select('*')
      .eq('id', festivalId)
      .single();

    if (festivalError) throw festivalError;

    // Get analytics metrics
    const { data: metrics, error: metricsError } = await supabase
      .rpc('get_event_engagement_metrics', { p_festival_id: festivalId });

    if (metricsError) throw metricsError;

    // Generate PDF report (HTML to PDF conversion)
    const reportHTML = generateReportHTML(festival, metrics);

    // Send email with Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Flick Analytics <analytics@helloflick.com>',
        to: [festival.host_email],
        subject: `${festival.name} - Event Analytics Report`,
        html: reportHTML
      })
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }

    // Update festival record
    await supabase
      .from('festivals')
      .update({ report_generated_at: new Date().toISOString() })
      .eq('id', festivalId);

    return new Response(
      JSON.stringify({ success: true, message: 'Report sent successfully' }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

function generateReportHTML(festival, metrics) {
  // Same HTML template as client-side generation
  return `...`;
}
```

**Deploy Edge Function:**
```bash
supabase functions deploy send-event-report
```

**Schedule via cron (runs 24h after event end):**
```sql
-- Add to Supabase cron jobs
SELECT cron.schedule(
  'send-event-reports',
  '0 12 * * *',  -- Daily at noon
  $$
  SELECT
    net.http_post(
      url:='https://oithyuuztrmohcbfglrh.supabase.co/functions/v1/send-event-report',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer [ANON_KEY]"}'::jsonb,
      body:=json_build_object('festivalId', id)::text
    )
  FROM festivals
  WHERE event_status = 'ended'
    AND report_generated_at IS NULL
    AND end_date < NOW() - INTERVAL '24 hours';
  $$
);
```

**5. Navigation & Access Control:**

**Update `ProfileScreen.js`** (for hosts only):
```javascript
// Check if user is host
const { data: hostedEvents } = await supabase
  .from('festivals')
  .select('id')
  .eq('host_user_id', user.id);

{hostedEvents?.length > 0 && (
  <TouchableOpacity
    style={styles.analyticsButton}
    onPress={() => navigation.navigate('HostDashboard', { festivalId: hostedEvents[0].id })}
  >
    <Text style={styles.analyticsButtonText}>📊 View Event Analytics</Text>
  </TouchableOpacity>
)}
```

**Add to `App.js`:**
```javascript
<Stack.Screen
  name="HostDashboard"
  component={HostDashboardScreen}
  options={{ title: 'Event Analytics', headerShown: true }}
/>
```

## Acceptance Criteria

### Functional Requirements

**Real-Time Analytics (During Event):**
- [ ] Host can view live participant count
- [ ] Dashboard shows total scans, flicks, matches, messages
- [ ] Activity chart updates in real-time (refreshes every 30s)
- [ ] Engagement funnel displays conversion rates
- [ ] Top insights section highlights key patterns

**Post-Event Analytics:**
- [ ] Dashboard switches to "Event Ended" mode 24h after `end_date`
- [ ] Final metrics displayed (no longer updating)
- [ ] "Download PDF Report" button appears
- [ ] PDF report includes cover page, metrics, charts, timeline

**Automated Reporting:**
- [ ] PDF report auto-generated 24h after event ends
- [ ] Report emailed to host (via `host_email`)
- [ ] Report stored in Supabase Storage for later download
- [ ] Report includes event branding (name, date, venue)

**Access Control:**
- [ ] Only host user (`host_user_id`) can access analytics
- [ ] Dashboard restricted to events the user created
- [ ] Non-hosts see no analytics button

### Non-Functional Requirements

- [ ] Real-time updates have <5s latency
- [ ] Dashboard loads in <3s
- [ ] PDF generation completes in <10s
- [ ] Email delivery within 5 minutes of generation
- [ ] Dashboard works on iOS and Android
- [ ] Charts are readable on small screens

### Quality Gates

- [ ] SQL functions tested with sample data
- [ ] Real-time subscriptions don't cause memory leaks
- [ ] PDF report renders correctly in all PDF viewers
- [ ] Email deliverability rate > 95%
- [ ] Charts scale properly across device sizes
- [ ] No sensitive user data exposed in reports (anonymize)

## Implementation Phases

### Phase 1: Database & Analytics Functions (3-4 days)
**Tasks:**
- [ ] Create migration: `add-analytics-schema.sql`
- [ ] Add columns to `festivals` table (host_email, event_status, report_url)
- [ ] Create `analytics_snapshots` table
- [ ] Create `engagement_events` table
- [ ] Write SQL function: `get_event_engagement_metrics()`
- [ ] Write SQL function: `get_hourly_activity()`
- [ ] Write SQL function: `get_engagement_funnel()`
- [ ] Test functions with sample data

**Success Criteria:**
- All SQL functions return correct data
- Functions perform well (< 1s execution time)
- Indexes optimize query performance

### Phase 2: Analytics Library & Real-Time Subscriptions (2-3 days)
**Tasks:**
- [ ] Create `src/lib/analytics.js`
- [ ] Implement `getEventMetrics()`, `getHourlyActivity()`, `getEngagementFunnel()`
- [ ] Implement `subscribeToMetrics()` for real-time updates
- [ ] Implement `trackEvent()` for granular tracking
- [ ] Test real-time subscriptions (insert data, verify updates)

**Success Criteria:**
- Functions fetch data correctly
- Real-time subscriptions trigger on table changes
- No performance degradation with subscriptions active

### Phase 3: Dashboard UI (4-5 days)
**Tasks:**
- [ ] Install charting library: `react-native-chart-kit`
- [ ] Create `HostDashboardScreen.js`
- [ ] Build `MetricCard` component
- [ ] Build `ActivityChart` component (line chart)
- [ ] Build `FunnelChart` component
- [ ] Build `InsightsList` component
- [ ] Add real-time data fetching and subscriptions
- [ ] Add "Download Report" button (placeholder)

**Success Criteria:**
- Dashboard displays all metrics correctly
- Charts render smoothly
- Real-time updates work without lag
- UI scales across device sizes

### Phase 4: PDF Report Generation (3-4 days)
**Tasks:**
- [ ] Install `expo-print`
- [ ] Create `src/lib/reportGeneration.js`
- [ ] Implement `generateEventReport()` (HTML to PDF)
- [ ] Design PDF template (HTML/CSS)
- [ ] Implement `uploadReport()` to Supabase Storage
- [ ] Create Supabase bucket: `event-reports`
- [ ] Implement `shareReport()` functionality
- [ ] Test PDF generation on iOS and Android

**Success Criteria:**
- PDF generates successfully
- Report includes all metrics and charts
- PDF opens in native viewers
- Upload to Supabase succeeds
- Share functionality works

### Phase 5: Automated Email Reporting (2-3 days)
**Tasks:**
- [ ] Set up Resend account
- [ ] Create Edge Function: `send-event-report`
- [ ] Implement email template (HTML)
- [ ] Deploy Edge Function to Supabase
- [ ] Set up cron job (runs 24h after event ends)
- [ ] Test email delivery
- [ ] Handle email failures gracefully

**Success Criteria:**
- Edge Function executes successfully
- Emails deliver reliably
- PDF attached or linked in email
- Cron job runs on schedule
- Failed emails logged for retry

### Phase 6: Integration & Polish (2 days)
**Tasks:**
- [ ] Add "View Analytics" button to `ProfileScreen` (host only)
- [ ] Add navigation to `HostDashboardScreen`
- [ ] Implement access control (host-only)
- [ ] Add loading states (skeleton screens)
- [ ] Add error handling (failed metrics fetch)
- [ ] Add success toasts ("Report generated!", "Email sent!")
- [ ] Test end-to-end flow (event creation → analytics → report)

**Success Criteria:**
- Only hosts can access analytics
- Loading states display while fetching data
- Errors handled gracefully
- End-to-end flow works smoothly

## Success Metrics

**Adoption Metrics:**
- % of hosts who view analytics dashboard
- Average time spent on dashboard
- % of hosts who download PDF report

**Engagement Metrics:**
- Average metrics per event (matches, messages)
- Peak activity time distribution
- Engagement funnel conversion rates

**Quality Metrics:**
- PDF generation success rate
- Email delivery rate
- Dashboard load time (< 3s target)

**Target Goals:**
- 80%+ of hosts view analytics
- 60%+ download PDF report
- Average 23+ matches per event
- >34% conversion rate (scans → matches)

## Dependencies & Risks

**Dependencies:**
- `react-native-chart-kit` for charts
- `expo-print` for PDF generation
- Resend or SendGrid for email delivery
- Supabase Edge Functions enabled
- Supabase cron jobs configured

**Risks:**

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Real-time updates cause performance issues | Medium | High | Throttle updates (30s intervals), optimize subscriptions, use pagination |
| PDF generation fails on some devices | Medium | Medium | Server-side generation fallback, show error message |
| Email deliverability issues | Medium | High | Use reputable service (Resend), implement retry logic, provide download link |
| Analytics queries slow with large datasets | Low | Medium | Add database indexes, cache results, limit date ranges |
| Hosts don't check analytics | High | Low | Send email notification when report ready, add push notification |

## Future Considerations

**Phase 2 Enhancements (Post-MVP):**
- Comparative analytics (this event vs. average)
- Export data as CSV/Excel
- More granular filters (by hour, gender, age group)
- Social share templates (Instagram story with stats)
- White-label reports for event planners
- Real-time dashboard on web (separate host portal)

**Extensibility:**
- API endpoints for third-party integrations
- Zapier/Make.com webhooks
- Custom report templates
- Multi-event comparison dashboard
- Predictive analytics (forecast engagement)

## References & Research

### Internal References

**Existing Analytics:**
- Basic stats: `src/lib/festivals.js:119` (`getFestivalStats()`)
- Real-time patterns: `src/lib/flicks.js:146` (`subscribeToFlicks()`)

**Database:**
- Schema: `supabase-setup.sql:1`
- Edge Function example: `supabase/functions/auto-cleanup/index.ts`

**UI Patterns:**
- Dashboard: `src/screens/DashboardScreen.js:1`
- Metrics display: `src/screens/MatchesScreen.js:1`

### External References

**Libraries:**
- `react-native-chart-kit`: https://github.com/indiespirit/react-native-chart-kit
- `expo-print`: https://docs.expo.dev/versions/latest/sdk/print/
- Resend API: https://resend.com/docs

**Analytics Design:**
- Mixpanel dashboards: https://mixpanel.com/
- Amplitude charts: https://amplitude.com/

### Related Work

- QR code generation: `docs/plans/2026-02-24-feat-dynamic-designed-qr-code-generator-plan.md`
- Event customization: `docs/plans/2026-02-24-feat-customizable-client-onboarding-platform-plan.md`

---

**Estimated Total Effort:** 16-21 days (3-4 weeks)

**Priority:** Medium-High (differentiator, but not blocking launch)

**Blockers:** None (can be built in parallel with Tickets 1 & 2)

**Next Steps:**
1. Set up Resend account for email delivery
2. Create database migration
3. Write and test SQL analytics functions
4. Build dashboard screen with mock data
5. Implement PDF generation
6. Deploy Edge Function and configure cron
