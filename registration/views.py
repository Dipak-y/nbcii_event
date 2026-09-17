from django.core.exceptions import ValidationError
from django.http import JsonResponse

from .models import Contact, Registration


def _method_not_allowed():
    return JsonResponse({"error": "Only POST requests are allowed."}, status=405)


def _clean_or_none(instance):
    """Run full model validation; return a human-readable error string, or None if valid."""
    try:
        instance.full_clean()
    except ValidationError as exc:
        parts = []
        for field, messages in exc.message_dict.items():
            label = field.replace("_", " ").capitalize()
            parts.append(f"{label}: {' '.join(messages)}")
        return " ".join(parts)
    return None


def registration_view(request):
    if request.method != "POST":
        return _method_not_allowed()

    # Honeypot field — bots that fill it get a fake success, no record is saved.
    if request.POST.get("website"):
        return JsonResponse({"message": "Registration submitted successfully."})

    registration = Registration(
        full_name=request.POST.get("fullName", "").strip(),
        organization=request.POST.get("organization", "").strip(),
        designation=request.POST.get("designation", "").strip(),
        email=request.POST.get("email", "").strip(),
        phone=request.POST.get("phone", "").strip(),
        country=request.POST.get("country", "Nepal").strip(),
        sector=request.POST.get("sector", ""),
        delegate_type=request.POST.get("delegateType", ""),
        interests=request.POST.getlist("interests"),
        message=request.POST.get("message", "").strip(),
    )

    error = _clean_or_none(registration)
    if error:
        return JsonResponse({"error": error}, status=400)

    registration.save()

    return JsonResponse({
        "message": "Your registration has been submitted successfully.",
        "reference": f"REG-{registration.id:05d}",
    })


def contact_view(request):
    if request.method != "POST":
        return _method_not_allowed()

    if request.POST.get("website"):
        return JsonResponse({"message": "Message submitted successfully."})

    contact = Contact(
        name=request.POST.get("name", "").strip(),
        email=request.POST.get("email", "").strip(),
        message=request.POST.get("message", "").strip(),
    )

    error = _clean_or_none(contact)
    if error:
        return JsonResponse({"error": error}, status=400)

    contact.save()

    return JsonResponse({
        "message": "Your message has been sent successfully.",
        "reference": f"ENQ-{contact.id:05d}",
    })