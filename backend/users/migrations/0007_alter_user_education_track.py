from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0006_alter_user_education_track'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='education_track',
            field=models.CharField(
                blank=True,
                choices=[
                    ('PLANNING_DESIGN', '기획/디자인'),
                    ('FULLSTACK', '풀스택'),
                    ('AI_SERVER', 'AI'),
                ],
                default=None,
                max_length=30,
                null=True,
            ),
        ),
    ]
