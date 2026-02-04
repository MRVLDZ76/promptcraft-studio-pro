"""
PDF Export Service using WeasyPrint
Generates professional PDF books with custom styling

NEW: Support for marketplace specifications (Amazon KDP, IngramSpark, etc.)
- Configurable trim sizes (6x9, 5x8, 8.5x11, etc.)
- Bleed settings (0.125" for color books)
- Proper margins (gutter considerations)
- Spine width calculation for covers
"""

import os
import logging
from typing import Optional
from django.conf import settings
from django.template.loader import render_to_string
from apps.publishing.models import BookProject
from apps.publishing.marketplace_config import (
    TRIM_SIZES,
    BLEED_SPECS,
    MARGIN_SPECS,
    PAPER_TYPES,
    calculate_spine_width,
    calculate_cover_dimensions,
    validate_book_specs,
)

logger = logging.getLogger(__name__)


class PDFExportService:
    """Service for generating PDF exports of books"""
    
    def __init__(self):
        self.output_dir = os.path.join(settings.MEDIA_ROOT, 'exports')
        os.makedirs(self.output_dir, exist_ok=True)
    
    def generate_pdf(
        self,
        book_id: int,
        include_cover: bool = True,
        include_toc: bool = True,
        use_marketplace_specs: bool = True
    ) -> dict:
        """
        Generate PDF for a book with optional marketplace specifications
        
        Args:
            book_id: ID of the book to export
            include_cover: Whether to include cover page
            include_toc: Whether to include table of contents
            use_marketplace_specs: Use book's marketplace/trim_size settings (recommended)
            
        Returns:
            dict with file_path, metadata, and marketplace compliance info
        """
        try:
            # Import WeasyPrint here to fail gracefully if not installed
            from weasyprint import HTML, CSS
            from weasyprint.text.fonts import FontConfiguration
        except ImportError:
            logger.error("WeasyPrint not installed. Run: pip install weasyprint")
            raise ImportError("WeasyPrint is required for PDF export")
        
        # Load book data
        book = BookProject.objects.prefetch_related(
            'chapters__blocks'
        ).get(id=book_id)
        
        # Calculate spine width before generating
        if book.total_words > 0:
            page_count = max(24, book.estimated_pages)  # Minimum 24 pages for KDP
            spine_data = calculate_spine_width(page_count, book.paper_type)
            book.spine_width = spine_data['spine_width_inches']
            book.save(update_fields=['spine_width'])
        
        # Validate marketplace specs
        validation_errors = []
        if use_marketplace_specs:
            validation_errors = validate_book_specs(
                page_count=book.estimated_pages,
                trim_size=book.trim_size,
                marketplace=book.marketplace
            )
            if validation_errors:
                logger.warning(f"Book {book.id} has validation warnings: {validation_errors}")
        
        chapters = book.chapters.order_by('sequence_order').all()
        
        # Get marketplace specifications
        trim_specs = TRIM_SIZES.get(book.trim_size, TRIM_SIZES['kdp_6x9'])
        margin_specs = MARGIN_SPECS['kdp_recommended']  # Use recommended margins
        
        # Render HTML template
        html_content = self._render_html(book, chapters, include_cover, include_toc)
        
        # Get CSS styling with marketplace specs
        css_content = self._get_pdf_css(book, trim_specs, margin_specs, use_marketplace_specs)
        
        # Configure fonts
        font_config = FontConfiguration()
        
        # Generate PDF
        output_path = os.path.join(
            self.output_dir,
            f'book_{book.id}',
            f'{book.title.replace(" ", "_")}.pdf'
        )
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        html = HTML(string=html_content, base_url=settings.MEDIA_URL)
        css = CSS(string=css_content, font_config=font_config)
        
        html.write_pdf(
            target=output_path,
            stylesheets=[css],
            font_config=font_config
        )
        
        file_size = os.path.getsize(output_path)
        
        logger.info(f"Generated PDF for book {book.id}: {output_path} ({file_size} bytes)")
        
        return {
            'file_path': output_path,
            'file_size': file_size,
            'page_count': self._estimate_pages(book),
            'format': 'pdf',
            'marketplace_specs': {
                'marketplace': book.marketplace,
                'trim_size': trim_specs['name'],
                'trim_dimensions': f"{trim_specs['width_inches']}\" × {trim_specs['height_inches']}\"",
                'bleed': f"{0.125 if book.include_bleed else 0.0}\"",
                'spine_width': f"{book.spine_width:.4f}\"",
                'paper_type': book.paper_type,
                'color_interior': book.color_interior,
                'validation_warnings': validation_errors,
            }
        }
    
    def _render_html(
        self,
        book: BookProject,
        chapters,
        include_cover: bool,
        include_toc: bool
    ) -> str:
        """Render HTML content for PDF"""
        
        context = {
            'book': book,
            'chapters': chapters,
            'include_cover': include_cover,
            'include_toc': include_toc,
        }
        
        # Build HTML manually (or use Django template)
        html_parts = ['<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>']
        
        # Cover page
        if include_cover and book.cover_image:
            html_parts.append(f'''
                <div class="cover-page">
                    <h1 class="book-title">{book.title}</h1>
                    <p class="book-author">by {book.user.username}</p>
                    {f'<p class="book-description">{book.description}</p>' if book.description else ''}
                </div>
            ''')
        
        # Table of contents
        if include_toc:
            html_parts.append('<div class="toc-page"><h2>Table of Contents</h2><ul>')
            for idx, chapter in enumerate(chapters, 1):
                html_parts.append(f'<li><a href="#chapter-{chapter.id}">{idx}. {chapter.title}</a></li>')
            html_parts.append('</ul></div>')
        
        # Chapters
        for chapter in chapters:
            html_parts.append(f'''
                <div class="chapter" id="chapter-{chapter.id}">
                    <h2 class="chapter-title">{chapter.title}</h2>
            ''')
            
            # Chapter blocks
            for block in chapter.blocks.order_by('sequence_order'):
                content = block.processed_text or block.input_text or ''
                
                if block.block_type == 'TEXT':
                    html_parts.append(f'<div class="text-block">{content}</div>')
                elif block.block_type == 'IMAGE':
                    if block.generated_image_url:
                        html_parts.append(f'''
                            <div class="image-block">
                                <img src="{block.generated_image_url}" alt="{content[:100]}">
                                <p class="image-caption">{content}</p>
                            </div>
                        ''')
                elif block.block_type == 'HEADING':
                    html_parts.append(f'<h3 class="block-heading">{content}</h3>')
            
            html_parts.append('</div>')  # Close chapter
        
        html_parts.append('</body></html>')
        
        return '\n'.join(html_parts)
    
    def _get_pdf_css(self, book: BookProject, trim_specs: dict, margin_specs: dict, use_marketplace_specs: bool = True) -> str:
        """
        Get CSS styling for PDF with marketplace specifications
        
        Args:
            book: BookProject instance
            trim_specs: Trim size specifications from TRIM_SIZES
            margin_specs: Margin specifications from MARGIN_SPECS
            use_marketplace_specs: Apply marketplace-specific settings
        """
        
        if use_marketplace_specs:
            # Use marketplace specifications
            page_width = f"{trim_specs['width_inches']}in"
            page_height = f"{trim_specs['height_inches']}in"
            
            # Convert margin specs to CSS
            margin_top = f"{margin_specs['top_inches']}in"
            margin_bottom = f"{margin_specs['bottom_inches']}in"
            margin_outside = f"{margin_specs['outside_inches']}in"
            margin_inside = f"{margin_specs['inside_inches']}in"
            
            # Bleed (extends page size if enabled)
            bleed = f"{0.125 if book.include_bleed else 0.0}in"
        else:
            # Legacy A4 format
            page_width = "210mm"
            page_height = "297mm"
            margin_top = "2.5cm"
            margin_bottom = "2cm"
            margin_outside = "2cm"
            margin_inside = "2cm"
            bleed = "0"
        
        return f'''
            @page {{
                size: {page_width} {page_height};
                margin-top: {margin_top};
                margin-bottom: {margin_bottom};
                margin-left: {margin_inside};   /* Gutter/binding side */
                margin-right: {margin_outside};
                bleed: {bleed};
                marks: crop;  /* Add crop marks for professional printing */
                
                @top-center {{
                    content: string(book-title);
                    font-size: 9pt;
                    color: #666;
                }}
                
                @bottom-center {{
                    content: counter(page);
                    font-size: 9pt;
                }}
            }}
            
            @page :left {{
                margin-left: {margin_outside};
                margin-right: {margin_inside};  /* Flip margins for left pages */
            }}
            
            @page :right {{
                margin-left: {margin_inside};
                margin-right: {margin_outside};
            }}
            
            body {{
                font-family: 'Georgia', serif;
                font-size: 11pt;
                line-height: 1.6;
                color: #333;
            }}
            
            .cover-page {{
                page-break-after: always;
                text-align: center;
                padding-top: {float(trim_specs['height_inches']) / 3}in;
            }}
            
            .book-title {{
                font-size: 36pt;
                font-weight: bold;
                margin-bottom: 1cm;
                string-set: book-title content();
            }}
            
            .book-author {{
                font-size: 16pt;
                color: #666;
                margin-bottom: 2cm;
            }}
            
            .book-description {{
                font-size: 12pt;
                line-height: 1.8;
                max-width: {float(trim_specs['width_inches']) - 1}in;
                margin: 0 auto;
            }}
            
            .toc-page {{
                page-break-after: always;
                padding-top: 2cm;
            }}
            
            .toc-page h2 {{
                font-size: 24pt;
                margin-bottom: 1.5cm;
            }}
            
            .toc-page ul {{
                list-style: none;
                padding: 0;
            }}
            
            .toc-page li {{
                margin-bottom: 0.5cm;
                font-size: 12pt;
            }}
            
            .chapter {{
                page-break-before: always;
            }}
            
            .chapter-title {{
                font-size: 24pt;
                font-weight: bold;
                margin-bottom: 1.5cm;
                color: #1a1a1a;
            }}
            
            .text-block {{
                margin-bottom: 1cm;
                text-align: justify;
                hyphens: auto;
                -webkit-hyphens: auto;
            }}
            
            .text-block p {{
                margin-bottom: 0.8cm;
            }}
            
            .image-block {{
                margin: 1.5cm 0;
                text-align: center;
                page-break-inside: avoid;
            }}
            
            .image-block img {{
                max-width: 100%;
                max-height: {float(trim_specs['height_inches']) - 3}in;
            }}
            
            .image-caption {{
                font-size: 9pt;
                color: #666;
                font-style: italic;
                margin-top: 0.3cm;
            }}
            
            .block-heading {{
                font-size: 16pt;
                font-weight: bold;
                margin: 1cm 0 0.5cm 0;
                color: #2c3e50;
            }}
            
            /* Drop cap for first paragraph (optional style) */
            .chapter .text-block:first-of-type::first-letter {{
                font-size: 3em;
                float: left;
                line-height: 0.9;
                margin: 0.1em 0.1em 0 0;
                font-weight: bold;
            }}
            
            /* Prevent orphans and widows */
            p {{
                orphans: 3;
                widows: 3;
            }}
        '''
    
    def _estimate_pages(self, book: BookProject) -> int:
        """Estimate number of pages (rough calculation)"""
        words_per_page = 300
        return max(1, book.total_words // words_per_page)
    
    def generate_cover_template(self, book_id: int) -> dict:
        """
        Generate full-wrap cover template with spine calculation
        
        Returns template dimensions and guidelines for cover design.
        This generates a JSON/dict response that can be used by designers
        or AI image generation to create a print-ready cover.
        
        Args:
            book_id: ID of the book
            
        Returns:
            dict with cover dimensions, spine position, safe zones, and ISBN placement
        """
        book = BookProject.objects.get(id=book_id)
        
        # Ensure we have page count
        if book.estimated_pages == 0:
            book.update_statistics()
        
        page_count = max(24, book.estimated_pages)
        
        # Calculate cover dimensions
        cover_specs = calculate_cover_dimensions(
            trim_size_key=book.trim_size,
            page_count=page_count,
            paper_type=book.paper_type,
            include_bleed=book.include_bleed
        )
        
        # Update book with calculated spine width
        book.spine_width = cover_specs['spine']['width_inches']
        book.save(update_fields=['spine_width'])
        
        logger.info(f"Generated cover template for book {book.id}: {cover_specs['cover_width_inches']}\" × {cover_specs['cover_height_inches']}\"")
        
        return {
            'book_id': book.id,
            'book_title': book.title,
            'marketplace': book.marketplace,
            'trim_size': book.trim_size,
            'dimensions': {
                'total_width_inches': cover_specs['cover_width_inches'],
                'total_height_inches': cover_specs['cover_height_inches'],
                'total_width_pixels_300dpi': cover_specs['cover_width_pixels_300dpi'],
                'total_height_pixels_300dpi': cover_specs['cover_height_pixels_300dpi'],
            },
            'spine': {
                'width_inches': cover_specs['spine']['width_inches'],
                'start_position_inches': cover_specs['spine']['start_inches'],
                'end_position_inches': cover_specs['spine']['end_inches'],
                'note': 'Title and author name go on spine (if width >= 0.0625")',
            },
            'back_cover_safe_zone': cover_specs['safe_zones']['back_cover'],
            'front_cover_safe_zone': cover_specs['safe_zones']['front_cover'],
            'isbn_barcode': cover_specs['isbn_barcode_position'],
            'bleed': cover_specs['bleed_inches'],
            'warnings': cover_specs['warnings'],
            'design_notes': {
                'front_cover': 'Right third of template (after spine)',
                'spine': 'Center strip between front and back',
                'back_cover': 'Left third of template',
                'safe_zone': '0.125" from all edges and spine (no critical text/images)',
                'bleed': 'Extend background colors/images to bleed edge',
                'isbn': 'Must be on back cover, bottom right, readable',
                'spine_text_orientation': 'Read from top to bottom when book is spine-up',
            }
        }
