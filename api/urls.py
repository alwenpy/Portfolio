from django.urls import path
from . import views

urlpatterns = [
    path("", views.home, name="home"),
    path("apply-changes/", views.apply_changes, name="apply_changes"),
    path("anime-of-the-day/", views.get_anime_of_the_day, name="get_anime_of_the_day"),
    # path('air-canvas/', views.AirCanvasView.as_view(), name='air_canvas'),
    path('start-canvas/', views.start_canvas, name='start_canvas'),
    path('store-username/', views.store_username, name='store_username'),
    path('savedrawing/', views.savedrawing, name='savedrawing'),
    path('gallery/', views.gallery, name='gallery'),
    path('add-comment/', views.add_comment, name='add_comment'),
    path('get-drawings/', views.get_drawings, name='get_drawings'),



]