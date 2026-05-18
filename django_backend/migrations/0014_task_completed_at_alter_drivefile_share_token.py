

from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ('django_backend', '0013_generalsettings_email_notifications_enabled_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='task',
            name='completed_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='drivefile',
            name='share_token',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.CreateModel(
            name='UserChatSettings',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('chat_push_enabled', models.BooleanField(default=True)),
                ('chat_sounds_enabled', models.BooleanField(default=True)),
                ('chat_email_alerts', models.BooleanField(default=False)),
                ('read_receipts', models.BooleanField(default=True)),
                ('show_last_seen', models.BooleanField(default=True)),
                ('auto_download_media', models.BooleanField(default=False)),
                ('enter_to_send', models.BooleanField(default=True)),
                ('typing_indicators', models.BooleanField(default=True)),
                ('dark_mode', models.BooleanField(default=False)),
                ('compact_mode', models.BooleanField(default=False)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='chat_settings', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.AddField(
            model_name='drivefile',
            name='is_favorite',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='drivefile',
            name='sharing_level',
            field=models.CharField(default='RESTRICTED', max_length=20),
        ),
        migrations.AddField(
            model_name='drivefile',
            name='link_permission',
            field=models.CharField(default='VIEW', max_length=50),
        ),
        migrations.AddField(
            model_name='chatroom',
            name='last_message',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='last_message_of_room', to='django_backend.chatmessage'),
        ),
        migrations.AddField(
            model_name='chatmessage',
            name='share_token',
            field=models.CharField(blank=True, db_index=True, max_length=100, null=True, unique=True),
        ),
        migrations.AddField(
            model_name='fileaccess',
            name='access_source',
            field=models.CharField(default='MANUAL', max_length=10),
        ),
    ]
 
    
