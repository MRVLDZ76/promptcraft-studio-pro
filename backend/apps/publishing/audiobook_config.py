"""
Audiobook Marketplace Configuration
====================================
Specifications for ACX/Audible, Findaway Voices, Author's Republic, and other platforms.

Critical for professional audiobook distribution:
- Audio format requirements (MP3, M4B, WAV)
- Bitrate and sample rate specifications
- Chapter marker requirements
- Metadata standards
- Retail sample generation
- Opening/closing credits
"""

# ========== AUDIOBOOK MARKETPLACES ==========

AUDIOBOOK_MARKETPLACES = {
    'acx_audible': {
        'name': 'ACX/Audible (Amazon)',
        'url': 'https://www.acx.com',
        'distribution': ['Audible', 'Amazon', 'iTunes'],
        'exclusive_required': False,  # Can choose exclusive or non-exclusive
        'royalty_exclusive': 0.40,    # 40% royalty if exclusive
        'royalty_non_exclusive': 0.25, # 25% if non-exclusive
        'upfront_payment': True,       # Supports per-finished-hour payment
        'requirements': {
            'format': 'MP3',
            'bitrate': '192 kbps CBR',  # Constant Bit Rate required
            'sample_rate': '44.1 kHz',
            'channels': 'Mono or Stereo',
            'bit_depth': '16-bit',
            'normalization': 'Peak between -3dB and -6dB',
            'noise_floor': '-60dB or lower',
            'room_tone': '0.5-1 second at start/end of each file',
            'chapter_length': '5-90 minutes recommended',
            'retail_sample': '5 minutes (first chapter usually)',
        },
        'file_naming': {
            'pattern': 'Title_01.mp3, Title_02.mp3, etc.',
            'opening_credits': 'Title_Opening.mp3 (optional)',
            'closing_credits': 'Title_Closing.mp3 (optional)',
            'retail_sample': 'Title_RetailSample.mp3',
        },
        'metadata_required': [
            'title', 'author', 'narrator', 'isbn', 'copyright_year',
            'publisher', 'genre', 'description', 'cover_image'
        ],
        'cover_requirements': {
            'format': 'JPG',
            'dimensions': '2400x2400 pixels (square)',
            'min_dimensions': '1200x1200',
            'max_file_size': '2 MB',
            'color_mode': 'RGB',
        },
    },
    'findaway_voices': {
        'name': 'Findaway Voices',
        'url': 'https://findawayvoices.com',
        'distribution': ['Spotify', 'Apple Books', 'Google Play', 'Kobo', 'library apps'],
        'exclusive_required': False,
        'royalty': 0.80,  # 80% net royalty (you keep 80%, they take 20%)
        'upfront_payment': False,
        'requirements': {
            'format': 'MP3 or M4B',
            'bitrate': '64-192 kbps',
            'sample_rate': '44.1 kHz or 48 kHz',
            'channels': 'Mono or Stereo',
            'bit_depth': '16-bit',
            'normalization': '-3dB to -6dB peak',
            'noise_floor': '-50dB or lower',
        },
        'cover_requirements': {
            'format': 'JPG or PNG',
            'dimensions': '3000x3000 pixels (square)',
            'min_dimensions': '1400x1400',
            'color_mode': 'RGB',
        },
    },
    'authors_republic': {
        'name': "Author's Republic",
        'url': 'https://www.authorsrepublic.com',
        'distribution': ['24+ retailers including Spotify, Apple, Audible, Scribd'],
        'exclusive_required': False,
        'royalty': 0.70,  # 70% of net
        'upfront_payment': False,
        'requirements': {
            'format': 'MP3, WAV, or M4B',
            'bitrate': '128-320 kbps',
            'sample_rate': '44.1 kHz',
            'channels': 'Mono or Stereo',
        },
    },
    'google_play': {
        'name': 'Google Play Audiobooks',
        'url': 'https://play.google.com/books/publish',
        'distribution': ['Google Play'],
        'exclusive_required': False,
        'royalty': 0.70,  # 70% of list price
        'requirements': {
            'format': 'MP3',
            'bitrate': '128 kbps or higher',
            'sample_rate': '44.1 kHz or 48 kHz',
            'channels': 'Mono or Stereo',
        },
    },
    'spotify_audiobooks': {
        'name': 'Spotify Audiobooks',
        'url': 'https://audiobooks.spotify.com',
        'distribution': ['Spotify'],
        'exclusive_required': False,
        'royalty': 'Variable (through Findaway)',
        'requirements': {
            'format': 'MP3 or M4B',
            'bitrate': '128-192 kbps',
            'sample_rate': '44.1 kHz',
            'channels': 'Mono or Stereo',
        },
        'note': 'Usually distributed through Findaway Voices aggregator',
    },
}


# ========== AUDIO FORMAT SPECIFICATIONS ==========

AUDIO_FORMATS = {
    'mp3_acx': {
        'name': 'MP3 (ACX Standard)',
        'extension': '.mp3',
        'codec': 'MP3',
        'bitrate': 192,  # kbps
        'bitrate_mode': 'CBR',  # Constant Bit Rate
        'sample_rate': 44100,   # Hz
        'channels': 2,  # Stereo (or 1 for mono)
        'bit_depth': 16,
        'recommended_for': ['ACX/Audible', 'Most platforms'],
        'file_size_per_hour': 90,  # MB (approximate)
    },
    'mp3_standard': {
        'name': 'MP3 (Standard Quality)',
        'extension': '.mp3',
        'codec': 'MP3',
        'bitrate': 128,
        'bitrate_mode': 'CBR',
        'sample_rate': 44100,
        'channels': 2,
        'bit_depth': 16,
        'recommended_for': ['Google Play', 'Spotify'],
        'file_size_per_hour': 60,  # MB
    },
    'mp3_high': {
        'name': 'MP3 (High Quality)',
        'extension': '.mp3',
        'codec': 'MP3',
        'bitrate': 320,
        'bitrate_mode': 'CBR',
        'sample_rate': 44100,
        'channels': 2,
        'bit_depth': 16,
        'recommended_for': ['Premium distributions'],
        'file_size_per_hour': 150,  # MB
    },
    'm4b': {
        'name': 'M4B (Audiobook Format)',
        'extension': '.m4b',
        'codec': 'AAC',
        'bitrate': 64,  # Lower bitrate, efficient for voice
        'bitrate_mode': 'VBR',  # Variable Bit Rate
        'sample_rate': 44100,
        'channels': 1,  # Mono (typical for audiobooks)
        'bit_depth': 16,
        'supports_chapters': True,
        'supports_bookmarks': True,
        'recommended_for': ['Apple Books', 'Findaway Voices'],
        'file_size_per_hour': 30,  # MB (much smaller!)
    },
    'wav_master': {
        'name': 'WAV (Master Quality)',
        'extension': '.wav',
        'codec': 'PCM',
        'bitrate': None,  # Uncompressed
        'sample_rate': 44100,
        'channels': 2,
        'bit_depth': 16,
        'recommended_for': ['Mastering', 'Archive'],
        'file_size_per_hour': 600,  # MB (uncompressed!)
    },
}


# ========== VOICE PROFILES & NARRATION STYLES ==========

NARRATOR_VOICES = {
    'openai_alloy': {
        'provider': 'OpenAI TTS',
        'voice_id': 'alloy',
        'gender': 'Neutral',
        'tone': 'Balanced, clear',
        'best_for': 'General narration, non-fiction',
        'acx_quality': 'Good',
    },
    'openai_echo': {
        'provider': 'OpenAI TTS',
        'voice_id': 'echo',
        'gender': 'Male',
        'tone': 'Smooth, authoritative',
        'best_for': 'Non-fiction, business books',
        'acx_quality': 'Good',
    },
    'openai_fable': {
        'provider': 'OpenAI TTS',
        'voice_id': 'fable',
        'gender': 'Male',
        'tone': 'Warm, storytelling',
        'best_for': 'Fiction, children\'s books',
        'acx_quality': 'Good',
    },
    'openai_onyx': {
        'provider': 'OpenAI TTS',
        'voice_id': 'onyx',
        'gender': 'Male',
        'tone': 'Deep, dramatic',
        'best_for': 'Thriller, mystery, drama',
        'acx_quality': 'Good',
    },
    'openai_nova': {
        'provider': 'OpenAI TTS',
        'voice_id': 'nova',
        'gender': 'Female',
        'tone': 'Energetic, young',
        'best_for': 'Young adult, contemporary fiction',
        'acx_quality': 'Good',
    },
    'openai_shimmer': {
        'provider': 'OpenAI TTS',
        'voice_id': 'shimmer',
        'gender': 'Female',
        'tone': 'Gentle, soothing',
        'best_for': 'Romance, self-help, meditation',
        'acx_quality': 'Good',
    },
}


# ========== AUDIO POST-PROCESSING REQUIREMENTS ==========

ACX_AUDIO_STANDARDS = {
    'peak_amplitude': {
        'min_db': -6.0,
        'max_db': -3.0,
        'note': 'Highest peak must be between -3dB and -6dB',
    },
    'rms_level': {
        'target_db': -18.0,
        'tolerance_db': 3.0,  # ±3dB
        'note': 'Average loudness (RMS) should be around -18dB to -23dB',
    },
    'noise_floor': {
        'max_db': -60.0,
        'note': 'Background noise must be -60dB or lower',
    },
    'room_tone': {
        'duration_seconds': (0.5, 1.0),
        'location': 'Start and end of each file',
        'note': 'Silence/room tone for smooth fades',
    },
    'clicks_and_pops': {
        'max_count': 0,
        'note': 'No audible clicks, pops, or mouth noises',
    },
    'format_check': {
        'sample_rate': 44100,
        'bit_depth': 16,
        'channels': [1, 2],  # Mono or stereo
        'bitrate': 192,  # kbps for MP3
    },
}


# ========== CHAPTER MARKER SPECIFICATIONS ==========

CHAPTER_MARKERS = {
    'acx_format': {
        'type': 'ID3 Tags',
        'supported_formats': ['MP3'],
        'marker_format': 'CHAP frame (ID3v2.3 or v2.4)',
        'required_metadata': ['chapter_title', 'start_time', 'end_time'],
    },
    'm4b_format': {
        'type': 'QuickTime Chapters',
        'supported_formats': ['M4B', 'M4A'],
        'marker_format': 'QuickTime chapter track',
        'required_metadata': ['chapter_title', 'start_time'],
        'supports_images': True,  # Chapter images
    },
    'naming_convention': {
        'pattern': 'Chapter {number}: {title}',
        'examples': [
            'Chapter 1: The Beginning',
            'Chapter 2: A New Discovery',
            'Opening Credits',
            'Closing Credits',
        ],
    },
}


# ========== RETAIL SAMPLE GENERATION ==========

def generate_retail_sample_spec(total_duration_minutes: float) -> dict:
    """
    Generate retail sample specifications based on total audiobook duration.
    
    ACX requires a 5-minute retail sample (usually from the beginning).
    Should include opening credits + first chapter (or part of it).
    
    Args:
        total_duration_minutes: Total audiobook duration in minutes
        
    Returns:
        dict with sample specifications
    """
    sample_duration_minutes = 5.0  # ACX standard
    
    return {
        'duration_minutes': sample_duration_minutes,
        'duration_seconds': sample_duration_minutes * 60,
        'source': 'First chapter (recommended)',
        'includes_opening_credits': True,
        'file_name': 'Title_RetailSample.mp3',
        'format': 'Same as main files (MP3 192kbps)',
        'note': 'Should be engaging and representative of narration quality',
        'acx_requirement': 'Mandatory for ACX/Audible distribution',
    }


# ========== OPENING & CLOSING CREDITS ==========

CREDITS_TEMPLATES = {
    'opening_credits': {
        'duration_seconds': (5, 15),
        'content_template': (
            'This is [Book Title], '
            'written by [Author Name], '
            'narrated by [Narrator Name], '
            'produced by [Publisher/Studio Name].'
        ),
        'music_allowed': True,
        'music_duration_max': 5,  # seconds
        'note': 'Keep brief and professional',
    },
    'closing_credits': {
        'duration_seconds': (5, 20),
        'content_template': (
            'This has been [Book Title], '
            'written by [Author Name], '
            'narrated by [Narrator Name]. '
            'Copyright [Year] by [Copyright Holder]. '
            'Produced by [Publisher/Studio Name].'
        ),
        'music_allowed': True,
        'additional_info': [
            'Thank listeners',
            'Request reviews',
            'Mention other books',
            'Copyright notice',
        ],
    },
}


# ========== FILE NAMING CONVENTIONS ==========

def generate_audiobook_filenames(book_title: str, chapter_count: int) -> dict:
    """
    Generate ACX-compliant file naming structure.
    
    Args:
        book_title: Book title (will be sanitized)
        chapter_count: Number of chapters
        
    Returns:
        dict with all filenames
    """
    # Sanitize title (remove special characters)
    import re
    safe_title = re.sub(r'[^\w\s-]', '', book_title).strip().replace(' ', '_')
    
    filenames = {
        'opening_credits': f'{safe_title}_Opening.mp3',
        'retail_sample': f'{safe_title}_RetailSample.mp3',
        'chapters': [
            f'{safe_title}_{str(i+1).zfill(2)}.mp3'
            for i in range(chapter_count)
        ],
        'closing_credits': f'{safe_title}_Closing.mp3',
    }
    
    return filenames


# ========== COST ESTIMATION ==========

def estimate_audiobook_cost(
    duration_hours: float,
    marketplace: str = 'acx_audible',
    production_method: str = 'ai_tts'
) -> dict:
    """
    Estimate audiobook production and distribution costs.
    
    Args:
        duration_hours: Total audiobook duration in hours
        marketplace: Target marketplace
        production_method: 'ai_tts', 'pfh' (per-finished-hour), or 'royalty_share'
        
    Returns:
        dict with cost breakdown
    """
    costs = {
        'ai_tts': {
            'cost_per_hour': 15,  # OpenAI TTS cost (approximate)
            'upfront': True,
            'ongoing': False,
        },
        'pfh': {
            'cost_per_hour': 250,  # Per-finished-hour narrator rate (average)
            'upfront': True,
            'ongoing': False,
        },
        'royalty_share': {
            'cost_per_hour': 0,
            'upfront': False,
            'ongoing': True,
            'note': 'Split royalties 50/50 with narrator',
        },
    }
    
    method = costs.get(production_method, costs['ai_tts'])
    production_cost = duration_hours * method['cost_per_hour']
    
    # Distribution costs
    marketplace_info = AUDIOBOOK_MARKETPLACES.get(marketplace, AUDIOBOOK_MARKETPLACES['acx_audible'])
    
    return {
        'production_cost': production_cost,
        'production_method': production_method,
        'duration_hours': duration_hours,
        'marketplace': marketplace_info['name'],
        'royalty_rate': marketplace_info.get('royalty_exclusive', marketplace_info.get('royalty', 0.40)),
        'distribution_fee': 0,  # Most platforms take from royalty, not upfront
        'total_upfront_cost': production_cost,
        'example_revenue': {
            'retail_price': 19.95,
            'per_sale': 19.95 * marketplace_info.get('royalty_exclusive', 0.40),
            'break_even_sales': production_cost / (19.95 * marketplace_info.get('royalty_exclusive', 0.40)) if production_cost > 0 else 0,
        }
    }


# ========== VALIDATION FUNCTIONS ==========

def validate_audio_specs(
    file_path: str,
    marketplace: str = 'acx_audible'
) -> list:
    """
    Validate audio file against marketplace requirements.
    
    This is a placeholder - actual implementation would use librosa or ffprobe.
    
    Args:
        file_path: Path to audio file
        marketplace: Target marketplace
        
    Returns:
        list of validation errors (empty if valid)
    """
    errors = []
    
    # Placeholder validation
    # In production, use:
    # - librosa for audio analysis
    # - ffprobe for format checking
    # - pydub for processing
    
    marketplace_reqs = AUDIOBOOK_MARKETPLACES.get(marketplace, {}).get('requirements', {})
    
    # Example checks:
    # - Sample rate matches
    # - Bitrate matches
    # - Peak levels within range
    # - Noise floor acceptable
    # - No clipping
    # - File naming correct
    
    return errors


# ========== HELPER FUNCTIONS ==========

def get_recommended_audiobook_settings(book_type: str, duration_hours: float) -> dict:
    """
    Get recommended settings based on book type.
    
    Args:
        book_type: 'NOVEL', 'NON_FICTION', 'CHILDREN', etc.
        duration_hours: Estimated audiobook duration
        
    Returns:
        dict with recommended settings
    """
    recommendations = {
        'NOVEL': {
            'marketplace': 'acx_audible',
            'format': 'mp3_acx',
            'voice': 'openai_fable',  # Storytelling voice
            'mono_stereo': 'stereo',
            'chapters_recommended': True,
        },
        'NON_FICTION': {
            'marketplace': 'acx_audible',
            'format': 'mp3_acx',
            'voice': 'openai_echo',  # Authoritative voice
            'mono_stereo': 'stereo',
            'chapters_recommended': True,
        },
        'CHILDREN': {
            'marketplace': 'acx_audible',
            'format': 'mp3_acx',
            'voice': 'openai_nova',  # Energetic voice
            'mono_stereo': 'stereo',
            'chapters_recommended': False,  # Shorter, fewer chapters
        },
        'SELF_HELP': {
            'marketplace': 'acx_audible',
            'format': 'mp3_acx',
            'voice': 'openai_shimmer',  # Soothing voice
            'mono_stereo': 'stereo',
            'chapters_recommended': True,
        },
    }
    
    return recommendations.get(book_type, recommendations['NOVEL'])


# ========== DISTRIBUTION STRATEGY ==========

DISTRIBUTION_STRATEGIES = {
    'wide_distribution': {
        'name': 'Wide Distribution (Non-Exclusive)',
        'platforms': ['acx_audible', 'findaway_voices', 'authors_republic'],
        'exclusive': False,
        'estimated_royalty': 0.25,  # Lower royalty but more platforms
        'best_for': 'Maximum reach, established authors',
    },
    'acx_exclusive': {
        'name': 'ACX Exclusive (Amazon only)',
        'platforms': ['acx_audible'],
        'exclusive': True,
        'estimated_royalty': 0.40,  # Higher royalty
        'best_for': 'New authors, Amazon-focused strategy',
        'bonus': 'Free promotional codes, better discoverability',
    },
    'premium_only': {
        'name': 'Premium Platforms Only',
        'platforms': ['acx_audible', 'google_play', 'spotify_audiobooks'],
        'exclusive': False,
        'estimated_royalty': 0.30,
        'best_for': 'High-quality productions',
    },
}
