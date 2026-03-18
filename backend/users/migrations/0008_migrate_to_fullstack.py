"""
기존 FRONTEND/BACKEND education_track 을 FULLSTACK 으로 일괄 변환하는 데이터 마이그레이션
"""
from django.db import migrations


def migrate_track_to_fullstack(apps, schema_editor):
    User = apps.get_model('users', 'User')
    User.objects.filter(education_track__in=['FRONTEND', 'BACKEND']).update(
        education_track='FULLSTACK'
    )


def reverse_migration(apps, schema_editor):
    # 롤백 시 FULLSTACK → FRONTEND 로 복원 (임의 선택)
    User = apps.get_model('users', 'User')
    User.objects.filter(education_track='FULLSTACK').update(
        education_track='FRONTEND'
    )


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0007_alter_user_education_track'),
    ]

    operations = [
        migrations.RunPython(migrate_track_to_fullstack, reverse_migration),
    ]
