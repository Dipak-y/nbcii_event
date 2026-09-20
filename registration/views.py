from django.http import JsonResponse
from .models import Registration, Contact


def registration_view(request):
    if request.method != "POST":
        return JsonResponse(
            {"error": "Only POST requests are allowed."},
            status=405
        )

    # Honeypot protection
    if request.POST.get("website"):
        return JsonResponse({
            "message": "Registration submitted successfully."
        })

    registration = Registration.objects.create(
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

    return JsonResponse({
        "message": "Your registration has been submitted successfully.",
        "reference": f"REG-{registration.id:05d}",
    })


def contact_view(request):
    if request.method != "POST":
        return JsonResponse(
            {"error": "Only POST requests are allowed."},
            status=405
        )

    if request.POST.get("website"):
        return JsonResponse({
            "message": "Message submitted successfully."
        })

    contact = Contact.objects.create(
        name=request.POST.get("name", ""),
        email=request.POST.get("email", ""),
        message=request.POST.get("message", ""),
    )

    return JsonResponse({
        "message": "Your message has been sent successfully.",
        "reference": f"ENQ-{contact.id:05d}",
    })