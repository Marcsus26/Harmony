from django.apps import AppConfig


class HarmonybackConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'HarmonyBack'
    def ready(self):
        # We import the signals here so they are 
        # registered as soon as the app is ready.
        import HarmonyBack.signals
