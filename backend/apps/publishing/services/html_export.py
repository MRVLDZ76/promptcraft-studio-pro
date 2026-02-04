"""
HTML Export Service
Generates standalone HTML files for web viewing
"""

import os
import logging
import shutil
from typing import Optional
from django.conf import settings
from apps.publishing.models import BookProject

logger = logging.getLogger(__name__)


class HTMLExportService:
    """Service for generating HTML exports of books"""
    
    def __init__(self):
        self.output_dir = os.path.join(settings.MEDIA_ROOT, 'exports')
        os.makedirs(self.output_dir, exist_ok=True)
    
    def generate_html(
        self,
        book_id: int,
        single_page: bool = True
    ) -> dict:
        """
        Generate HTML for a book
        
        Args:
            book_id: ID of the book to export
            single_page: If True, create single HTML file. If False, separate files per chapter
            
        Returns:
            dict with file_path and metadata
        """
        # Load book data
        book = BookProject.objects.prefetch_related(
            'chapters__blocks'
        ).get(id=book_id)
        
        chapters = book.chapters.order_by('sequence_order').all()
        
        # Create output directory
        book_dir = os.path.join(
            self.output_dir,
            f'book_{book.id}_html'
        )
        os.makedirs(book_dir, exist_ok=True)
        
        if single_page:
            output_path = self._generate_single_page(book, chapters, book_dir)
        else:
            output_path = self._generate_multi_page(book, chapters, book_dir)
        
        file_size = self._get_dir_size(book_dir)
        
        logger.info(f"Generated HTML for book {book.id}: {output_path} ({file_size} bytes)")
        
        return {
            'file_path': output_path,
            'file_size': file_size,
            'chapter_count': len(chapters),
            'format': 'html'
        }
    
    def _generate_single_page(self, book, chapters, output_dir) -> str:
        """Generate single-page HTML"""
        
        html_parts = [
            '<!DOCTYPE html>',
            '<html lang="en">',
            '<head>',
            '<meta charset="UTF-8">',
            '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
            f'<title>{book.title}</title>',
            f'<style>{self._get_html_css()}</style>',
            '</head>',
            '<body>',
            '<div class="container">',
        ]
        
        # Header
        html_parts.append(f'''
            <header class="book-header">
                <h1 class="book-title">{book.title}</h1>
                {f'<p class="book-author">by {book.user.username}</p>' if book.user else ''}
                {f'<p class="book-description">{book.description}</p>' if book.description else ''}
            </header>
        ''')
        
        # Table of contents
        html_parts.append('<nav class="toc"><h2>Table of Contents</h2><ul>')
        for idx, chapter in enumerate(chapters, 1):
            html_parts.append(
                f'<li><a href="#chapter-{chapter.id}">{idx}. {chapter.title}</a></li>'
            )
        html_parts.append('</ul></nav>')
        
        # Chapters
        for chapter in chapters:
            html_parts.append(f'''
                <article class="chapter" id="chapter-{chapter.id}">
                    <h2 class="chapter-title">{chapter.title}</h2>
            ''')
            
            if chapter.summary:
                html_parts.append(f'<p class="chapter-summary"><em>{chapter.summary}</em></p>')
            
            # Blocks
            for block in chapter.blocks.order_by('sequence_order'):
                content = block.processed_text or block.input_text or ''
                
                if block.block_type == 'TEXT':
                    html_parts.append(f'<div class="text-block">{content}</div>')
                elif block.block_type == 'IMAGE':
                    if block.generated_image_url:
                        html_parts.append(f'''
                            <figure class="image-block">
                                <img src="{block.generated_image_url}" alt="{content[:100]}" loading="lazy">
                                <figcaption>{content}</figcaption>
                            </figure>
                        ''')
                elif block.block_type == 'HEADING':
                    html_parts.append(f'<h3 class="block-heading">{content}</h3>')
            
            html_parts.append('</article>')
        
        # Footer
        html_parts.append(f'''
            <footer class="book-footer">
                <p>Generated with PromptStudio Publishing</p>
                <p>&copy; {book.created_at.year} {book.user.username if book.user else "Unknown"}</p>
            </footer>
        ''')
        
        html_parts.extend(['</div>', '</body>', '</html>'])
        
        # Write file
        output_path = os.path.join(output_dir, 'index.html')
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(html_parts))
        
        return output_path
    
    def _generate_multi_page(self, book, chapters, output_dir) -> str:
        """Generate multi-page HTML (one file per chapter)"""
        
        # Create index page
        index_html = [
            '<!DOCTYPE html>',
            '<html lang="en">',
            '<head>',
            '<meta charset="UTF-8">',
            f'<title>{book.title}</title>',
            f'<style>{self._get_html_css()}</style>',
            '</head>',
            '<body>',
            '<div class="container">',
            f'<h1>{book.title}</h1>',
            f'<p class="book-author">by {book.user.username if book.user else "Unknown"}</p>',
            '<nav class="toc"><h2>Chapters</h2><ul>',
        ]
        
        for idx, chapter in enumerate(chapters, 1):
            index_html.append(
                f'<li><a href="chapter_{chapter.id}.html">{idx}. {chapter.title}</a></li>'
            )
        
        index_html.extend(['</ul></nav>', '</div>', '</body>', '</html>'])
        
        # Write index
        index_path = os.path.join(output_dir, 'index.html')
        with open(index_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(index_html))
        
        # Generate individual chapter files
        for chapter in chapters:
            self._write_chapter_file(book, chapter, chapters, output_dir)
        
        return index_path
    
    def _write_chapter_file(self, book, chapter, all_chapters, output_dir):
        """Write individual chapter HTML file"""
        
        chapter_list = list(all_chapters)
        current_idx = chapter_list.index(chapter)
        prev_chapter = chapter_list[current_idx - 1] if current_idx > 0 else None
        next_chapter = chapter_list[current_idx + 1] if current_idx < len(chapter_list) - 1 else None
        
        html = [
            '<!DOCTYPE html>',
            '<html lang="en">',
            '<head>',
            '<meta charset="UTF-8">',
            f'<title>{chapter.title} - {book.title}</title>',
            f'<style>{self._get_html_css()}</style>',
            '</head>',
            '<body>',
            '<div class="container">',
            '<nav class="chapter-nav">',
            '<a href="index.html">← Table of Contents</a>',
        ]
        
        if prev_chapter:
            html.append(f'<a href="chapter_{prev_chapter.id}.html">← Previous</a>')
        if next_chapter:
            html.append(f'<a href="chapter_{next_chapter.id}.html">Next →</a>')
        
        html.append('</nav>')
        html.append(f'<h1>{chapter.title}</h1>')
        
        # Chapter content
        for block in chapter.blocks.order_by('sequence_order'):
            content = block.processed_text or block.input_text or ''
            
            if block.block_type == 'TEXT':
                html.append(f'<div class="text-block">{content}</div>')
            elif block.block_type == 'IMAGE':
                if block.generated_image_url:
                    html.append(f'''
                        <figure class="image-block">
                            <img src="{block.generated_image_url}" alt="{content[:100]}">
                            <figcaption>{content}</figcaption>
                        </figure>
                    ''')
            elif block.block_type == 'HEADING':
                html.append(f'<h2 class="block-heading">{content}</h2>')
        
        html.extend(['</div>', '</body>', '</html>'])
        
        output_path = os.path.join(output_dir, f'chapter_{chapter.id}.html')
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(html))
    
    def _get_html_css(self) -> str:
        """Get CSS styling for HTML export"""
        
        return '''
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: Georgia, serif;
                font-size: 18px;
                line-height: 1.8;
                color: #333;
                background: #f5f5f5;
            }
            
            .container {
                max-width: 800px;
                margin: 0 auto;
                padding: 2rem;
                background: white;
                box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            
            .book-header {
                text-align: center;
                padding: 3rem 0;
                border-bottom: 2px solid #e0e0e0;
                margin-bottom: 3rem;
            }
            
            .book-title {
                font-size: 3rem;
                font-weight: bold;
                margin-bottom: 1rem;
                color: #1a1a1a;
            }
            
            .book-author {
                font-size: 1.3rem;
                color: #666;
                margin-bottom: 1rem;
            }
            
            .book-description {
                font-size: 1.1rem;
                line-height: 1.6;
                color: #555;
                max-width: 600px;
                margin: 1rem auto;
            }
            
            .toc {
                margin: 3rem 0;
                padding: 2rem;
                background: #f9f9f9;
                border-radius: 8px;
            }
            
            .toc h2 {
                font-size: 1.8rem;
                margin-bottom: 1.5rem;
                color: #2c3e50;
            }
            
            .toc ul {
                list-style: none;
            }
            
            .toc li {
                margin-bottom: 0.8rem;
                font-size: 1.1rem;
            }
            
            .toc a {
                color: #3498db;
                text-decoration: none;
                transition: color 0.2s;
            }
            
            .toc a:hover {
                color: #2980b9;
                text-decoration: underline;
            }
            
            .chapter {
                margin: 4rem 0;
                padding-bottom: 3rem;
                border-bottom: 1px solid #e0e0e0;
            }
            
            .chapter-title {
                font-size: 2.2rem;
                font-weight: bold;
                margin-bottom: 2rem;
                color: #1a1a1a;
            }
            
            .chapter-summary {
                font-style: italic;
                color: #666;
                margin-bottom: 2rem;
                padding: 1rem;
                background: #f9f9f9;
                border-left: 4px solid #3498db;
            }
            
            .text-block {
                margin-bottom: 1.5rem;
                text-align: justify;
            }
            
            .text-block p {
                margin-bottom: 1rem;
            }
            
            .image-block {
                margin: 2.5rem 0;
                text-align: center;
            }
            
            .image-block img {
                max-width: 100%;
                height: auto;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            
            .image-block figcaption {
                margin-top: 1rem;
                font-size: 0.95rem;
                color: #666;
                font-style: italic;
            }
            
            .block-heading {
                font-size: 1.6rem;
                font-weight: bold;
                margin: 2rem 0 1rem 0;
                color: #2c3e50;
            }
            
            .chapter-nav {
                display: flex;
                justify-content: space-between;
                margin-bottom: 2rem;
                padding-bottom: 1rem;
                border-bottom: 1px solid #e0e0e0;
            }
            
            .chapter-nav a {
                color: #3498db;
                text-decoration: none;
                font-weight: 500;
            }
            
            .chapter-nav a:hover {
                text-decoration: underline;
            }
            
            .book-footer {
                margin-top: 4rem;
                padding-top: 2rem;
                border-top: 2px solid #e0e0e0;
                text-align: center;
                color: #999;
                font-size: 0.9rem;
            }
            
            /* Drop cap */
            .chapter .text-block:first-of-type::first-letter {
                font-size: 3.5em;
                float: left;
                line-height: 0.9;
                margin: 0.1em 0.15em 0 0;
                font-weight: bold;
                color: #2c3e50;
            }
            
            /* Responsive */
            @media (max-width: 768px) {
                body {
                    font-size: 16px;
                }
                
                .container {
                    padding: 1rem;
                }
                
                .book-title {
                    font-size: 2rem;
                }
                
                .chapter-title {
                    font-size: 1.8rem;
                }
            }
        '''
    
    def _get_dir_size(self, directory) -> int:
        """Calculate total size of directory"""
        total_size = 0
        for dirpath, dirnames, filenames in os.walk(directory):
            for filename in filenames:
                filepath = os.path.join(dirpath, filename)
                total_size += os.path.getsize(filepath)
        return total_size
