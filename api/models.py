from django.db import models
from django.contrib.auth.models import User

class Drawing(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    image = models.JSONField()  # Store base64 image as JSON
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Drawing by {self.user.username} on {self.created_at}"

class Comment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    drawing = models.ForeignKey(Drawing, on_delete=models.CASCADE, related_name="comments", null=True)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comment by {self.user.username} on {self.drawing.id}"
