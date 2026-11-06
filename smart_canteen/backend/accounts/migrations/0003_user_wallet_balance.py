from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_alter_user_role'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='wallet_balance',
            field=models.DecimalField(decimal_places=2, default=500.0, max_digits=10),
        ),
    ]
