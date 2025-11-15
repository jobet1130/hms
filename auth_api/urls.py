from django.urls import path
from .views import AuthActionView

app_name = 'auth_api'

urlpatterns = [
    path('auth/action/', AuthActionView.as_view(), name='auth_action'),
]