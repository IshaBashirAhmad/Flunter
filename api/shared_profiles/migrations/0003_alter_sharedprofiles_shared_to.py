# Generated by Django 4.2.11 on 2024-10-11 07:13

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('shared_profiles', '0002_alter_sharedprofiles_shared_from'),
    ]

    operations = [
        migrations.AlterField(
            model_name='sharedprofiles',
            name='shared_to',
            field=models.ForeignKey(blank=True, on_delete=django.db.models.deletion.CASCADE, related_name='shared_to', to=settings.AUTH_USER_MODEL),
        ),
    ]
