from django.db import models



class Registration(models.Model):

    COUNTRY_CHOICES = [
        ("Nepal", "Nepal"),
        ("United Kingdom", "United Kingdom"),
        ("Other", "Other"),
    ]

    SECTOR_CHOICES = [
        ("Government", "Government"),
        ("Business", "Business"),
        ("Investment", "Investment"),
        ("Education & Research", "Education & Research"),
        ("Development", "Development"),
        ("Technology & Startup", "Technology & Startup"),
        ("Media", "Media"),
        ("Other", "Other"),
    ]

    DELEGATE_CHOICES = [
        ("Government", "Government"),
        ("Business", "Business"),
        ("Investor", "Investor"),
        ("Academic", "Academic"),
        ("Development Partner", "Development Partner"),
        ("Technology / Startup", "Technology / Startup"),
        ("Media", "Media"),
        ("Other", "Other"),
    ]

    INTEREST_CHOICES = [
        ("Trade & Investment", "Trade & Investment"),
        ("Education & Skills", "Education & Skills"),
        ("Energy & Infrastructure", "Energy & Infrastructure"),
        ("Digital Economy & AI", "Digital Economy & AI"),
        ("Green Growth", "Green Growth"),
        ("Other", "Other"),
    ]


    full_name = models.CharField(max_length=100)
    organization = models.CharField(max_length=150)
    designation = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=30)
    country = models.CharField(max_length=100, choices=COUNTRY_CHOICES, default="Nepal")
    sector = models.CharField(max_length=100, choices=SECTOR_CHOICES)
    delegate_type = models.CharField(max_length=100, choices=DELEGATE_CHOICES)
    interests = models.JSONField(default=list, blank=True)
    message = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.full_name


class Contact(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField()
    message = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name        