from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('menu', '0002_add_canteen_food_items'),
    ]

    operations = [
        migrations.AddField(
            model_name='fooditem',
            name='sort_order',
            field=models.IntegerField(default=0, help_text='Display order (lower = shown first)'),
        ),
        migrations.AlterModelOptions(
            name='fooditem',
            options={'ordering': ['sort_order', 'id']},
        ),
    ]
