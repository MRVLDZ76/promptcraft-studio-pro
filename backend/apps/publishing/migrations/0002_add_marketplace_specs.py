"""
Django migration to add marketplace and print specifications to BookProject model.

This migration adds:
- marketplace: Target platform (Amazon KDP, IngramSpark, etc.)
- trim_size: Book dimensions (6x9, 5x8, 8.5x11, etc.)
- paper_type: Paper type (white, cream, 50lb, 70lb)
- include_bleed: Add 0.125" bleed for printing
- color_interior: Full-color interior pages
- spine_width: Calculated spine width (auto-calculated)
- cover_template_url: Full-wrap cover template URL

Run this migration:
    python manage.py makemigrations publishing
    python manage.py migrate publishing
"""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('publishing', '0001_initial'),  # Update this to your latest migration
    ]

    operations = [
        migrations.AddField(
            model_name='bookproject',
            name='marketplace',
            field=models.CharField(
                default='universal',
                max_length=50,
                help_text='Target marketplace: amazon_kdp, ingram_spark, barnes_noble, lulu, universal'
            ),
        ),
        migrations.AddField(
            model_name='bookproject',
            name='trim_size',
            field=models.CharField(
                default='kdp_6x9',
                max_length=50,
                help_text='Book dimensions: kdp_6x9, kdp_5x8, kdp_8.5x11, etc. (see marketplace_config.py)'
            ),
        ),
        migrations.AddField(
            model_name='bookproject',
            name='paper_type',
            field=models.CharField(
                default='kdp_white',
                max_length=50,
                help_text='Paper type: kdp_white, kdp_cream, ingram_50lb, ingram_70lb'
            ),
        ),
        migrations.AddField(
            model_name='bookproject',
            name='include_bleed',
            field=models.BooleanField(
                default=True,
                help_text='Add 0.125 inch bleed for color printing (required for KDP color books)'
            ),
        ),
        migrations.AddField(
            model_name='bookproject',
            name='color_interior',
            field=models.BooleanField(
                default=False,
                help_text='Full-color interior (affects printing cost and bleed requirements)'
            ),
        ),
        migrations.AddField(
            model_name='bookproject',
            name='spine_width',
            field=models.FloatField(
                default=0.0,
                help_text='Calculated spine width in inches (auto-calculated based on page count)'
            ),
        ),
        migrations.AddField(
            model_name='bookproject',
            name='cover_template_url',
            field=models.URLField(
                blank=True,
                max_length=500,
                help_text='Generated full-wrap cover template (front + spine + back)'
            ),
        ),
    ]
