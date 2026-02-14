from django.db import models


class RoadmapItem(models.Model):
    HALF_CHOICES = [
        ("TOP", "1~6월"),
        ("BOTTOM", "7~12월"),
    ]

    half = models.CharField(max_length=6, choices=HALF_CHOICES)
    row = models.IntegerField(default=0, help_text="0=메인행, 1+=상세행")
    col_start = models.IntegerField(help_text="시작 열 (1-6)")
    col_span = models.IntegerField(default=1, help_text="열 너비 (1-6)")
    label = models.CharField(max_length=100)
    bg_color = models.CharField(max_length=7, default="#F8F8FC")
    text_color = models.CharField(max_length=7, default="#000000")
    order = models.IntegerField(default=0, help_text="같은 half+row 내 정렬 순서")

    class Meta:
        ordering = ["half", "row", "order"]

    def __str__(self):
        return f"[{self.half} r{self.row}] {self.label}"
