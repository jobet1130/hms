from django.contrib import admin
from .models import APIToken, UserSession

@admin.register(APIToken)
class APITokenAdmin(admin.ModelAdmin):
    list_display = ('user', 'name', 'token', 'created_at', 'expires_at', 'is_active', 'last_used')
    list_filter = ('is_active', 'created_at', 'expires_at')
    search_fields = ('user__username', 'name', 'token')
    readonly_fields = ('token', 'created_at', 'last_used')
    date_hierarchy = 'created_at'

    def save_model(self, request, obj, form, change):
        # Generate token if it's a new object
        if not change and not obj.token:
            obj.token = obj.generate_token()
        super().save_model(request, obj, form, change)


@admin.register(UserSession)
class UserSessionAdmin(admin.ModelAdmin):
    list_display = ('user', 'session_key', 'ip_address', 'created_at', 'updated_at', 'expires_at', 'is_expired')
    list_filter = ('created_at', 'updated_at', 'expires_at')
    search_fields = ('user__username', 'session_key', 'ip_address')
    readonly_fields = ('session_key', 'created_at', 'updated_at')
    date_hierarchy = 'created_at'

    @admin.display(boolean=True, description='Expired')
    def is_expired(self, obj):
        return obj.is_expired()