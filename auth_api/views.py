from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views import View
import json
import logging

logger = logging.getLogger(__name__)

@method_decorator(csrf_exempt, name='dispatch')
class AuthActionView(View):
    """
    Handle authentication actions via AJAX requests
    """
    
    def post(self, request):
        try:
            # Parse JSON data from request body
            data = json.loads(request.body.decode('utf-8'))
            action = data.get('action', '')
            timestamp = data.get('timestamp', '')
            
            logger.info(f"Auth action received: {action} at {timestamp}")
            
            # Process different actions
            if action == 'login_redirect':
                response_data = {
                    'status': 'success',
                    'message': 'Redirecting to login page',
                    'redirect_url': '/auth/login'
                }
            elif action == 'signup_redirect':
                response_data = {
                    'status': 'success',
                    'message': 'Redirecting to signup page',
                    'redirect_url': '/auth/register'
                }
            else:
                response_data = {
                    'status': 'error',
                    'message': f'Unknown action: {action}'
                }
            
            return JsonResponse(response_data)
            
        except json.JSONDecodeError:
            return JsonResponse({
                'status': 'error',
                'message': 'Invalid JSON data'
            }, status=400)
        except Exception as e:
            logger.error(f"Error processing auth action: {str(e)}")
            return JsonResponse({
                'status': 'error',
                'message': 'Internal server error'
            }, status=500)