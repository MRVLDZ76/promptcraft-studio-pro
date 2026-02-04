"""
News Service - Fetch news articles and generate video scenes
Supports: Tavily AI, NewsAPI.org, GNews API
"""
import requests
from typing import List, Dict, Optional
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class NewsService:
    """Service for fetching news and generating video content"""
    
    def __init__(self):
        self.tavily_key = getattr(settings, 'TAVILY_API_KEY', None)
        self.newsapi_key = getattr(settings, 'NEWS_API_KEY', None)
        self.gnews_key = getattr(settings, 'GNEWS_API_KEY', None)
    
    def fetch_news(self, config: dict) -> Dict:
        """
        Fetch news articles based on configuration
        
        Args:
            config: NewsConfig dict with keywords, countries, languages, etc.
        
        Returns:
            {
                'articles': [...],
                'source': 'tavily|newsapi|gnews',
                'count': int
            }
        """
        # Try Tavily first (recommended)
        if self.tavily_key:
            try:
                return self._fetch_from_tavily(config)
            except Exception as e:
                logger.error(f"Tavily fetch failed: {e}")
        
        # Fallback to NewsAPI
        if self.newsapi_key:
            try:
                return self._fetch_from_newsapi(config)
            except Exception as e:
                logger.error(f"NewsAPI fetch failed: {e}")
        
        # Fallback to GNews (free)
        if self.gnews_key:
            try:
                return self._fetch_from_gnews(config)
            except Exception as e:
                logger.error(f"GNews fetch failed: {e}")
        
        # No API keys configured
        return self._generate_mock_news(config)
    
    def _fetch_from_tavily(self, config: dict) -> Dict:
        """Fetch from Tavily AI"""
        keywords = config.get('keywords', [])
        query = ' '.join(keywords) if keywords else 'breaking news'
        
        response = requests.post(
            'https://api.tavily.com/search',
            json={
                'query': query,
                'search_depth': 'advanced',
                'max_results': 5,
                'include_answer': True,
                'include_raw_content': False,
                'include_images': True,
            },
            headers={'Authorization': f'Bearer {self.tavily_key}'},
            timeout=10
        )
        response.raise_for_status()
        
        data = response.json()
        articles = []
        
        for result in data.get('results', []):
            articles.append({
                'title': result.get('title', ''),
                'description': result.get('content', ''),
                'url': result.get('url', ''),
                'published_at': result.get('published_date', ''),
                'source': result.get('source', 'Unknown'),
                'image_url': result.get('image_url'),
            })
        
        return {
            'articles': articles,
            'source': 'tavily',
            'count': len(articles),
            'query': query,
        }
    
    def _fetch_from_newsapi(self, config: dict) -> Dict:
        """Fetch from NewsAPI.org"""
        keywords = config.get('keywords', [])
        query = ' OR '.join(keywords) if keywords else 'breaking'
        
        params = {
            'q': query,
            'apiKey': self.newsapi_key,
            'pageSize': 5,
            'sortBy': config.get('sortBy', 'publishedAt'),
            'language': config.get('languages', ['en'])[0],
        }
        
        # Add date range if specified
        date_range = config.get('dateRange')
        if date_range:
            params['from'] = date_range.get('from')
            params['to'] = date_range.get('to')
        
        response = requests.get(
            'https://newsapi.org/v2/everything',
            params=params,
            timeout=10
        )
        response.raise_for_status()
        
        data = response.json()
        articles = []
        
        for article in data.get('articles', []):
            articles.append({
                'title': article.get('title', ''),
                'description': article.get('description', ''),
                'url': article.get('url', ''),
                'published_at': article.get('publishedAt', ''),
                'source': article.get('source', {}).get('name', 'Unknown'),
                'image_url': article.get('urlToImage'),
            })
        
        return {
            'articles': articles,
            'source': 'newsapi',
            'count': len(articles),
            'query': query,
        }
    
    def _fetch_from_gnews(self, config: dict) -> Dict:
        """Fetch from GNews API (free alternative)"""
        keywords = config.get('keywords', [])
        query = ' '.join(keywords) if keywords else 'news'
        
        params = {
            'q': query,
            'token': self.gnews_key,
            'max': 5,
            'lang': config.get('languages', ['en'])[0],
        }
        
        # Add country if specified
        countries = config.get('countries')
        if countries:
            params['country'] = countries[0]
        
        response = requests.get(
            'https://gnews.io/api/v4/search',
            params=params,
            timeout=10
        )
        response.raise_for_status()
        
        data = response.json()
        articles = []
        
        for article in data.get('articles', []):
            articles.append({
                'title': article.get('title', ''),
                'description': article.get('description', ''),
                'url': article.get('url', ''),
                'published_at': article.get('publishedAt', ''),
                'source': article.get('source', {}).get('name', 'Unknown'),
                'image_url': article.get('image'),
            })
        
        return {
            'articles': articles,
            'source': 'gnews',
            'count': len(articles),
            'query': query,
        }
    
    def _generate_mock_news(self, config: dict) -> Dict:
        """Generate mock news when no API keys configured"""
        keywords = config.get('keywords', ['news'])
        query = ' '.join(keywords)
        
        articles = [
            {
                'title': f'Breaking: {query.title()} Update',
                'description': f'Latest developments in {query}. This is a mock article for testing purposes.',
                'url': 'https://example.com/article1',
                'published_at': '2026-02-02T12:00:00Z',
                'source': 'Mock News',
                'image_url': None,
            },
            {
                'title': f'{query.title()} Analysis: What Experts Say',
                'description': f'Experts weigh in on recent {query} developments. Mock article for demonstration.',
                'url': 'https://example.com/article2',
                'published_at': '2026-02-02T11:00:00Z',
                'source': 'Mock Times',
                'image_url': None,
            },
        ]
        
        return {
            'articles': articles,
            'source': 'mock',
            'count': len(articles),
            'query': query,
            'warning': 'No API keys configured. Using mock data.'
        }
    
    def generate_scenes_from_news(self, articles: List[Dict]) -> List[Dict]:
        """
        Generate video scene suggestions from news articles
        
        Args:
            articles: List of news articles
        
        Returns:
            List of scene suggestions with narrative and visual prompts
        """
        scenes = []
        
        # Opening scene - Overview
        if articles:
            first_article = articles[0]
            scenes.append({
                'scene_number': 1,
                'duration_seconds': 5,
                'narrative_text': f"Breaking news: {first_article['title']}",
                'visual_prompt': f"News studio setting, dramatic lighting, text overlay with headline: '{first_article['title']}', professional news broadcast aesthetic",
                'type': 'title_card',
            })
        
        # Article scenes
        for i, article in enumerate(articles[:3], start=2):
            scenes.append({
                'scene_number': i,
                'duration_seconds': 8,
                'narrative_text': article['description'] or article['title'],
                'visual_prompt': f"B-roll footage related to: {article['title']}. Documentary style, news broadcast quality, relevant imagery and locations",
                'type': 'content',
                'source_url': article['url'],
            })
        
        # Closing scene
        scenes.append({
            'scene_number': len(scenes) + 1,
            'duration_seconds': 3,
            'narrative_text': 'Stay informed. More news coming soon.',
            'visual_prompt': 'News outro, professional graphics, call to action text',
            'type': 'outro',
        })
        
        return scenes
