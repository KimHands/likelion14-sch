from django.db import migrations

def forwards(apps, schema_editor):
    Application = apps.get_model("applications", "Application")
    # ✅ 기존 FULLSTACK 데이터가 있으면 FRONTEND로 변경 (원하면 BACKEND로 바꿔도 됨)
    Application.objects.filter(track="FULLSTACK").update(track="FRONTEND")

class Migration(migrations.Migration):

    dependencies = [
        ("applications", "0003_alter_application_track"),
    ]

    operations = [
        migrations.RunPython(forwards),
    ]