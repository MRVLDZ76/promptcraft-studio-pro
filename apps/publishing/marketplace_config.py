"""
Marketplace Configuration for Book Publishing
==============================================
Specifications for Amazon KDP, IngramSpark, Barnes & Noble Press, and other platforms.

Critical for professional print-on-demand publishing:
- Trim sizes (book dimensions in inches)
- Bleed requirements (extends images beyond trim edge)
- Margin requirements (gutter/binding considerations)
- Spine width calculation (based on page count and paper type)
- Cover specifications (full-wrap template dimensions)
"""

# ========== TRIM SIZES ==========

TRIM_SIZES = {
    # Amazon KDP Standard Sizes
    'kdp_6x9': {
        'name': '6" × 9" (Standard Fiction)',
        'width_inches': 6.0,
        'height_inches': 9.0,
        'width_points': 432,  # 6 * 72 DPI
        'height_points': 648,  # 9 * 72 DPI
        'marketplace': 'Amazon KDP',
        'best_for': 'Novels, memoirs, non-fiction',
        'popular': True,
    },
    'kdp_5x8': {
        'name': '5" × 8" (Compact)',
        'width_inches': 5.0,
        'height_inches': 8.0,
        'width_points': 360,
        'height_points': 576,
        'marketplace': 'Amazon KDP',
        'best_for': 'Short novels, poetry, essays',
        'popular': True,
    },
    'kdp_5.5x8.5': {
        'name': '5.5" × 8.5" (Digest)',
        'width_inches': 5.5,
        'height_inches': 8.5,
        'width_points': 396,
        'height_points': 612,
        'marketplace': 'Amazon KDP',
        'best_for': 'Trade paperbacks, textbooks',
        'popular': True,
    },
    'kdp_5.25x8': {
        'name': '5.25" × 8" (Mass Market)',
        'width_inches': 5.25,
        'height_inches': 8.0,
        'width_points': 378,
        'height_points': 576,
        'marketplace': 'Amazon KDP',
        'best_for': 'Mass market paperbacks',
        'popular': False,
    },
    'kdp_7x10': {
        'name': '7" × 10" (Large Format)',
        'width_inches': 7.0,
        'height_inches': 10.0,
        'width_points': 504,
        'height_points': 720,
        'marketplace': 'Amazon KDP',
        'best_for': 'Workbooks, textbooks, cookbooks',
        'popular': True,
    },
    'kdp_8x10': {
        'name': '8" × 10" (Premium)',
        'width_inches': 8.0,
        'height_inches': 10.0,
        'width_points': 576,
        'height_points': 720,
        'marketplace': 'Amazon KDP',
        'best_for': 'Photography books, art books',
        'popular': False,
    },
    'kdp_8.5x11': {
        'name': '8.5" × 11" (Letter)',
        'width_inches': 8.5,
        'height_inches': 11.0,
        'width_points': 612,
        'height_points': 792,
        'marketplace': 'Amazon KDP',
        'best_for': 'Workbooks, manuals, journals',
        'popular': True,
    },
    
    # IngramSpark (wider selection)
    'ingram_4x7': {
        'name': '4" × 7" (Pocket)',
        'width_inches': 4.0,
        'height_inches': 7.0,
        'width_points': 288,
        'height_points': 504,
        'marketplace': 'IngramSpark',
        'best_for': 'Pocket guides, mini books',
        'popular': False,
    },
    'ingram_8.5x8.5': {
        'name': '8.5" × 8.5" (Square)',
        'width_inches': 8.5,
        'height_inches': 8.5,
        'width_points': 612,
        'height_points': 612,
        'marketplace': 'IngramSpark',
        'best_for': 'Children\'s books, photo books',
        'popular': True,
    },
    
    # Generic/Universal (compatible with multiple platforms)
    'universal_6x9': {
        'name': '6" × 9" (Universal)',
        'width_inches': 6.0,
        'height_inches': 9.0,
        'width_points': 432,
        'height_points': 648,
        'marketplace': 'All Platforms',
        'best_for': 'Most versatile option',
        'popular': True,
    },
}


# ========== BLEED SETTINGS ==========

BLEED_SPECS = {
    'kdp_color': {
        'bleed_inches': 0.125,  # 1/8 inch bleed for color interiors
        'bleed_points': 9,      # 0.125 * 72 DPI
        'required': True,
        'note': 'Required for full-color or premium color books',
    },
    'kdp_bw': {
        'bleed_inches': 0.0,    # No bleed for black & white
        'bleed_points': 0,
        'required': False,
        'note': 'Black & white interiors do not require bleed',
    },
    'ingram_standard': {
        'bleed_inches': 0.125,
        'bleed_points': 9,
        'required': True,
        'note': 'IngramSpark requires 0.125" bleed on all sides',
    },
}


# ========== MARGIN REQUIREMENTS ==========

MARGIN_SPECS = {
    'kdp_minimum': {
        'outside_inches': 0.25,   # Outside margin (away from binding)
        'inside_inches': 0.375,   # Inside margin (gutter/binding side)
        'top_inches': 0.25,
        'bottom_inches': 0.25,
        'outside_points': 18,
        'inside_points': 27,
        'top_points': 18,
        'bottom_points': 18,
        'note': 'Minimum margins to prevent text cutoff',
    },
    'kdp_recommended': {
        'outside_inches': 0.5,
        'inside_inches': 0.625,   # Wider gutter for binding
        'top_inches': 0.5,
        'bottom_inches': 0.5,
        'outside_points': 36,
        'inside_points': 45,
        'top_points': 36,
        'bottom_points': 36,
        'note': 'Recommended margins for professional appearance',
    },
}


# ========== PAPER & SPINE CALCULATION ==========

PAPER_TYPES = {
    'kdp_white': {
        'name': 'White Paper',
        'thickness_inches': 0.0025,  # Inches per sheet (60# paper)
        'ppi': 444,                   # Pages per inch (1 / (0.0025 * 2))
        'cost_multiplier': 1.0,
        'available_on': ['Amazon KDP'],
    },
    'kdp_cream': {
        'name': 'Cream Paper',
        'thickness_inches': 0.0027,  # Slightly thicker
        'ppi': 411,
        'cost_multiplier': 1.05,
        'available_on': ['Amazon KDP'],
    },
    'ingram_50lb': {
        'name': 'Standard 50lb White',
        'thickness_inches': 0.0024,
        'ppi': 462,
        'cost_multiplier': 1.0,
        'available_on': ['IngramSpark'],
    },
    'ingram_70lb': {
        'name': 'Premium 70lb White',
        'thickness_inches': 0.0034,
        'ppi': 326,
        'cost_multiplier': 1.3,
        'available_on': ['IngramSpark'],
    },
}

def calculate_spine_width(page_count: int, paper_type: str = 'kdp_white') -> dict:
    """
    Calculate spine width for perfect-bound books.
    
    Formula: spine_width = (page_count / ppi) + cover_thickness
    
    Args:
        page_count: Total number of pages (must be even, minimum 24 pages for KDP)
        paper_type: Key from PAPER_TYPES dict
        
    Returns:
        dict with spine_width_inches, spine_width_points, warnings
    """
    paper = PAPER_TYPES.get(paper_type, PAPER_TYPES['kdp_white'])
    
    # Validate page count
    warnings = []
    if page_count < 24:
        warnings.append('KDP requires minimum 24 pages for perfect binding')
    if page_count % 2 != 0:
        warnings.append('Page count should be even (books are printed in signatures)')
    if page_count > 828:
        warnings.append('KDP maximum is 828 pages for most trim sizes')
    
    # Calculate spine width (interior pages only, cover adds ~0.01")
    spine_width_inches = (page_count / paper.get('ppi', 444)) + 0.01
    spine_width_points = spine_width_inches * 72
    
    # Minimum spine width for printing barcode/title
    if spine_width_inches < 0.0625:  # 1/16 inch
        warnings.append('Spine too thin (<0.0625") - title/barcode may not print')
    
    return {
        'spine_width_inches': round(spine_width_inches, 4),
        'spine_width_points': round(spine_width_points, 2),
        'paper_type': paper['name'],
        'page_count': page_count,
        'warnings': warnings,
    }


# ========== COVER SPECIFICATIONS ==========

def calculate_cover_dimensions(trim_size_key: str, page_count: int, paper_type: str = 'kdp_white', include_bleed: bool = True) -> dict:
    """
    Calculate full-wrap cover dimensions (front + spine + back).
    
    Args:
        trim_size_key: Key from TRIM_SIZES dict (e.g., 'kdp_6x9')
        page_count: Total interior page count
        paper_type: Key from PAPER_TYPES dict
        include_bleed: Add 0.125" bleed on all outer edges
        
    Returns:
        dict with cover dimensions, spine position, and template specs
    """
    trim = TRIM_SIZES.get(trim_size_key, TRIM_SIZES['kdp_6x9'])
    spine = calculate_spine_width(page_count, paper_type)
    bleed = 0.125 if include_bleed else 0.0
    
    # Full cover width = back + spine + front + bleed on both sides
    cover_width_inches = (trim['width_inches'] * 2) + spine['spine_width_inches'] + (bleed * 2)
    cover_height_inches = trim['height_inches'] + (bleed * 2)
    
    cover_width_points = cover_width_inches * 72
    cover_height_points = cover_height_inches * 72
    
    # Spine position (from left edge)
    spine_start_inches = trim['width_inches'] + bleed
    spine_end_inches = spine_start_inches + spine['spine_width_inches']
    
    # Safe zones (0.125" from all edges and spine)
    safe_zone_inches = 0.125
    
    return {
        'cover_width_inches': round(cover_width_inches, 3),
        'cover_height_inches': round(cover_height_inches, 3),
        'cover_width_points': round(cover_width_points, 1),
        'cover_height_points': round(cover_height_points, 1),
        'cover_width_pixels_300dpi': int(cover_width_inches * 300),  # For image generation
        'cover_height_pixels_300dpi': int(cover_height_inches * 300),
        'spine': {
            'width_inches': spine['spine_width_inches'],
            'start_inches': round(spine_start_inches, 3),
            'end_inches': round(spine_end_inches, 3),
            'start_points': round(spine_start_inches * 72, 1),
            'end_points': round(spine_end_inches * 72, 1),
        },
        'bleed_inches': bleed,
        'safe_zones': {
            'back_cover': {
                'left': bleed + safe_zone_inches,
                'right': spine_start_inches - safe_zone_inches,
                'top': bleed + safe_zone_inches,
                'bottom': cover_height_inches - bleed - safe_zone_inches,
            },
            'front_cover': {
                'left': spine_end_inches + safe_zone_inches,
                'right': cover_width_inches - bleed - safe_zone_inches,
                'top': bleed + safe_zone_inches,
                'bottom': cover_height_inches - bleed - safe_zone_inches,
            },
        },
        'isbn_barcode_position': {
            'x_inches': cover_width_inches - bleed - 2.0,  # 2" from right edge
            'y_inches': bleed + 0.3,  # 0.3" from bottom
            'width_inches': 1.5,
            'height_inches': 1.0,
            'note': 'Bottom right of back cover',
        },
        'warnings': spine['warnings'],
        'trim_size': trim['name'],
    }


# ========== MARKETPLACE PRESETS ==========

MARKETPLACE_PRESETS = {
    'amazon_kdp': {
        'name': 'Amazon KDP (Kindle Direct Publishing)',
        'url': 'https://kdp.amazon.com',
        'recommended_trim_sizes': ['kdp_6x9', 'kdp_5x8', 'kdp_5.5x8.5', 'kdp_8.5x11'],
        'paper_types': ['kdp_white', 'kdp_cream'],
        'default_trim': 'kdp_6x9',
        'default_paper': 'kdp_white',
        'supports_color': True,
        'min_pages': 24,
        'max_pages': 828,
        'isbn_required': False,  # KDP can assign free ISBN
        'pdf_requirements': {
            'format': 'PDF/X-1a:2001 or PDF/X-3:2002',
            'resolution': '300 DPI minimum',
            'color_mode': 'CMYK or RGB',
            'fonts': 'Embedded/subsetted',
            'transparency': 'Flattened',
        },
        'epub_requirements': {
            'version': 'EPUB 2.0.1 or 3.0',
            'cover_size': 'Min 1600px on shortest side, 2560px recommended',
            'toc_required': True,
        },
    },
    'ingram_spark': {
        'name': 'IngramSpark (Professional Distribution)',
        'url': 'https://www.ingramspark.com',
        'recommended_trim_sizes': ['kdp_6x9', 'kdp_5.5x8.5', 'ingram_8.5x8.5'],
        'paper_types': ['ingram_50lb', 'ingram_70lb'],
        'default_trim': 'kdp_6x9',
        'default_paper': 'ingram_50lb',
        'supports_color': True,
        'min_pages': 18,
        'max_pages': 800,
        'isbn_required': True,  # Must provide your own ISBN
        'pdf_requirements': {
            'format': 'PDF/X-1a:2001',
            'resolution': '300 DPI',
            'color_mode': 'CMYK only',
            'fonts': 'Embedded',
            'transparency': 'Flattened',
            'bleed_required': True,
        },
    },
    'barnes_noble': {
        'name': 'Barnes & Noble Press',
        'url': 'https://press.barnesandnoble.com',
        'recommended_trim_sizes': ['kdp_6x9', 'kdp_5x8', 'kdp_8.5x11'],
        'paper_types': ['kdp_white', 'kdp_cream'],
        'default_trim': 'kdp_6x9',
        'default_paper': 'kdp_white',
        'supports_color': True,
        'min_pages': 24,
        'max_pages': 800,
        'isbn_required': False,  # Free ISBN provided
        'pdf_requirements': {
            'format': 'PDF',
            'resolution': '300 DPI',
            'color_mode': 'CMYK or RGB',
            'fonts': 'Embedded',
        },
    },
    'lulu': {
        'name': 'Lulu (Self-Publishing)',
        'url': 'https://www.lulu.com',
        'recommended_trim_sizes': ['kdp_6x9', 'kdp_5.5x8.5', 'kdp_8.5x11'],
        'paper_types': ['kdp_white', 'kdp_cream'],
        'default_trim': 'kdp_6x9',
        'default_paper': 'kdp_white',
        'supports_color': True,
        'min_pages': 2,
        'max_pages': 800,
        'isbn_required': False,
        'pdf_requirements': {
            'format': 'PDF',
            'resolution': '300 DPI',
            'color_mode': 'CMYK or RGB',
            'fonts': 'Embedded',
        },
    },
    'universal': {
        'name': 'Universal (Compatible with Most Platforms)',
        'recommended_trim_sizes': ['universal_6x9', 'kdp_5.5x8.5', 'kdp_8.5x11'],
        'paper_types': ['kdp_white'],
        'default_trim': 'universal_6x9',
        'default_paper': 'kdp_white',
        'supports_color': True,
        'min_pages': 24,
        'max_pages': 800,
        'isbn_required': False,
        'pdf_requirements': {
            'format': 'PDF',
            'resolution': '300 DPI',
            'color_mode': 'RGB',
            'fonts': 'Embedded',
        },
    },
}


# ========== HELPER FUNCTIONS ==========

def get_recommended_settings(marketplace: str, genre: str = None) -> dict:
    """
    Get recommended settings for a specific marketplace and genre.
    
    Args:
        marketplace: Key from MARKETPLACE_PRESETS
        genre: Optional genre hint (e.g., 'novel', 'textbook', 'children')
        
    Returns:
        dict with recommended trim_size, paper_type, and notes
    """
    preset = MARKETPLACE_PRESETS.get(marketplace, MARKETPLACE_PRESETS['universal'])
    
    # Genre-specific recommendations
    trim_recommendations = {
        'novel': 'kdp_6x9',
        'fiction': 'kdp_6x9',
        'memoir': 'kdp_6x9',
        'poetry': 'kdp_5x8',
        'textbook': 'kdp_8.5x11',
        'workbook': 'kdp_8.5x11',
        'children': 'ingram_8.5x8.5',
        'photo': 'kdp_8x10',
        'cookbook': 'kdp_7x10',
    }
    
    recommended_trim = trim_recommendations.get(genre, preset['default_trim'])
    
    return {
        'marketplace': preset['name'],
        'trim_size': recommended_trim,
        'paper_type': preset['default_paper'],
        'trim_details': TRIM_SIZES[recommended_trim],
        'paper_details': PAPER_TYPES[preset['default_paper']],
        'min_pages': preset['min_pages'],
        'max_pages': preset['max_pages'],
        'isbn_required': preset['isbn_required'],
        'notes': f"Recommended for {genre or 'general'} on {preset['name']}",
    }


def validate_book_specs(page_count: int, trim_size: str, marketplace: str) -> list:
    """
    Validate book specifications against marketplace requirements.
    
    Returns:
        list of validation errors (empty list if all valid)
    """
    errors = []
    
    preset = MARKETPLACE_PRESETS.get(marketplace, MARKETPLACE_PRESETS['universal'])
    trim = TRIM_SIZES.get(trim_size)
    
    if not trim:
        errors.append(f'Invalid trim size: {trim_size}')
        return errors
    
    # Check page count
    if page_count < preset['min_pages']:
        errors.append(f'{preset["name"]} requires minimum {preset["min_pages"]} pages (you have {page_count})')
    
    if page_count > preset['max_pages']:
        errors.append(f'{preset["name"]} maximum is {preset["max_pages"]} pages (you have {page_count})')
    
    # Check if trim size is recommended for marketplace
    if trim_size not in preset['recommended_trim_sizes']:
        errors.append(f'{trim["name"]} is not a standard size for {preset["name"]}')
    
    return errors
