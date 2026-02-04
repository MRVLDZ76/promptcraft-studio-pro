# Social Media Integration - Creator Profiles

## Overview
Creator profiles in the Analysis Studio are now expandable blocks that dynamically fetch real-time data from YouTube and Instagram APIs.

## Features

### 1. **Expandable Profile Blocks**
- Click the chevron icon (▼/▲) to expand/collapse profile details
- View comprehensive creator statistics when expanded
- Clean, collapsible UI keeps the interface organized

### 2. **YouTube Integration** ✅ Active
Each creator profile can fetch live data from YouTube including:
- **Channel name** and display thumbnail
- **Subscriber count** (automatically formatted: K, M, B)
- **Total videos** published
- **Total view count** across all videos
- **Engagement rate** (calculated as views/subscribers ratio)
- **Channel description** (first 200 characters)
- **Direct link** to the YouTube channel

### 3. **Instagram Integration** ⚠️ Requires OAuth
Instagram API requires OAuth authentication. The structure is ready, but needs:
- Instagram Basic Display API or Instagram Graph API setup
- OAuth flow implementation
- User access token acquisition

Currently displays a placeholder with authentication requirement notice.

## How to Use

### For YouTube Creators

1. **Enter Channel Information**
   - In the "Subject Alpha" or "Subject Beta" profile section
   - Enter any of these formats in the social URL field:
     - `@username` (e.g., `@MrBeast`)
     - `https://youtube.com/@username`
     - `https://youtube.com/channel/CHANNEL_ID`
     - Channel ID directly

2. **Fetch Profile Data**
   - Click the **Refresh icon** (🔄) next to the chevron
   - Wait for the data to load (spinner will appear)
   - Profile fields will auto-populate with live data

3. **Expand Details**
   - Click the **Chevron icon** (▼) to expand
   - View detailed statistics:
     - Total videos published
     - Cumulative view count
     - Engagement percentage
     - Channel description
   - Click the **External link icon** to visit the channel

### For Instagram Creators

Instagram integration requires additional setup due to OAuth requirements. See the "Instagram Setup" section below for implementation details.

## API Requirements

### YouTube Data API v3

**Required:**
- Google API Key (already configured via `GEMINI_API_KEY` in `.env.local`)
- The same API key used for Gemini also works for YouTube Data API

**Endpoints Used:**
- `GET https://www.googleapis.com/youtube/v3/channels`
  - Parameters: `part=snippet,statistics,brandingSettings`
  - Search by: `forHandle` or `id`

**Rate Limits:**
- 10,000 quota units per day (default)
- Each request costs 1-3 units
- Consider caching results to minimize API calls

### Instagram Graph API (Not Yet Active)

**Would Require:**
- Facebook App creation
- Instagram Business Account
- OAuth 2.0 authentication flow
- User access token with `instagram_basic` permissions

## Implementation Details

### Files Created/Modified

1. **`services/socialMediaService.ts`** (New)
   - `fetchYouTubeProfile()` - Fetches YouTube channel data
   - `fetchInstagramProfile()` - Placeholder for Instagram data
   - `detectPlatform()` - Auto-detects platform from URL
   - `extractUsername()` - Extracts username/channel ID from URLs
   - Helper functions for number formatting and engagement calculation

2. **`components/AnalysisStudio.tsx`** (Modified)
   - Added expandable profile UI components
   - Integrated API fetch functionality
   - Added loading states and error handling
   - Display dynamic profile data in expanded sections

### State Management

New state variables added to AnalysisStudio:
```typescript
const [expandedProfileA, setExpandedProfileA] = React.useState(false);
const [expandedProfileB, setExpandedProfileB] = React.useState(false);
const [profileDataA, setProfileDataA] = React.useState<CreatorProfile | null>(null);
const [profileDataB, setProfileDataB] = React.useState<CreatorProfile | null>(null);
const [loadingProfileA, setLoadingProfileA] = React.useState(false);
const [loadingProfileB, setLoadingProfileB] = React.useState(false);
```

## Data Flow

```
User Input (@username) 
    ↓
Extract Username/Channel ID
    ↓
Detect Platform (YouTube/Instagram)
    ↓
Fetch API Data with GEMINI_API_KEY
    ↓
Parse & Format Response
    ↓
Update UI State & Display
```

## Error Handling

The integration includes comprehensive error handling:
- **Missing API Key**: Clear error message directing to `.env.local`
- **Invalid Username**: API returns empty results
- **Network Errors**: Caught and logged to console
- **Rate Limiting**: Respects YouTube API quotas

## Future Enhancements

### Short-term
- [ ] Cache fetched profiles to reduce API calls
- [ ] Add refresh timestamp display
- [ ] Implement retry logic for failed requests
- [ ] Add profile data validation

### Medium-term
- [ ] Complete Instagram OAuth flow
- [ ] Add TikTok creator integration
- [ ] Support Twitter/X creator profiles
- [ ] Add profile comparison analytics

### Long-term
- [ ] Real-time follower tracking
- [ ] Historical growth charts
- [ ] Engagement trend analysis
- [ ] Multi-platform creator aggregation

## Instagram Setup Guide

To enable Instagram integration:

1. **Create Facebook App**
   - Go to https://developers.facebook.com/
   - Create a new app
   - Add "Instagram Basic Display" or "Instagram Graph API"

2. **Configure OAuth**
   - Set redirect URIs
   - Get Client ID and Client Secret
   - Add to `.env.local`:
     ```
     INSTAGRAM_CLIENT_ID=your_client_id
     INSTAGRAM_CLIENT_SECRET=your_secret
     ```

3. **Implement OAuth Flow**
   - Create OAuth button in UI
   - Handle redirect callback
   - Store access token securely
   - Pass token to `fetchInstagramProfile()`

4. **Update Code**
   - Uncomment production implementation in `socialMediaService.ts`
   - Remove mock data fallback
   - Add token refresh logic

## Security Considerations

- ✅ API key stored in `.env.local` (not committed to git)
- ✅ No sensitive data exposed in client-side code
- ⚠️ YouTube API key is exposed to browser (public data only)
- ⚠️ Instagram requires user-specific tokens (higher security needed)

## Testing

### Manual Testing Steps

1. **YouTube Profile Fetch**
   ```
   1. Enter "@MrBeast" in Subject Alpha social URL
   2. Click refresh icon
   3. Verify name updates to "MrBeast"
   4. Verify subscriber count appears (e.g., "200M")
   5. Click chevron to expand
   6. Verify video count, views, and engagement display
   7. Click external link icon - should open YouTube channel
   ```

2. **Error Handling**
   ```
   1. Enter invalid username "@invaliduser12345xyz"
   2. Click refresh
   3. Verify no error crashes the app
   4. Check browser console for error logs
   ```

3. **UI Responsiveness**
   ```
   1. Expand both Subject Alpha and Beta profiles
   2. Verify no layout issues
   3. Test on mobile viewport
   4. Verify smooth expand/collapse animations
   ```

## Support

For issues or questions:
- Check browser console for API error messages
- Verify `GEMINI_API_KEY` is set in `.env.local`
- Confirm YouTube Data API v3 is enabled in Google Cloud Console
- Test with known valid channels like `@YouTube` or `@Google`
