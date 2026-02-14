from django.db import migrations


def seed_roadmap(apps, schema_editor):
    RoadmapItem = apps.get_model("roadmap", "RoadmapItem")
    items = [
        # TOP half (1~6월)
        # row 0: 메인행
        {"half": "TOP", "row": 0, "col_start": 1, "col_span": 2, "label": "아기사자 모집", "bg_color": "#F8F8FC", "text_color": "#000000", "order": 0},
        {"half": "TOP", "row": 0, "col_start": 3, "col_span": 4, "label": "1학기 스터디", "bg_color": "#E7F4EB", "text_color": "#000000", "order": 1},
        # row 1: 상세행
        {"half": "TOP", "row": 1, "col_start": 3, "col_span": 2, "label": "아기사자 가입 마감", "bg_color": "#F8F8FC", "text_color": "#000000", "order": 0},
        {"half": "TOP", "row": 1, "col_start": 5, "col_span": 2, "label": "중앙 아이디어톤", "bg_color": "#F8F8FC", "text_color": "#000000", "order": 1},
        # row 2: 상세행
        {"half": "TOP", "row": 2, "col_start": 3, "col_span": 2, "label": "아기사자 전체 OT", "bg_color": "#F8F8FC", "text_color": "#000000", "order": 0},

        # BOTTOM half (7~12월)
        # row 0: 메인행
        {"half": "BOTTOM", "row": 0, "col_start": 1, "col_span": 2, "label": "중앙 해커톤", "bg_color": "#F8F8FC", "text_color": "#000000", "order": 0},
        {"half": "BOTTOM", "row": 0, "col_start": 3, "col_span": 4, "label": "2학기 스터디", "bg_color": "#E7F4EB", "text_color": "#000000", "order": 1},
        # row 1: 상세행
        {"half": "BOTTOM", "row": 1, "col_start": 3, "col_span": 4, "label": "권역별 연합 해커톤 & 기업 연계 해커톤", "bg_color": "#F8F8FC", "text_color": "#000000", "order": 0},
    ]
    for item in items:
        RoadmapItem.objects.create(**item)


def reverse_seed(apps, schema_editor):
    RoadmapItem = apps.get_model("roadmap", "RoadmapItem")
    RoadmapItem.objects.all().delete()


class Migration(migrations.Migration):
    dependencies = [
        ("roadmap", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_roadmap, reverse_seed),
    ]
