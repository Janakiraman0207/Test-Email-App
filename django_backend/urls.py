from django.urls import path
from . import views
from .views import CreateEventAPIView


urlpatterns = [
    path('create-event/', views.create_event, name='create-event'),
    # You can add more paths here later, like:
    # path('list-events/', views.list_events, name='list-events'),
    path("calendar/events/", CreateEventAPIView.as_view(), name="create-event"),
]