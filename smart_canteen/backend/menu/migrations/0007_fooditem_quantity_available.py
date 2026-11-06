from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('menu', '0006_rename_masala_dosa_to_puttu'),
    ]

    operations = [
        migrations.AddField(
            model_name='fooditem',
            name='quantity_available',
            field=models.PositiveIntegerField(default=50, help_text='Number of items available in stock'),
        ),
        migrations.AlterModelOptions(
            name='fooditem',
            options={'ordering': ['sort_order', 'id']},
        ),
    ]
