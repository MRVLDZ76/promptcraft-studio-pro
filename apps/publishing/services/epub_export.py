"""
EPUB Export Service using ebooklib
Generates EPUB format ebooks with proper structure
"""

import os
import logging
from typing import Optional
from django.conf import settings
from apps.publishing.models import BookProject

logger = logging.getLogger(__name__)


class EPUBExportService:
    """Service for generating EPUB exports of books"""
    
    def __init__(self):
        self.output_dir = os.path.join(settings.MEDIA_ROOT, 'exports')
        os.makedirs(self.output_dir, exist_ok=True)
    
    def generate_epub(
        self,
        book_id: int,
        include_cover: bool = True
    ) -> dict:
        """
        Generate EPUB for a book
        
        Args:
            book_id: ID of the book to export
            include_cover: Whether to include cover image
            
        Returns:
            dict with file_path and metadata
        """
        try:
            from ebooklib import epub
        except ImportError:
            logger.error("ebooklib not installed. Run: pip install ebooklib")
            raise ImportError("ebooklib is required for EPUB export")
        
        # Load book data
        book = BookProject.objects.prefetch_related(
            'chapters__blocks'
        ).get(id=book_id)
        
        chapters = book.chapters.order_by('sequence_order').all()
        
        # Create EPUB book
        ebook = epub.EpubBook()
        
        # Set metadata
        ebook.set_identifier(f'book-{book.id}')
        ebook.set_title(book.title)
        ebook.set_language('en')
        
        if book.user:
            ebook.add_author(book.user.username)
        
        if book.description:
            ebook.add_metadata('DC', 'description', book.description)
        
        # Add cover image
        if include_cover and book.cover_image:
            try:
                with open(book.cover_image.path, 'rb') as cover_file:
                    ebook.set_cover('cover.jpg', cover_file.read())
            except Exception as e:
                logger.warning(f"Could not add cover image: {e}")
        
        # Add chapters
        epub_chapters = []
        spine = ['nav']
        
        for idx, chapter in enumerate(chapters, 1):
            # Create EPUB chapter
            epub_chapter = epub.EpubHtml(
                title=chapter.title,
                file_name=f'chapter_{chapter.id}.xhtml',
                lang='en'
            )
            
            # Build chapter HTML
            chapter_html = self._build_chapter_html(chapter)
            epub_chapter.content = chapter_html
            
            # Add to book
            ebook.add_item(epub_chapter)
            epub_chapters.append(epub_chapter)
            spine.append(epub_chapter)
        
        # Add CSS
        css = self._get_epub_css()
        nav_css = epub.EpubItem(
            uid="style_nav",
            file_name="style/nav.css",
            media_type="text/css",
            content=css
        )
        ebook.add_item(nav_css)
        
        # Add navigation
        ebook.toc = epub_chapters
        ebook.add_item(epub.EpubNcx())
        ebook.add_item(epub.EpubNav())
        
        # Set spine
        ebook.spine = spine
        
        # Write EPUB file
        output_path = os.path.join(
            self.output_dir,
            f'book_{book.id}',
            f'{book.title.replace(" ", "_")}.epub'
        )
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        epub.write_epub(output_path, ebook, {})
        
        file_size = os.path.getsize(output_path)
        
        logger.info(f"Generated EPUB for book {book.id}: {output_path} ({file_size} bytes)")
        
        return {
            'file_path': output_path,
            'file_size': file_size,
            'chapter_count': len(chapters),
            'format': 'epub'
        }
    
    def _build_chapter_html(self, chapter) -> str:
        """Build HTML content for a chapter"""
        
        html_parts = [
            f'<html><head><title>{chapter.title}</title></head><body>',
            f'<h1>{chapter.title}</h1>'
        ]
        
        # Add chapter summary if available
        if chapter.summary:
            html_parts.append(f'<p class="chapter-summary"><em>{chapter.summary}</em></p>')
        
        # Add blocks
        for block in chapter.blocks.order_by('sequence_order'):
            content = block.processed_text or block.input_text or ''
            
            if block.block_type == 'TEXT':
                html_parts.append(f'<div class="text-block">{content}</div>')
            elif block.block_type == 'IMAGE':
                if block.generated_image_url:
                    html_parts.append(f'''
                        <div class="image-block">
                            <img src="{block.generated_image_url}" alt="{content[:100]}"/>
                            <p class="image-caption">{content}</p>
                        </div>
                    ''')
            elif block.block_type == 'HEADING':
                html_parts.append(f'<h2 class="block-heading">{content}</h2>')
        
        html_parts.append('</body></html>')
        
        return '\n'.join(html_parts)
    
    def _get_epub_css(self) -> str:
        """Get CSS styling for EPUB"""
        
        return '''
            body {
                font-family: Georgia, serif;
                font-size: 1.1em;
                line-height: 1.6;
                margin: 1em;
                color: #333;
            }
            
            h1 {
                font-size: 2em;
                font-weight: bold;
                margin: 1.5em 0 1em 0;
                color: #1a1a1a;
                text-align: center;
            }
            
            h2 {
                font-size: 1.5em;
                font-weight: bold;
                margin: 1.2em 0 0.8em 0;
                color: #2c3e50;
            }
            
            .chapter-summary {
                font-style: italic;
                color: #666;
                margin-bottom: 1.5em;
                text-align: center;
            }
            
            .text-block {
                margin-bottom: 1em;
                text-align: justify;
            }
            
            .text-block p {
                margin-bottom: 0.8em;
            }
            
            .image-block {
                margin: 1.5em 0;
                text-align: center;
            }
            
            .image-block img {
                max-width: 100%;
                height: auto;
            }
            
            .image-caption {
                font-size: 0.9em;
                color: #666;
                font-style: italic;
                margin-top: 0.5em;
            }
            
            .block-heading {
                font-size: 1.3em;
                font-weight: bold;
                margin: 1em 0 0.5em 0;
                color: #2c3e50;
            }
            
            /* Drop cap */
            .text-block:first-of-type::first-letter {
                font-size: 3em;
                float: left;
                line-height: 0.9;
                margin: 0.1em 0.1em 0 0;
                font-weight: bold;
            }
        '''
