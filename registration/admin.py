from django.contrib import admin
from .models import Registration, Contact

@admin.register(Registration)
class RegistrationAdmin(admin.ModelAdmin):
    list_display = (
        "full_name",
        "email",
        "phone",
        "organization",
        "designation",
        "country",
        "sector",
        "delegate_type",
        "created_at",
    )

    search_fields = (
        "full_name",
        "email",
        "organization",
        "phone",
    )

    list_filter = (
        "sector",
        "delegate_type",
        "country",
        "created_at",
    )

@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "message", "created_at")
    search_fields = ("name", "email", "message")
    list_filter = ("created_at",) 