from django.db import migrations


def rename_masala_dosa_to_puttu(apps, schema_editor):
    FoodItem = apps.get_model('menu', 'FoodItem')
    FoodItem.objects.filter(name='Masala Dosa').update(name='Puttu')


def reverse_rename(apps, schema_editor):
    FoodItem = apps.get_model('menu', 'FoodItem')
    FoodItem.objects.filter(name='Puttu').update(name='Masala Dosa')


class Migration(migrations.Migration):

    dependencies = [
        ('menu', '0005_alter_fooditem_options'),
    ]

    operations = [
        migrations.RunPython(rename_masala_dosa_to_puttu, reverse_code=reverse_rename),
    ]
