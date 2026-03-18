"""
1. Quiz/QnAPost track choices: FRONTEND/BACKEND → FULLSTACK
2. 기존 FRONTEND/BACKEND 데이터 → FULLSTACK 으로 변환
3. 출석부 모델 추가 (AttendanceSession, AttendanceRecord)
"""
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def migrate_quiz_qna_to_fullstack(apps, schema_editor):
    Quiz = apps.get_model('sessionsapp', 'Quiz')
    QnAPost = apps.get_model('sessionsapp', 'QnAPost')
    Quiz.objects.filter(track__in=['FRONTEND', 'BACKEND']).update(track='FULLSTACK')
    QnAPost.objects.filter(track__in=['FRONTEND', 'BACKEND']).update(track='FULLSTACK')


def reverse_migration(apps, schema_editor):
    Quiz = apps.get_model('sessionsapp', 'Quiz')
    QnAPost = apps.get_model('sessionsapp', 'QnAPost')
    Quiz.objects.filter(track='FULLSTACK').update(track='FRONTEND')
    QnAPost.objects.filter(track='FULLSTACK').update(track='FRONTEND')


class Migration(migrations.Migration):

    dependencies = [
        ('sessionsapp', '0002_alter_announcement_track_alter_assignment_track'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # Quiz track choices 변경
        migrations.AlterField(
            model_name='quiz',
            name='track',
            field=models.CharField(
                choices=[('FULLSTACK', '풀스택')],
                max_length=30,
            ),
        ),
        # QnAPost track choices 변경
        migrations.AlterField(
            model_name='qnapost',
            name='track',
            field=models.CharField(
                choices=[('FULLSTACK', '풀스택')],
                max_length=30,
            ),
        ),
        # 기존 FRONTEND/BACKEND 데이터 → FULLSTACK 변환
        migrations.RunPython(migrate_quiz_qna_to_fullstack, reverse_migration),
        # AttendanceSession 모델 추가
        migrations.CreateModel(
            name='AttendanceSession',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('track', models.CharField(
                    choices=[
                        ('FULLSTACK', '풀스택'),
                        ('AI_SERVER', 'AI'),
                        ('PLANNING_DESIGN', '기획/디자인'),
                    ],
                    max_length=30,
                )),
                ('title', models.CharField(max_length=200)),
                ('date', models.DateField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('created_by', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='attendance_sessions',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'ordering': ['-date', '-created_at'],
            },
        ),
        # AttendanceRecord 모델 추가
        migrations.CreateModel(
            name='AttendanceRecord',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('status', models.CharField(
                    choices=[('PRESENT', '출석'), ('ABSENT', '결석'), ('LATE', '지각')],
                    default='ABSENT',
                    max_length=10,
                )),
                ('marked_at', models.DateTimeField(auto_now=True)),
                ('session', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='records',
                    to='sessionsapp.attendancesession',
                )),
                ('student', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='attendance_records',
                    to=settings.AUTH_USER_MODEL,
                )),
                ('marked_by', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='marked_attendances',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'ordering': ['student__name'],
                'unique_together': {('session', 'student')},
            },
        ),
    ]
