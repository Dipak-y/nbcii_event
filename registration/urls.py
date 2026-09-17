from django.urls import path
from .views import registration_view, contact_view

urlpatterns = [
    path("registrations/", registration_view, name="registration"),
    path("contact/", contact_view, name="contact"),
]