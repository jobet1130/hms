from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import secrets

class APIToken(models.Model):
    """
    Model for API authentication tokens
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='api_tokens')
    token = models.CharField(max_length=128, unique=True, db_index=True)
    name = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    last_used = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'auth_api_token'
        verbose_name = 'API Token'
        verbose_name_plural = 'API Tokens'
        ordering = ['-created_at']

    def __str__(self):
        user_username = getattr(self.user, 'username', 'Unknown') if self.user else 'Unknown'
        return f"{user_username} - {self.name}"

    def save(self, *args, **kwargs):
        if not self.token:
            self.token = self.generate_token()
        super().save(*args, **kwargs)

    def generate_token(self):
        return secrets.token_urlsafe(32)

    def is_expired(self):
        if not self.expires_at:
            return False
        return timezone.now() > self.expires_at

    def is_valid(self):
        return self.is_active and not self.is_expired()


class UserSession(models.Model):
    """
    Model for tracking user sessions
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    session_key = models.CharField(max_length=128, unique=True, db_index=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField()

    class Meta:
        db_table = 'auth_api_session'
        verbose_name = 'User Session'
        verbose_name_plural = 'User Sessions'
        ordering = ['-created_at']

    def __str__(self):
        user_username = getattr(self.user, 'username', 'Unknown') if self.user else 'Unknown'
        return f"{user_username} - {self.session_key}"

    def is_expired(self):
        return timezone.now() > self.expires_at

    def is_valid(self):
        return not self.is_expired()