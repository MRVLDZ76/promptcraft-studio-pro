"""
Publishing Studio Services
"""

# Conditional imports to avoid circular dependencies
def get_pdf_service():
    from .pdf_export import PDFExportService
    return PDFExportService

def get_epub_service():
    from .epub_export import EPUBExportService
    return EPUBExportService

def get_html_service():
    from .html_export import HTMLExportService
    return HTMLExportService

# Legacy direct imports (use sparingly to avoid circular imports)
try:
    from .pdf_export import PDFExportService
    from .epub_export import EPUBExportService
    from .html_export import HTMLExportService
    __all__ = ['PDFExportService', 'EPUBExportService', 'HTMLExportService']
except ImportError:
    # Graceful degradation if dependencies not installed
    __all__ = []
