
from django.contrib import admin
from django.urls import path, include
from nbcci.views import homePage

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", homePage, name="home"),
    path("api/forum/", include("registration.urls")),
]