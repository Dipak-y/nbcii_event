
from django.shortcuts import redirect
from .models import Registration, Contact


def registration_view(request):
    if request.method == "POST":
        if request.POST.get("website"):
            return redirect("/")

        Registration.objects.create(
            full_name=request.POST.get("fullName", ""),
            organization=request.POST.get("organization", ""),
            designation=request.POST.get("designation", ""),
            email=request.POST.get("email", ""),
            phone=request.POST.get("phone", ""),
            country=request.POST.get("country", "Nepal"),
            sector=request.POST.get("sector", ""),
            delegate_type=request.POST.get("delegateType", ""),
            interests=request.POST.getlist("interests"),
            message=request.POST.get("message", ""),
        )

    return redirect("/")


def contact_view(request):
    if request.method == "POST":
        Contact.objects.create(
            name=request.POST.get("name", ""),
            email=request.POST.get("email", ""),
            message=request.POST.get("message", ""),
        )

    return redirect("/")
