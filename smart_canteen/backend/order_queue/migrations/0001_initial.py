from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('orders', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='QueueToken',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('token_number', models.CharField(editable=False, max_length=20, unique=True)),
                ('status', models.CharField(choices=[('WAITING', 'Waiting'), ('PREPARING', 'Preparing'), ('READY', 'Ready for Pickup'), ('PICKED_UP', 'Picked Up'), ('CANCELLED', 'Cancelled')], default='WAITING', max_length=20)),
                ('estimated_wait_time_minutes', models.IntegerField(default=15)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('order', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='queue_token', to='orders.order')),
            ],
            options={
                'ordering': ['created_at'],
            },
        ),
    ]
