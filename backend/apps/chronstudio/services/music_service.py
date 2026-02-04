"""
Music Service - Fetch music data and generate video scenes
Supports: Spotify API, Genius API (lyrics)
"""
import requests
from typing import List, Dict, Optional
from django.conf import settings
import logging
import base64

logger = logging.getLogger(__name__)


class MusicService:
    """Service for fetching music data and generating video scenes"""
    
    def __init__(self):
        self.spotify_client_id = getattr(settings, 'SPOTIFY_CLIENT_ID', None)
        self.spotify_client_secret = getattr(settings, 'SPOTIFY_CLIENT_SECRET', None)
        self.genius_api_key = getattr(settings, 'GENIUS_API_KEY', None)
        self._spotify_token = None
    
    def fetch_music_data(self, config: dict) -> Dict:
        """
        Fetch music data based on configuration
        
        Args:
            config: MusicConfig dict with trackId, artistName, songTitle, etc.
        
        Returns:
            {
                'track': {...},
                'lyrics': [...],
                'source': 'spotify|genius|mock',
            }
        """
        track_id = config.get('trackId')
        artist_name = config.get('artistName')
        song_title = config.get('songTitle')
        
        if not any([track_id, artist_name, song_title]):
            return self._generate_mock_music(config)
        
        track_data = {}
        lyrics_data = []
        
        # Fetch from Spotify
        if self.spotify_client_id and self.spotify_client_secret:
            try:
                if track_id:
                    track_data = self._fetch_track_from_spotify(track_id)
                elif artist_name and song_title:
                    track_data = self._search_spotify(artist_name, song_title)
            except Exception as e:
                logger.error(f"Spotify fetch failed: {e}")
        
        # Fetch lyrics from Genius
        if self.genius_api_key and (artist_name or track_data.get('artist')):
            try:
                artist = artist_name or track_data.get('artist')
                title = song_title or track_data.get('title')
                if artist and title:
                    lyrics_data = self._fetch_lyrics_from_genius(artist, title)
            except Exception as e:
                logger.error(f"Genius fetch failed: {e}")
        
        # If no real data, generate mock
        if not track_data:
            return self._generate_mock_music(config)
        
        return {
            'track': track_data,
            'lyrics': lyrics_data,
            'source': 'spotify' if track_data else 'mock',
        }
    
    def _get_spotify_token(self) -> str:
        """Get Spotify access token"""
        if self._spotify_token:
            return self._spotify_token
        
        auth_string = f"{self.spotify_client_id}:{self.spotify_client_secret}"
        auth_bytes = auth_string.encode('utf-8')
        auth_base64 = base64.b64encode(auth_bytes).decode('utf-8')
        
        response = requests.post(
            'https://accounts.spotify.com/api/token',
            data={'grant_type': 'client_credentials'},
            headers={'Authorization': f'Basic {auth_base64}'},
            timeout=10
        )
        response.raise_for_status()
        
        self._spotify_token = response.json()['access_token']
        return self._spotify_token
    
    def _fetch_track_from_spotify(self, track_id: str) -> Dict:
        """Fetch track details from Spotify by ID"""
        token = self._get_spotify_token()
        
        response = requests.get(
            f'https://api.spotify.com/v1/tracks/{track_id}',
            headers={'Authorization': f'Bearer {token}'},
            timeout=10
        )
        response.raise_for_status()
        
        data = response.json()
        
        return {
            'title': data['name'],
            'artist': ', '.join([artist['name'] for artist in data['artists']]),
            'album': data['album']['name'],
            'album_art': data['album']['images'][0]['url'] if data['album']['images'] else None,
            'duration_ms': data['duration_ms'],
            'release_date': data['album']['release_date'],
            'preview_url': data.get('preview_url'),
            'spotify_url': data['external_urls']['spotify'],
        }
    
    def _search_spotify(self, artist: str, title: str) -> Dict:
        """Search for a track on Spotify"""
        token = self._get_spotify_token()
        
        query = f'artist:{artist} track:{title}'
        response = requests.get(
            'https://api.spotify.com/v1/search',
            params={'q': query, 'type': 'track', 'limit': 1},
            headers={'Authorization': f'Bearer {token}'},
            timeout=10
        )
        response.raise_for_status()
        
        data = response.json()
        tracks = data.get('tracks', {}).get('items', [])
        
        if not tracks:
            raise ValueError(f"No track found for: {artist} - {title}")
        
        track = tracks[0]
        return self._fetch_track_from_spotify(track['id'])
    
    def _fetch_lyrics_from_genius(self, artist: str, title: str) -> List[str]:
        """Fetch lyrics from Genius API"""
        # Search for song
        response = requests.get(
            'https://api.genius.com/search',
            params={'q': f'{artist} {title}'},
            headers={'Authorization': f'Bearer {self.genius_api_key}'},
            timeout=10
        )
        response.raise_for_status()
        
        data = response.json()
        hits = data.get('response', {}).get('hits', [])
        
        if not hits:
            return []
        
        # Note: Genius API doesn't provide lyrics directly via API
        # Would need to scrape from the song page URL
        # For now, return placeholder
        song_url = hits[0]['result']['url']
        
        return [
            f"Lyrics available at: {song_url}",
            "Note: Full lyrics require web scraping from Genius.com"
        ]
    
    def _generate_mock_music(self, config: dict) -> Dict:
        """Generate mock music data"""
        artist = config.get('artistName', 'Artist Name')
        title = config.get('songTitle', 'Song Title')
        
        return {
            'track': {
                'title': title,
                'artist': artist,
                'album': 'Album Name',
                'album_art': None,
                'duration_ms': 240000,  # 4 minutes
                'release_date': '2026-01-01',
                'preview_url': None,
                'spotify_url': 'https://open.spotify.com/track/example',
            },
            'lyrics': [
                'Verse 1: Mock lyrics for demonstration',
                'Chorus: This is a placeholder',
                'Verse 2: Real lyrics require API keys',
            ],
            'source': 'mock',
            'warning': 'No API keys configured. Using mock data.'
        }
    
    def generate_scenes_from_music(self, data: Dict, config: dict) -> List[Dict]:
        """
        Generate video scene suggestions from music data
        
        Args:
            data: Music data dict with track and lyrics
            config: Original config with video type preferences
        
        Returns:
            List of scene suggestions
        """
        scenes = []
        track = data.get('track', {})
        lyrics = data.get('lyrics', [])
        video_type = config.get('videoType', 'lyric')
        
        title = track.get('title', 'Song')
        artist = track.get('artist', 'Artist')
        
        # Opening scene
        scenes.append({
            'scene_number': 1,
            'duration_seconds': 3,
            'narrative_text': f"{title} - {artist}",
            'visual_prompt': f"Music video intro, album art display, artist name and song title text overlay, {video_type} video style",
            'type': 'title_card',
        })
        
        # Music video scenes based on type
        if video_type == 'lyric':
            # Lyric video scenes
            for i, lyric_line in enumerate(lyrics[:5], start=2):
                scenes.append({
                    'scene_number': i,
                    'duration_seconds': 8,
                    'narrative_text': lyric_line,
                    'visual_prompt': f"Lyric video aesthetic, animated text: '{lyric_line}', artistic background, music video style",
                    'type': 'lyrics',
                })
        elif video_type == 'visualizer':
            # Audio visualizer scenes
            scenes.append({
                'scene_number': 2,
                'duration_seconds': 60,
                'narrative_text': f"Audio visualizer for {title}",
                'visual_prompt': f"Dynamic audio visualizer, abstract animated patterns synced to music, album art integration, psychedelic colors",
                'type': 'visualizer',
            })
        else:
            # Narrative or performance style
            scenes.append({
                'scene_number': 2,
                'duration_seconds': 30,
                'narrative_text': f"Music performance: {title}",
                'visual_prompt': f"Music video footage, {artist} performance, concert atmosphere, professional music video quality",
                'type': 'performance',
            })
        
        # Outro
        scenes.append({
            'scene_number': len(scenes) + 1,
            'duration_seconds': 3,
            'narrative_text': f"Stream {title} now",
            'visual_prompt': "Music video outro, streaming platform logos, call to action graphics",
            'type': 'outro',
        })
        
        return scenes
