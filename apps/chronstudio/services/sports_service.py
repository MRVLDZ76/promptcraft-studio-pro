"""
Sports Service - Fetch sports data and generate video scenes
Supports: The Sports DB (free), ESPN API, API-Football
"""
import requests
from typing import List, Dict, Optional
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class SportsService:
    """Service for fetching sports data and generating video content"""
    
    def __init__(self):
        self.sportsdb_key = getattr(settings, 'SPORTS_DB_KEY', '3')  # Free tier key
        self.api_football_key = getattr(settings, 'API_FOOTBALL_KEY', None)
    
    def fetch_sports(self, config: dict) -> Dict:
        """
        Fetch sports data based on configuration
        
        Args:
            config: SportsConfig dict with sport, league, teams, etc.
        
        Returns:
            {
                'events': [...],
                'teams': [...],
                'players': [...],
                'source': 'sportsdb|api-football',
                'count': int
            }
        """
        sport = config.get('sport', 'soccer')
        
        # Try The Sports DB first (free)
        try:
            return self._fetch_from_sportsdb(config)
        except Exception as e:
            logger.error(f"SportsDB fetch failed: {e}")
        
        # Fallback to API-Football for soccer
        if sport == 'soccer' and self.api_football_key:
            try:
                return self._fetch_from_api_football(config)
            except Exception as e:
                logger.error(f"API-Football fetch failed: {e}")
        
        # No data available, generate mock
        return self._generate_mock_sports(config)
    
    def _fetch_from_sportsdb(self, config: dict) -> Dict:
        """Fetch from The Sports DB"""
        sport = config.get('sport', 'soccer')
        league = config.get('league', 'English Premier League')
        
        # Search for league
        response = requests.get(
            f'https://www.thesportsdb.com/api/v1/json/{self.sportsdb_key}/search_all_leagues.php',
            params={'s': sport.capitalize()},
            timeout=10
        )
        response.raise_for_status()
        leagues_data = response.json()
        
        # Get recent events for the league
        events = []
        teams = []
        
        # Search for teams in league
        if league:
            team_response = requests.get(
                f'https://www.thesportsdb.com/api/v1/json/{self.sportsdb_key}/search_all_teams.php',
                params={'l': league},
                timeout=10
            )
            
            if team_response.status_code == 200:
                team_data = team_response.json()
                teams = team_data.get('teams', [])[:5]  # Top 5 teams
        
        # Mock events for demonstration
        if teams:
            events.append({
                'event_name': f"{teams[0].get('strTeam', 'Team A')} vs {teams[1].get('strTeam', 'Team B') if len(teams) > 1 else 'Team B'}",
                'date': '2026-02-02',
                'league': league,
                'sport': sport,
                'venue': teams[0].get('strStadium', 'Stadium'),
            })
        
        return {
            'events': events,
            'teams': [{'name': t.get('strTeam'), 'badge': t.get('strTeamBadge')} for t in teams],
            'source': 'sportsdb',
            'count': len(events),
            'sport': sport,
            'league': league,
        }
    
    def _fetch_from_api_football(self, config: dict) -> Dict:
        """Fetch from API-Football (soccer specific)"""
        league_name = config.get('league', 'Premier League')
        
        headers = {
            'x-rapidapi-key': self.api_football_key,
            'x-rapidapi-host': 'v3.football.api-sports.io'
        }
        
        # Get fixtures
        response = requests.get(
            'https://v3.football.api-sports.io/fixtures',
            params={'league': '39', 'season': '2025', 'last': '5'},  # Premier League example
            headers=headers,
            timeout=10
        )
        response.raise_for_status()
        
        data = response.json()
        events = []
        
        for fixture in data.get('response', []):
            events.append({
                'event_name': f"{fixture['teams']['home']['name']} vs {fixture['teams']['away']['name']}",
                'date': fixture['fixture']['date'],
                'league': league_name,
                'sport': 'soccer',
                'venue': fixture['fixture']['venue']['name'],
                'score': f"{fixture['goals']['home']} - {fixture['goals']['away']}" if fixture['goals']['home'] is not None else 'TBD',
            })
        
        return {
            'events': events,
            'source': 'api-football',
            'count': len(events),
            'sport': 'soccer',
            'league': league_name,
        }
    
    def _generate_mock_sports(self, config: dict) -> Dict:
        """Generate mock sports data"""
        sport = config.get('sport', 'soccer')
        league = config.get('league', 'Premier League')
        
        events = [
            {
                'event_name': 'Team A vs Team B',
                'date': '2026-02-02',
                'league': league,
                'sport': sport,
                'venue': 'Stadium Arena',
                'score': '2 - 1',
            },
            {
                'event_name': 'Team C vs Team D',
                'date': '2026-02-01',
                'league': league,
                'sport': sport,
                'venue': 'Sports Complex',
                'score': '3 - 3',
            },
        ]
        
        return {
            'events': events,
            'teams': [],
            'source': 'mock',
            'count': len(events),
            'sport': sport,
            'league': league,
            'warning': 'No API keys configured. Using mock data.'
        }
    
    def generate_scenes_from_sports(self, data: Dict) -> List[Dict]:
        """
        Generate video scene suggestions from sports data
        
        Args:
            data: Sports data dict with events, teams, etc.
        
        Returns:
            List of scene suggestions
        """
        scenes = []
        events = data.get('events', [])
        sport = data.get('sport', 'sports')
        league = data.get('league', 'League')
        
        # Opening scene
        scenes.append({
            'scene_number': 1,
            'duration_seconds': 4,
            'narrative_text': f"{league} Highlights - {sport.title()}",
            'visual_prompt': f"Sports broadcast intro, {sport} stadium atmosphere, dynamic graphics with league logo",
            'type': 'title_card',
        })
        
        # Event scenes
        for i, event in enumerate(events[:3], start=2):
            scenes.append({
                'scene_number': i,
                'duration_seconds': 10,
                'narrative_text': f"{event['event_name']} - {event.get('score', 'Match Highlights')}",
                'visual_prompt': f"{sport} game highlights, {event['venue']}, action shots, crowd reactions, professional sports broadcast quality",
                'type': 'content',
                'event_data': event,
            })
        
        # Closing scene
        scenes.append({
            'scene_number': len(scenes) + 1,
            'duration_seconds': 3,
            'narrative_text': f"More {league} action coming soon!",
            'visual_prompt': f"Sports outro, {sport} montage, call to action graphics",
            'type': 'outro',
        })
        
        return scenes
