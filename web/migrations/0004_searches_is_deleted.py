# Generated by Django 4.2.11 on 2024-05-20 07:52

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('web', '0003_searches_number_of_results'),
    ]

    operations = [
        migrations.AddField(
            model_name='searches',
            name='is_deleted',
            field=models.BooleanField(default=False),
        ),
    ]
