from django.urls import path
from . import views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("", views.home, name="home"),
    path("apply-changes/", views.apply_changes, name="apply_changes"),
    path("anime-of-the-day/", views.get_anime_of_the_day, name="get_anime_of_the_day"),
    path('store-username/', views.store_username, name='store_username'),
    path('savedrawing/', views.savedrawing, name='savedrawing'),
    path('gallery/', views.gallery, name='gallery'),
    path('add-comment/', views.add_comment, name='add_comment'),
    path('get-drawings/', views.get_drawings, name='get_drawings'),
    path("save-username/", views.save_username, name="save_username"),

]+ static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)