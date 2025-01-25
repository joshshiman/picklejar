# Generated by Django 4.2.18 on 2025-01-25 23:15

from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('apps', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='hangout',
            name='deadline',
            field=models.DateTimeField(null=True),
        ),
        migrations.AddField(
            model_name='hangout',
            name='status',
            field=models.CharField(choices=[('idea collection', 'Idea Collection'), ('voting', 'Voting'), ('completed', 'Completed')], default='idea collection', max_length=50),
        ),
        migrations.AddField(
            model_name='idea',
            name='session_id',
            field=models.CharField(max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='vote',
            name='session_id',
            field=models.CharField(max_length=255, null=True),
        ),
        migrations.AlterField(
            model_name='hangout',
            name='id',
            field=models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False),
        ),
        migrations.AlterField(
            model_name='idea',
            name='id',
            field=models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False),
        ),
        migrations.AlterField(
            model_name='vote',
            name='id',
            field=models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False),
        ),
    ]
