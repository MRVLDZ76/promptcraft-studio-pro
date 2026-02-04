#!/usr/bin/env python
"""
Audiobook Setup Verification Script
====================================
Checks if all required dependencies for audiobook generation are installed.
Run: python verify_audiobook_setup.py
"""

import sys
import subprocess
from pathlib import Path


def check_python_package(package_name, import_name=None):
    """Check if a Python package is installed"""
    if import_name is None:
        import_name = package_name
    
    try:
        __import__(import_name)
        print(f"✓ {package_name} is installed")
        return True
    except ImportError:
        print(f"✗ {package_name} is NOT installed")
        return False


def check_ffmpeg():
    """Check if ffmpeg is installed"""
    try:
        result = subprocess.run(
            ['ffmpeg', '-version'],
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            version_line = result.stdout.split('\n')[0]
            print(f"✓ ffmpeg is installed ({version_line})")
            return True
    except FileNotFoundError:
        print("✗ ffmpeg is NOT installed")
        print("  Install instructions:")
        print("  - Ubuntu/Debian: sudo apt-get install ffmpeg")
        print("  - macOS: brew install ffmpeg")
        print("  - Windows: https://ffmpeg.org/download.html")
        return False


def check_audiobook_config():
    """Check if audiobook_config.py exists"""
    config_path = Path(__file__).parent / 'apps' / 'publishing' / 'audiobook_config.py'
    if config_path.exists():
        print(f"✓ audiobook_config.py exists")
        return True
    else:
        print(f"✗ audiobook_config.py NOT found at {config_path}")
        return False


def check_audio_export_service():
    """Check if audio_export.py exists"""
    service_path = Path(__file__).parent / 'apps' / 'publishing' / 'services' / 'audio_export.py'
    if service_path.exists():
        print(f"✓ audio_export.py service exists")
        return True
    else:
        print(f"✗ audio_export.py NOT found at {service_path}")
        return False


def main():
    """Run all checks"""
    print("=" * 60)
    print("Audiobook Setup Verification")
    print("=" * 60)
    
    all_good = True
    
    print("\n1. Checking Python Dependencies:")
    print("-" * 60)
    all_good &= check_python_package('pydub')
    all_good &= check_python_package('mutagen')
    all_good &= check_python_package('gTTS', 'gtts')
    all_good &= check_python_package('numpy')
    all_good &= check_python_package('scipy')
    
    print("\n2. Checking System Dependencies:")
    print("-" * 60)
    all_good &= check_ffmpeg()
    
    print("\n3. Checking Configuration Files:")
    print("-" * 60)
    all_good &= check_audiobook_config()
    all_good &= check_audio_export_service()
    
    print("\n" + "=" * 60)
    if all_good:
        print("✓ ALL CHECKS PASSED - Audiobook export is ready!")
        print("=" * 60)
        return 0
    else:
        print("✗ SOME CHECKS FAILED - Install missing dependencies")
        print("=" * 60)
        print("\nTo install Python packages:")
        print("  pip install -r audiobook_requirements.txt")
        print("\nTo install ffmpeg:")
        print("  Ubuntu/Debian: sudo apt-get install ffmpeg")
        print("  macOS: brew install ffmpeg")
        print("  Windows: https://ffmpeg.org/download.html")
        return 1


if __name__ == '__main__':
    sys.exit(main())
