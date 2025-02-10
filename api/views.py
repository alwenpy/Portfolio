from http.client import HTTPException
import os
import random
import requests
from django.shortcuts import render
from django.http import JsonResponse
import google.generativeai as genai
from django.views.decorators.csrf import csrf_exempt
import json
from django.shortcuts import render
from django.views.decorators.http import require_http_methods
from .models import Drawing, Comment
from alwen import settings

GEMINI_API_KEY = "AIzaSyDWuh6JDfGppgGyKCHRKpKMfFmP0EPYpe8"
genai.configure(api_key=GEMINI_API_KEY)
TENOR_API_KEY = "AIzaSyDuN550ygThE8-A0nFuJGXcgM3eNVCwNW8"
CKEY = "Anime"
def home(request):
    file_path = os.path.join(settings.BASE_DIR, "static", "dynamic_script.js")

    with open(file_path, "w") as file:
        file.write("// Dynamic JavaScript")

    return render(request, "index.html")

def generate_js_with_gemini(command: str) -> str:
    model = genai.GenerativeModel(model_name="gemini-1.5-flash")
    prompt = (
        f"You are a JavaScript generator AI. Convert the following command into valid, plain JavaScript code: {command}. "
        f"Ensure the response contains only executable JavaScript without any enclosing tags or unnecessary prefixes like 'javascript:'."
        f"Also, avoid using 'console.log()' or similar functions in the response."
        f"Please provide the JavaScript code only."
        f"Try to display the implementation of the command in a div in the section with id=dynamic in the frontend."
        f"whatever you display apply some styles to it."
    )
    
    try:
        response = model.generate_content([prompt])
        print("Gemini API Response:", response.text)

        cleaned_js = (
            response.text
            .replace("```js", "")  
            .replace("```", "")
            .replace("javascript", "")  
            .strip()  
        )

        print("Cleaned JavaScript:", cleaned_js)
        return cleaned_js

    except Exception as e:
        print(f"Error in Gemini API call: {e}")
        raise HTTPException(status_code=500, detail=f"Error in Gemini API: {str(e)}")
@csrf_exempt
def apply_changes(request):
    if request.method == "POST":
        data = json.loads(request.body)
        command = data.get("command", "").strip()
        change_type = request.headers.get("X-Change-Type", "").lower()

        if not command:
            return JsonResponse({"error": "Command is empty."}, status=400)

        if change_type == "js":
            generated_js = generate_js_with_gemini(command)
            file_path = os.path.join(settings.BASE_DIR, "static", "dynamic_script.js")

            with open(file_path, "w") as file:
                file.write(generated_js)
            print(f"Writing JS to file: {file_path}")
            print(f"Generated JS Content:\n{generated_js}")


            return JsonResponse({"message": "JavaScript applied successfully.", "file": file_path, "js": generated_js}, status=200)
        else:
            return JsonResponse({"error": "Invalid change type."}, status=400)

    return JsonResponse({"error": "Invalid request method."}, status=405)

def get_anime_of_the_day(request):
    anime_list = ["naruto", "jujutsu kaisen", "demon slayer", "one piece", "deathnote", "spy x family", "tokyo revengers"]
    random_anime = random.choice(anime_list)
    random_offset = random.randint(0, 50)
    url = f"https://tenor.googleapis.com/v2/search?q={random_anime}&key={TENOR_API_KEY}&client_key={CKEY}&limit=1&random=true&pos={random_offset}"

    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        if "results" in data and len(data["results"]) > 0:
            gif_url = data["results"][0]["media_formats"]["gif"]["url"]
            return JsonResponse({"gif_url": gif_url})
    return JsonResponse({"error": "No GIFs found."}, status=404)


from django.shortcuts import render
from django.http import JsonResponse
from django.views.generic import TemplateView
from django.conf import settings
import os
from .air_canvas import AirCanvas

class AirCanvasView(TemplateView):
    template_name = 'index.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # Get list of saved drawings
        drawings_dir = os.path.join(settings.MEDIA_ROOT, 'drawings')
        drawings = []
        if os.path.exists(drawings_dir):
            drawings = [f for f in os.listdir(drawings_dir) if f.endswith(('.png', '.jpg'))]
            drawings.sort(reverse=True)  # Most recent first
        context['drawings'] = drawings
        return context

def start_canvas(request):
    """Start the Air Canvas application"""
    try:
        canvas = AirCanvas()
        canvas.run()
        return JsonResponse({'status': 'success'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)})

from django.contrib.auth.models import User
@csrf_exempt
def savedrawing(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            username = data.get("username")
            image_data = data.get("image")
            
            print(f"Received request for username: {username}")  
            # get or create user
            user, created = User.objects.get_or_create(username=username)            
            
            if not username or not image_data:
                return JsonResponse({"error": "Missing username or image data"}, status=400)
            
            try:
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                print(f"User {username} not found in database")  # Debug print
                # Create user if not exists
                user = User.objects.create(username=username)
            
            drawing = Drawing.objects.create(user=user, image=image_data)
            return JsonResponse({"message": "Drawing saved successfully!"}, status=201)
            
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON data"}, status=400)
        except Exception as e:
            print(f"Error in savedrawing: {str(e)}")  # Debug print
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request"}, status=400)
def store_username(request):
    
    print("-----------------------------------------------------------",request.body)
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            username = data.get("username")

            if not username:
                return JsonResponse({"error": "Username is required"}, status=400)

            user, created = User.objects.get_or_create(username=username)

            return JsonResponse({"message": "Username stored successfully", "user_id": user.id, "username": user.username}, status=201)

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)

    return JsonResponse({"error": "Invalid request method"}, status=405)



def gallery(request):
    """Display all drawings with their comments"""
    drawings = Drawing.objects.all().order_by('-created_at')
    return render(request, 'gallery.html', {'drawings': drawings})

@require_http_methods(["POST"])
def add_comment(request):
    """Add a comment to a drawing"""
    try:
        data = json.loads(request.body)
        drawing_id = data.get('drawing_id')
        text = data.get('text')

        if not drawing_id or not text:
            return JsonResponse({'error': 'Missing required fields'}, status=400)

        drawing = Drawing.objects.get(id=drawing_id)
        comment = Comment.objects.create(
            user=request.user,
            drawing=drawing,
            text=text
        )

        return JsonResponse({
            'id': comment.id,
            'username': comment.user.username,
            'text': comment.text,
            'created_at': comment.created_at.isoformat()
        })

    except Drawing.DoesNotExist:
        return JsonResponse({'error': 'Drawing not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@require_http_methods(["GET"])
def get_drawings(request):
    """Get all drawings with their comments"""
    drawings = Drawing.objects.all().order_by('-created_at')
    drawings_data = []
    
    for drawing in drawings:
        comments = [{
            'id': comment.id,
            'username': comment.user.username,
            'text': comment.text,
            'created_at': comment.created_at.isoformat()
        } for comment in drawing.comments.all()]
        
        drawings_data.append({
            'id': drawing.id,
            'image': drawing.image,
            'username': drawing.user.username,
            'created_at': drawing.created_at.isoformat(),
            'comments': comments
        })
    
    return JsonResponse(drawings_data, safe=False)