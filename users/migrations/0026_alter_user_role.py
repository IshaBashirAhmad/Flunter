# Generated by Django 4.2.11 on 2024-11-25 12:48

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0025_user_has_subscribed'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.CharField(choices=[('user', 'User'), ('company', 'Company'), ('contact', 'Contact'), ('admin', 'Admin'), ('auth_user', 'Auth_User'), ('super_admin', 'Super_Admin'), ('asb_admin', 'asb_admin')], default='user', max_length=20),
        ),
    ]
