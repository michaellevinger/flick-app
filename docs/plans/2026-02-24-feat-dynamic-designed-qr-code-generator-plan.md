---
title: Develop a Dynamic & Designed QR Code Generator
type: feat
status: active
date: 2026-02-24
---

# Develop a Dynamic & Designed QR Code Generator

At the end of onboarding, generate a dynamic QR code that guests scan during the wedding, with multiple design templates and download options.

## Overview

Enhance the existing QR code system to support custom-designed QR codes that match the wedding theme. Couples can choose from design templates, customize colors, add photos, preview the design, and download in multiple formats (PNG, PDF) ready for print.

## Problem Statement / Motivation

**Current State:**
- QR codes are generated via CLI (`generate-qr.js`) and web tool (`generate-qr.html`)
- Only basic black/white design available
- `EventSuccessScreen` shows QR but with non-functional share button
- No design customization or branding options
- No PDF export for print materials
- QR codes work but aren't visually appealing

**Why This Matters:**
- Couples want QR codes that match their wedding aesthetic
- Printed materials (table cards, signage) need high-quality, branded QRs
- Different placement needs different designs (posters vs. wristbands vs. table cards)
- Professional-looking QRs increase perceived app value
- Design flexibility enables creative distribution strategies

**Impact:**
- Elevates perceived product quality ("This isn't just tech, it's designed for MY wedding")
- Enables premium upsell (basic vs. custom QR designs)
- Reduces friction to adoption (easier to print and distribute attractive QRs)
- Creates shareable moments (couples post their custom QR designs on social)

## Proposed Solution

Add a QR design customization screen after event creation:

```
EventSuccessScreen (existing)
  ↓
[Customize QR Design] button
  ↓
QRDesignerScreen (NEW)
  ├─ Template selector (4 design options)
  ├─ Color customization (match event theme)
  ├─ Photo uploader (couple photos for frames)
  ├─ Text editor (event name, date, venue)
  └─ Live preview
       ↓
DownloadOptionsModal (NEW)
  ├─ Download PNG (512px, 1024px, 2048px)
  ├─ Download PDF (print-ready)
  ├─ Save to Photos
  └─ Share via SMS/Email/Social
```

## Technical Approach

### Database Schema Changes

**Add to `festivals` table:**
```sql
-- QR Design Storage
ALTER TABLE festivals
ADD COLUMN qr_design_url TEXT,              -- URL to generated design
ADD COLUMN qr_design_template TEXT,         -- Template name ('clean', 'photo', 'themed', 'minimal')
ADD COLUMN qr_design_colors JSONB,          -- Custom colors used
ADD COLUMN qr_background_image_url TEXT;    -- Optional background image
```

**Create `event-qr-codes` Supabase Storage Bucket:**
- Public bucket for generated QR designs
- Naming pattern: `event-qr-{festivalId}-{template}-{timestamp}.png`

### QR Design Templates

#### Template 1: Clean Classic ✨
**Design:**
- White background
- Black QR code (30% error correction)
- Event name above QR (sans-serif, 24pt)
- Date/venue below QR (16pt, gray)
- Subtle pink border (4px)

**Best for:** Table cards, programs, simple signage

#### Template 2: Photo Frame 🖼️
**Design:**
- QR code centered
- Couple's photos in all 4 corners (circular crops)
- Gradient background (using event colors)
- Event name below QR
- Decorative flourish border

**Best for:** Save-the-dates, posters, large format prints

#### Template 3: Themed Colors 🎨
**Design:**
- Full gradient background (event primary → secondary colors)
- White QR code with high error correction
- Event name in elegant script font (white)
- Date in modern sans-serif (white)
- Subtle pattern overlay (dots or geometric shapes)

**Best for:** Wristbands, branded materials, social media

#### Template 4: Minimal Black & White ⚫⚪
**Design:**
- Pure black QR on pure white background
- No text or embellishments
- Maximum scanability
- Square or circular crop options

**Best for:** Tickets, wristbands, high-contrast needs

### Implementation Architecture

**1. New Screens:**

#### `QRDesignerScreen.js`
Multi-section customization interface:

**Section 1: Template Selection**
```javascript
<TemplateSelector
  templates={['clean', 'photo', 'themed', 'minimal']}
  selectedTemplate={template}
  onSelect={setTemplate}
  previewImages={[cleanPreview, photoPreview, themedPreview, minimalPreview]}
/>
```
- Grid of 4 template cards with thumbnails
- "Try It" button on each
- Selected template highlighted with pink border

**Section 2: Color Customization**
```javascript
<ColorCustomizer
  primaryColor={eventColors.primary}
  secondaryColor={eventColors.secondary}
  onColorsChange={(primary, secondary) => setEventColors({ primary, secondary })}
  presetPalettes={[
    { name: 'Classic Pink', primary: '#FF6B9D', secondary: '#C44CE0' },
    { name: 'Navy Gold', primary: '#1E3A8A', secondary: '#FBBF24' },
    { name: 'Sage Green', primary: '#84A98C', secondary: '#52796F' },
    { name: 'Burgundy', primary: '#800020', secondary: '#DC143C' }
  ]}
/>
```
- Color swatches with preset wedding palettes
- Inherits colors from event customization (Ticket 1)
- Custom hex input for advanced users

**Section 3: Photo Upload** (Template 2 only)
```javascript
<PhotoUploader
  photos={couplePhotos}
  onPhotosChange={setCouplePhotos}
  maxPhotos={4}
  cropShape="circle"
/>
```
- 4 photo slots (one per corner)
- Camera or gallery selection
- Auto-crop to circle
- Replace/remove options

**Section 4: Text Editor**
```javascript
<QRTextEditor
  eventName={eventName}
  date={eventDate}
  venue={venue}
  onTextChange={({ name, date, venue }) => setQRText({ name, date, venue })}
  characterLimits={{ name: 50, venue: 30 }}
/>
```
- Editable text fields
- Character counters
- Font preview

**Section 5: Live Preview**
```javascript
<QRPreview
  template={template}
  colors={eventColors}
  photos={couplePhotos}
  text={qrText}
  qrData={festivalId}
/>
```
- Real-time rendered QR code
- Zoom in/out buttons
- Scan test button (opens camera to verify scanability)

**Section 6: Action Buttons**
- "Save Draft" (stores design config in Supabase)
- "Download Options" (opens modal)

#### `DownloadOptionsModal.js`
Bottom sheet with download choices:

```javascript
<DownloadOptions
  qrDesign={designConfig}
  festivalId={festivalId}
>
  <DownloadButton format="png" size={512} label="PNG - Web (512x512)" />
  <DownloadButton format="png" size={1024} label="PNG - Print (1024x1024)" />
  <DownloadButton format="png" size={2048} label="PNG - Large Format (2048x2048)" />
  <DownloadButton format="pdf" label="PDF - Print Ready (Letter)" />
  <ActionButton icon="save" label="Save to Photos" onPress={saveToGallery} />
  <ActionButton icon="share" label="Share QR Code" onPress={shareQR} />
</DownloadOptions>
```

**2. New Components:**

#### `TemplateSelector.js`
```javascript
export function TemplateSelector({ templates, selectedTemplate, onSelect, previewImages }) {
  return (
    <View style={styles.templateGrid}>
      {templates.map((template, index) => (
        <TouchableOpacity
          key={template}
          style={[
            styles.templateCard,
            selectedTemplate === template && styles.templateCardSelected
          ]}
          onPress={() => onSelect(template)}
        >
          <Image source={previewImages[index]} style={styles.templatePreview} />
          <Text style={styles.templateName}>{template.toUpperCase()}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
```

#### `QRRenderer.js` (Core Design Logic)
```javascript
import QRCode from 'react-native-qrcode-svg';
import { captureRef } from 'react-native-view-shot';

export function QRRenderer({ template, colors, photos, text, qrData, size }) {
  const qrRef = useRef();

  // Render based on template
  const renderTemplate = () => {
    switch (template) {
      case 'clean':
        return <CleanTemplate qrData={qrData} text={text} colors={colors} />;
      case 'photo':
        return <PhotoTemplate qrData={qrData} text={text} photos={photos} colors={colors} />;
      case 'themed':
        return <ThemedTemplate qrData={qrData} text={text} colors={colors} />;
      case 'minimal':
        return <MinimalTemplate qrData={qrData} />;
      default:
        return <CleanTemplate qrData={qrData} text={text} colors={colors} />;
    }
  };

  return (
    <ViewShot ref={qrRef} options={{ format: 'png', quality: 1.0, width: size, height: size }}>
      {renderTemplate()}
    </ViewShot>
  );
}
```

#### Template Components:

**`CleanTemplate.js`:**
```javascript
export function CleanTemplate({ qrData, text, colors }) {
  return (
    <View style={[styles.container, { borderColor: colors.primary }]}>
      <Text style={styles.eventName}>{text.name}</Text>
      <QRCode
        value={qrData}
        size={220}
        color="#000000"
        backgroundColor="#FFFFFF"
        errorCorrectionLevel="M"
      />
      <Text style={styles.eventDetails}>{text.date}</Text>
      <Text style={styles.eventDetails}>{text.venue}</Text>
    </View>
  );
}
```

**`PhotoTemplate.js`:**
```javascript
export function PhotoTemplate({ qrData, text, photos, colors }) {
  return (
    <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.container}>
      {/* Corner Photos */}
      <Image source={{ uri: photos[0] }} style={[styles.cornerPhoto, styles.topLeft]} />
      <Image source={{ uri: photos[1] }} style={[styles.cornerPhoto, styles.topRight]} />
      <Image source={{ uri: photos[2] }} style={[styles.cornerPhoto, styles.bottomLeft]} />
      <Image source={{ uri: photos[3] }} style={[styles.cornerPhoto, styles.bottomRight]} />

      {/* Center QR */}
      <View style={styles.qrContainer}>
        <QRCode
          value={qrData}
          size={200}
          color="#000000"
          backgroundColor="#FFFFFF"
          errorCorrectionLevel="H"
        />
      </View>

      <Text style={styles.eventNameWhite}>{text.name}</Text>
    </LinearGradient>
  );
}
```

**`ThemedTemplate.js`:**
```javascript
export function ThemedTemplate({ qrData, text, colors }) {
  return (
    <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.container}>
      <View style={styles.patternOverlay} /> {/* Subtle dot pattern */}
      <Text style={styles.scriptFont}>{text.name}</Text>
      <View style={styles.qrWrapper}>
        <QRCode
          value={qrData}
          size={220}
          color="#FFFFFF"
          backgroundColor="transparent"
          errorCorrectionLevel="H"
        />
      </View>
      <Text style={styles.dateWhite}>{text.date}</Text>
    </LinearGradient>
  );
}
```

**`MinimalTemplate.js`:**
```javascript
export function MinimalTemplate({ qrData }) {
  return (
    <View style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
      <QRCode
        value={qrData}
        size={280}
        color="#000000"
        backgroundColor="#FFFFFF"
        errorCorrectionLevel="L"
      />
    </View>
  );
}
```

**3. New Library Files:**

#### `src/lib/qrDesign.js`
```javascript
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { captureRef } from 'react-native-view-shot';
import { supabase } from './supabase';

// Save design configuration
export async function saveQRDesign(festivalId, designConfig) {
  const { template, colors, photos, text } = designConfig;

  const { error } = await supabase
    .from('festivals')
    .update({
      qr_design_template: template,
      qr_design_colors: colors,
      qr_background_image_url: photos[0] // Primary photo
    })
    .eq('id', festivalId);

  if (error) throw error;
}

// Capture QR as image
export async function captureQR(qrRef, format = 'png', quality = 1.0) {
  try {
    const uri = await captureRef(qrRef, {
      format,
      quality,
      result: 'tmpfile'
    });
    return uri;
  } catch (error) {
    console.error('Failed to capture QR:', error);
    throw error;
  }
}

// Upload to Supabase Storage
export async function uploadQRDesign(festivalId, imageUri, template) {
  const filename = `event-qr-${festivalId}-${template}-${Date.now()}.png`;

  // Read file as base64
  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64
  });

  // Convert to binary
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Upload via HTTP
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const uploadUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/event-qr-codes/${filename}`;

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'image/png'
    },
    body: bytes
  });

  if (!response.ok) {
    throw new Error('Upload failed');
  }

  // Get public URL
  const { data } = supabase.storage
    .from('event-qr-codes')
    .getPublicUrl(filename);

  return data.publicUrl;
}

// Save to device gallery
export async function saveToGallery(imageUri) {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Gallery permission not granted');
  }

  await MediaLibrary.saveToLibraryAsync(imageUri);
}

// Share QR code
export async function shareQR(imageUri, eventName) {
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(imageUri, {
      dialogTitle: `Share ${eventName} QR Code`,
      mimeType: 'image/png'
    });
  } else {
    throw new Error('Sharing not available on this device');
  }
}

// Download as specific size
export async function downloadQR(qrRef, size, filename) {
  const uri = await captureRef(qrRef, {
    format: 'png',
    quality: 1.0,
    width: size,
    height: size
  });

  // Save to downloads directory
  const downloadPath = `${FileSystem.documentDirectory}${filename}`;
  await FileSystem.copyAsync({ from: uri, to: downloadPath });

  return downloadPath;
}
```

#### `src/lib/qrPDF.js`
```javascript
import { printToFileAsync } from 'expo-print';
import * as FileSystem from 'expo-file-system';

// Generate PDF with QR code
export async function generateQRPDF(qrImageUri, eventName, eventDate, venue) {
  const base64 = await FileSystem.readAsStringAsync(qrImageUri, {
    encoding: FileSystem.EncodingType.Base64
  });

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            text-align: center;
            padding: 40px;
          }
          h1 {
            color: #C44CE0;
            margin-bottom: 10px;
          }
          .qr-container {
            margin: 30px auto;
            max-width: 400px;
          }
          .qr-image {
            width: 100%;
            max-width: 400px;
          }
          .details {
            color: #666;
            margin-top: 20px;
          }
          .footer {
            margin-top: 40px;
            color: #999;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <h1>${eventName}</h1>
        <div class="qr-container">
          <img src="data:image/png;base64,${base64}" class="qr-image" />
        </div>
        <div class="details">
          <p><strong>${eventDate}</strong></p>
          <p>${venue}</p>
        </div>
        <div class="footer">
          <p>Scan this QR code with your phone to join the event on flick</p>
        </div>
      </body>
    </html>
  `;

  const { uri } = await printToFileAsync({ html });
  return uri;
}
```

**4. Update Existing Files:**

**`EventSuccessScreen.js`** - Add "Customize Design" button:
```javascript
// After existing QR display
<TouchableOpacity
  style={styles.customizeButton}
  onPress={() => navigation.navigate('QRDesigner', { festivalId: event.id })}
>
  <Text style={styles.customizeButtonText}>🎨 Customize QR Design</Text>
</TouchableOpacity>

<TouchableOpacity
  style={styles.downloadButton}
  onPress={() => setDownloadModalVisible(true)}
>
  <Text style={styles.downloadButtonText}>⬇️ Download QR Code</Text>
</TouchableOpacity>
```

**5. Navigation Updates:**

Add to `App.js`:
```javascript
<Stack.Screen
  name="QRDesigner"
  component={QRDesignerScreen}
  options={{ title: 'Customize QR Design', headerShown: true }}
/>
```

**6. Dependencies to Install:**

```bash
# View capture for image generation
expo install react-native-view-shot

# PDF generation
expo install expo-print

# Media library access
expo install expo-media-library

# Already installed:
# - expo-sharing (sharing files)
# - expo-file-system (file operations)
# - react-native-qrcode-svg (QR generation)
```

## Acceptance Criteria

### Functional Requirements

- [ ] User can select from 4 design templates (Clean, Photo, Themed, Minimal)
- [ ] User can customize primary and secondary colors
- [ ] User can upload up to 4 photos for Photo Frame template
- [ ] User can edit event name, date, and venue text
- [ ] Live preview updates in real-time as user makes changes
- [ ] User can download QR as PNG in 3 sizes (512px, 1024px, 2048px)
- [ ] User can download QR as PDF (letter size, print-ready)
- [ ] User can save QR to device photo gallery
- [ ] User can share QR via SMS/Email/Social media
- [ ] Generated QR codes are scannable by QRScannerScreen
- [ ] Design configuration is saved to Supabase for later editing

### Non-Functional Requirements

- [ ] QR generation completes in <3 seconds
- [ ] PDF generation completes in <5 seconds
- [ ] Image quality: 1024px+ for print materials
- [ ] QR error correction: Medium (M) or High (H) level
- [ ] Downloaded files are named clearly: `flick-qr-{eventName}-{template}.png`
- [ ] Gallery save requests proper permissions
- [ ] Works on iOS and Android
- [ ] Templates scale properly across device sizes

### Quality Gates

- [ ] All QR codes successfully scan with iPhone/Android native cameras
- [ ] Colors pass WCAG AA contrast for text readability
- [ ] PDF layout is centered on letter-size paper
- [ ] Photo Frame template handles missing/fewer than 4 photos gracefully
- [ ] Download buttons show loading states
- [ ] Error handling for permission denials (gallery, camera)
- [ ] No memory leaks with large image captures

## Implementation Phases

### Phase 1: Core QR Rendering (3-4 days)
**Tasks:**
- [ ] Install dependencies: `react-native-view-shot`, `expo-print`, `expo-media-library`
- [ ] Create `src/lib/qrDesign.js` with capture/upload functions
- [ ] Create `src/lib/qrPDF.js` with PDF generation
- [ ] Build `QRRenderer` component with template switching
- [ ] Build 4 template components (Clean, Photo, Themed, Minimal)
- [ ] Test QR scanability with each template

**Success Criteria:**
- All templates render correctly
- QR codes scan successfully
- Image capture produces high-quality PNG

### Phase 2: Design Customization UI (3-4 days)
**Tasks:**
- [ ] Create `QRDesignerScreen.js` with multi-section layout
- [ ] Build `TemplateSelector` component
- [ ] Build `ColorCustomizer` component (reuse from Ticket 1)
- [ ] Build `PhotoUploader` component
- [ ] Build `QRTextEditor` component
- [ ] Implement live preview with real-time updates
- [ ] Add "Save Draft" functionality

**Success Criteria:**
- User can switch between templates and see preview update
- Color changes reflect immediately in preview
- Photo uploads crop to circles and display in corners
- Text edits update preview without lag

### Phase 3: Download & Export (2-3 days)
**Tasks:**
- [ ] Create `DownloadOptionsModal` component
- [ ] Implement PNG download (3 sizes: 512, 1024, 2048)
- [ ] Implement PDF generation with event details
- [ ] Implement save-to-gallery with permission handling
- [ ] Implement share functionality (SMS/Email/Social)
- [ ] Add loading states and progress indicators
- [ ] Handle errors gracefully (permission denied, storage full)

**Success Criteria:**
- PNG downloads at all 3 sizes work correctly
- PDF opens in iOS/Android PDF viewers
- Save to gallery requests and handles permissions
- Share dialog opens with QR image attached
- Error messages are user-friendly

### Phase 4: Integration & Storage (2 days)
**Tasks:**
- [ ] Create Supabase Storage bucket: `event-qr-codes`
- [ ] Update database schema (add QR design columns to `festivals`)
- [ ] Upload generated QRs to Supabase Storage
- [ ] Save design config to database
- [ ] Update `EventSuccessScreen` with "Customize Design" button
- [ ] Add navigation to `QRDesignerScreen` from success screen
- [ ] Test edit flow (customize → save → re-open → edit)

**Success Criteria:**
- Generated QRs upload successfully to Supabase
- Public URLs are accessible
- Design config persists in database
- Edit flow loads previous design correctly

### Phase 5: Polish & Testing (2 days)
**Tasks:**
- [ ] Add loading spinners for capture/upload/download
- [ ] Add success toasts ("QR Saved!", "PDF Downloaded!")
- [ ] Test all templates on iOS and Android
- [ ] Test QR scanability across different phone cameras
- [ ] Test print quality (1024px and 2048px sizes)
- [ ] Handle edge cases (no photos, long event names, special characters)
- [ ] Accessibility: VoiceOver labels for buttons
- [ ] Add analytics events (template_selected, qr_downloaded, qr_shared)

**Success Criteria:**
- No crashes or unhandled errors
- QRs scan reliably on various devices
- Printed QRs are sharp and readable
- Edge cases handled gracefully
- Analytics tracking works

## Success Metrics

**Usage Metrics:**
- % of events that customize QR design (vs. use default)
- Most popular template (Clean vs. Photo vs. Themed vs. Minimal)
- Average time spent on QR designer
- Download format preference (PNG vs. PDF)

**Quality Metrics:**
- QR scan success rate (target: 99%+)
- User-reported print quality satisfaction
- Downloads per event (how many times couples download)

**Target Goals:**
- 60%+ of events customize QR design
- Photo Frame template usage: 40%+
- Average 2-3 downloads per event (different formats/sizes)
- <1% QR scan failure rate

## Dependencies & Risks

**Dependencies:**
- `react-native-view-shot` for image capture
- `expo-print` for PDF generation
- `expo-media-library` for gallery access
- Supabase Storage bucket creation
- iOS/Android camera permissions

**Risks:**

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| QR codes fail to scan due to low contrast | Medium | High | Enforce minimum contrast ratios, test on multiple devices, add "Test Scan" button |
| Large image captures cause memory issues | Medium | Medium | Optimize image size, use compression, test on older devices |
| PDF generation fails on some devices | Low | Medium | Fallback to PNG if PDF fails, add error messaging |
| Photo uploads slow on poor connections | Medium | Low | Show upload progress, allow offline save with sync later |
| Templates don't print well | High | High | Test physical prints at 300 DPI, provide print guidelines |

## Future Considerations

**Phase 2 Enhancements (Post-MVP):**
- Video QR codes (animated GIFs or MP4s)
- Custom logo in center of QR (30% damage tolerance)
- More templates (vintage, modern, rustic themes)
- QR analytics (scan location, time, device type)
- Bulk QR generation (multiple sizes at once)
- Template marketplace (community-designed templates)

**Extensibility:**
- White-label QR designer for event planners
- API endpoint for programmatic QR generation
- Integration with Canva or design tools
- NFC tag generation (alternative to QR)

## References & Research

### Internal References

**Existing QR System:**
- CLI generator: `/Users/michaellevinger/dev/testing/generate-qr.js`
- Web generator: `/Users/michaellevinger/dev/testing/generate-qr.html`
- Documentation: `/Users/michaellevinger/dev/testing/QR-SYSTEM-GUIDE.md`
- Scanner implementation: `src/screens/QRScannerScreen.js:1`
- Success screen: `src/screens/EventSuccessScreen.js:1`

**Image Handling:**
- Upload utilities: `src/lib/database.js:uploadPhoto()`
- Supabase Storage: `supabase.storage.from('selfies')`

**Database:**
- Festivals schema: `supabase/festivals-schema.sql:1`

### External References

**Libraries:**
- `react-native-qrcode-svg`: https://github.com/awesomejerry/react-native-qrcode-svg
- `react-native-view-shot`: https://github.com/gre/react-native-view-shot
- `expo-print`: https://docs.expo.dev/versions/latest/sdk/print/
- `expo-media-library`: https://docs.expo.dev/versions/latest/sdk/media-library/

**QR Code Specs:**
- Error correction levels: https://www.qrcode.com/en/about/error_correction.html
- Design best practices: https://blog.qr-code-generator.com/qr-code-design-tips/

**Design Inspiration:**
- QR Art Generator: https://www.qrcode-monkey.com/
- Canva QR Templates: https://www.canva.com/qr-code/

### Related Work

- Event customization: `docs/plans/2026-02-24-feat-customizable-client-onboarding-platform-plan.md`
- Build guide: `/Users/michaellevinger/dev/testing/BUILD-AND-SHARE.md`

---

**Estimated Total Effort:** 12-15 days (2-3 weeks)

**Priority:** High (critical for event launch)

**Blockers:** Requires Ticket 1 (color customization) to be complete first

**Next Steps:**
1. Create Supabase Storage bucket: `event-qr-codes`
2. Install new dependencies
3. Build template components first (testable in isolation)
4. Implement QR designer screen
5. Add download/export functionality
