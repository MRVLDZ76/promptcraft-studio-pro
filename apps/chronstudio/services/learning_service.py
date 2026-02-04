"""
Learning Service - Fetch educational content and generate video scenes
Supports: Wikipedia API, Khan Academy (future)
"""
import requests
from typing import List, Dict, Optional
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class LearningService:
    """Service for fetching educational content and generating video scenes"""
    
    def __init__(self):
        self.wikipedia_api = 'https://en.wikipedia.org/w/api.php'
    
    def fetch_learning_content(self, config: dict) -> Dict:
        """
        Fetch educational content based on configuration
        
        Args:
            config: LearningConfig dict with subject, topic, difficulty, etc.
        
        Returns:
            {
                'content': {...},
                'references': [...],
                'source': 'wikipedia|khan|mock',
                'topic': str
            }
        """
        topic = config.get('topic', '')
        subject = config.get('subject', '')
        
        if not topic:
            return self._generate_mock_learning(config)
        
        try:
            return self._fetch_from_wikipedia(topic, subject, config)
        except Exception as e:
            logger.error(f"Wikipedia fetch failed: {e}")
            return self._generate_mock_learning(config)
    
    def _fetch_from_wikipedia(self, topic: str, subject: str, config: dict) -> Dict:
        """Fetch content from Wikipedia API"""
        
        # Search for the topic
        search_params = {
            'action': 'query',
            'list': 'search',
            'srsearch': topic,
            'format': 'json',
            'srlimit': 1,
        }
        
        response = requests.get(self.wikipedia_api, params=search_params, timeout=10)
        response.raise_for_status()
        search_data = response.json()
        
        if not search_data.get('query', {}).get('search'):
            raise ValueError(f"No Wikipedia article found for: {topic}")
        
        page_title = search_data['query']['search'][0]['title']
        
        # Get page content
        content_params = {
            'action': 'query',
            'prop': 'extracts|pageimages',
            'exintro': True,
            'explaintext': True,
            'titles': page_title,
            'format': 'json',
            'piprop': 'original',
        }
        
        content_response = requests.get(self.wikipedia_api, params=content_params, timeout=10)
        content_response.raise_for_status()
        content_data = content_response.json()
        
        pages = content_data.get('query', {}).get('pages', {})
        page = list(pages.values())[0]
        
        extract = page.get('extract', '')
        image_url = page.get('original', {}).get('source')
        
        # Split into sections (paragraphs)
        paragraphs = [p.strip() for p in extract.split('\n\n') if p.strip()]
        
        return {
            'content': {
                'title': page_title,
                'summary': paragraphs[0] if paragraphs else extract[:500],
                'sections': paragraphs[:5],  # First 5 paragraphs
                'image_url': image_url,
                'url': f'https://en.wikipedia.org/wiki/{page_title.replace(" ", "_")}',
            },
            'references': [f'https://en.wikipedia.org/wiki/{page_title.replace(" ", "_")}'],
            'source': 'wikipedia',
            'topic': topic,
            'subject': subject,
        }
    
    def _generate_mock_learning(self, config: dict) -> Dict:
        """Generate mock educational content"""
        topic = config.get('topic', 'Science')
        subject = config.get('subject', 'General')
        difficulty = config.get('difficulty', 'intermediate')
        
        content = {
            'title': topic.title(),
            'summary': f'An introduction to {topic}. This is educational content suitable for {difficulty} level learners.',
            'sections': [
                f'What is {topic}? {topic} is an important concept in {subject}.',
                f'Key principles of {topic} include fundamental concepts and practical applications.',
                f'Understanding {topic} helps in various real-world scenarios.',
            ],
            'image_url': None,
            'url': 'https://example.com/learning',
        }
        
        return {
            'content': content,
            'references': [],
            'source': 'mock',
            'topic': topic,
            'subject': subject,
            'warning': 'Using mock educational content.'
        }
    
    def generate_scenes_from_learning(self, data: Dict) -> List[Dict]:
        """
        Generate video scene suggestions from educational content
        
        Args:
            data: Learning content dict
        
        Returns:
            List of scene suggestions
        """
        scenes = []
        content = data.get('content', {})
        topic = data.get('topic', 'Topic')
        difficulty = data.get('difficulty', 'intermediate')
        visual_style = data.get('visualStyle', 'animated')
        
        # Opening scene
        scenes.append({
            'scene_number': 1,
            'duration_seconds': 4,
            'narrative_text': f"Learn about {topic}",
            'visual_prompt': f"Educational intro, {visual_style} style, whiteboard or classroom aesthetic, title text: '{topic}'",
            'type': 'title_card',
        })
        
        # Introduction scene
        scenes.append({
            'scene_number': 2,
            'duration_seconds': 10,
            'narrative_text': content.get('summary', f'Introduction to {topic}'),
            'visual_prompt': f"{visual_style} educational content, clear explanatory visuals, {difficulty} level comprehension, engaging graphics",
            'type': 'intro',
        })
        
        # Content sections
        sections = content.get('sections', [])
        for i, section in enumerate(sections[:3], start=3):
            scenes.append({
                'scene_number': i,
                'duration_seconds': 12,
                'narrative_text': section,
                'visual_prompt': f"{visual_style} educational visuals, diagrams and illustrations related to: {section[:100]}, clear and informative",
                'type': 'content',
            })
        
        # Conclusion scene
        scenes.append({
            'scene_number': len(scenes) + 1,
            'duration_seconds': 5,
            'narrative_text': f"You've learned about {topic}. Keep exploring!",
            'visual_prompt': f"Educational outro, {visual_style} summary graphics, encouraging call to action",
            'type': 'outro',
        })
        
        return scenes
