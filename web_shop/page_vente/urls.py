from django.urls import path
from . import views

app_name = 'boutique'

urlpatterns = [
    path('', views.index, name="index"),
    path('macrames/', views.macrames, name="macrames"),
    path('maroquinerie/', views.maroquinerie, name="maroquinerie"),
    path('creation-sur-mesure/', views.creation_sur_mesure, name="creation-sur-mesure"),
    path('autres-produits/', views.autres_produits, name="autres-produits"),
    path('tout-les-produits/', views.tout_les_produits, name="tout-les-produits"),
]