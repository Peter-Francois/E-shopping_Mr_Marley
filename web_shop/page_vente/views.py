from django.shortcuts import render, get_object_or_404, redirect
from django.http import HttpResponse, JsonResponse
from .models import *
from .forms import ProductFilterForm
from django.core.paginator import Paginator
from django.views.decorators.http import require_POST, require_GET
from django.views.decorators.csrf import csrf_protect
from django.utils.timezone import now
from .utils import get_session_expiration

def add_to_cart(request, product_id):
    product = get_object_or_404(AllProducts, id=product_id)

    if not product.disponible:
        return JsonResponse({'success': False, 'message': 'Produit déjà pris'}, status=400)

    # Récupérer l'ID de session unique de Django
    expiration_date = get_session_expiration(request)
    session_id = request.session.session_key
    
    if not session_id:
        request.session.create()
        session_id = request.session.session_key

    
    # Vérifier si un panier existe pour cette session
    cart, created = Cart.objects.get_or_create(session_id=session_id)

    # Ajouter le produit au panier
    cart_item, item_created = CartItem.objects.get_or_create(cart=cart, product=product)
    if not item_created:
        cart_item.quantity += 1
        cart_item.save()

    # Marquer le produit comme indisponible
    product.disponible = False
    product.save()

    return JsonResponse({'success': True, 'message': f'{product.nom} ajouté au panier', "session_expiration": expiration_date.strftime('%Y-%m-%d %H:%M:%S') if expiration_date else None})

def cart_detail(request):
    session_id = request.session.session_key
    if not session_id:
        return JsonResponse({'cart': []})  # Aucun panier trouvé

    cart = Cart.objects.filter(session_id=session_id).first()
    if not cart:
        return JsonResponse({'cart': []})  

    cart_items = CartItem.objects.filter(cart=cart).select_related('product')
    data = [{'nom': item.product.nom, 'prix': item.product.prix, 'quantity': item.quantity, 'lien_image1': item.product.lien_image1, 'id': item.product.id} for item in cart_items]

    return JsonResponse({'cart': data})

# Vider le panier et rendre les produits à nouveau disponibles
def vider_panier(request):
    session_id = request.session.session_key
    if not session_id:
        return JsonResponse({'success': False, 'message': 'Aucun panier trouvé'})

    cart = Cart.objects.filter(session_id=session_id).first()
    if not cart:
        return JsonResponse({'success': False, 'message': 'Le panier est déjà vide'})

    cart_items = CartItem.objects.filter(cart=cart)
    for item in cart_items:
        item.product.disponible = True  # Rendre le produit disponible
        item.product.save()
        item.delete()

    cart.delete()  # Supprimer le panier après suppression des articles

    return JsonResponse({'success': True, 'message': 'Le panier a été vide'})

def remove_from_cart(request, product_id):
    session_id = request.session.session_key
    if not session_id:
        return JsonResponse({'success': False, 'message': 'Aucun panier trouvé'})
    cart = Cart.objects.filter(session_id=session_id).first()
    cart_item = CartItem.objects.filter(cart=cart, product_id=product_id).first()
    if cart_item:
        cart_item.delete()
        cart_item.product.disponible = True  # Rendre le produit disponible
        cart_item.product.save()
        return JsonResponse({'success': True, 'message': 'Article retiré du panier'})
    else:
        return JsonResponse({'success': False, 'message': 'Article non trouvé dans le panier'})

@require_GET
def get_product_details(request, article_id):
    try:
        product = AllProducts.objects.get(id=article_id)
        return JsonResponse({'status': 'success', 'data': {
            'id': product.id,
            'nom': product.nom,
            'prix': product.prix,
            'disponible': product.disponible
        }})
    except AllProducts.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'Product not found'}, status=404)

@require_POST
@csrf_protect
def rendre_indisponible(request, product_id):
    try:
        product = AllProducts.objects.get(id=product_id)
        product.disponible = False
        product.save()
        return JsonResponse({'status': 'success'})
    except AllProducts.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'Product not found'}, status=404)

@require_POST
@csrf_protect
def rendre_disponible(request, product_id):
    try:
        product = AllProducts.objects.get(id=product_id)
        product.disponible = True
        product.save()
        return JsonResponse({'status': 'success'})
    except AllProducts.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'Product not found'}, status=404)

# Create your views here.
def index(request):    
    return render(request, 'page_vente/index.html')

def macrames(request):
    return render(request, 'page_vente/macrames.html')

def tous_les_produits(request):
    all_products = AllProducts.objects.all()
    form = ProductFilterForm(request.GET)

    all_products = [product for product in all_products if product.disponible]

    if form.is_valid():
        search = form.cleaned_data.get('search')
        type = form.cleaned_data.get('type')
        min_price = form.cleaned_data.get('min_price')
        max_price = form.cleaned_data.get('max_price')

        if search:
            all_products = [product for product in all_products if search.lower() in product.nom.lower()]
        if type:
            if type == '---':
                type = None
            else:
                all_products = [product for product in all_products if product.type == type]
        if min_price is not None:
            all_products = [product for product in all_products if product.prix >= min_price]
        if max_price is not None:
            all_products = [product for product in all_products if product.prix <= max_price]

    # Pagination
    paginator = Paginator(all_products, 20)  # 20 articles per page
    page_number = request.GET.get('page', 1)
    page_obj = paginator.get_page(page_number)
    
    context = {
        'products': page_obj,
        'form': form
    }

    def update_lien(lien_image):
        if "www.dropbox.com" in lien_image:
            lien_image = lien_image.replace("www.dropbox.com", "dl.dropboxusercontent.com")
        if "st=" in lien_image:  
            lien_image = lien_image.split("&st=")[0].rstrip("&")
        return lien_image

    for product in all_products:
        if product.lien_image1:
            product.lien_image1 = update_lien(product.lien_image1)
        if product.lien_image2:
            product.lien_image2 = update_lien(product.lien_image2)
        if product.lien_image3:
            product.lien_image3 = update_lien(product.lien_image3)
        if product.lien_image4:
            product.lien_image4 = update_lien(product.lien_image4)
        product.save()


    return render(request, 'page_vente/tous_les_produits.html', context)

def maroquinerie(request):
    return render(request, 'page_vente/maroquinerie.html')

def creation_sur_mesure(request):
    return render(request, 'page_vente/creation_sur_mesure.html')

def hybride(request):
    return render(request, 'page_vente/hybride.html')

def contact(request):
    return render(request, 'page_vente/contact.html')

def panier(request):
    session_key = request.session.session_key
    cart = Cart.objects.filter(session_id=session_key).first()
    items = CartItem.objects.filter(cart=cart)
    expiration_date = get_session_expiration(request)


    return render(request, "page_vente/panier.html", {
        "expiration_date": expiration_date,
        "items": items
    })

def a_propos(request):
    return render(request, 'page_vente/a_propos.html')

def get_product_images(request, article_id):
    try:
        product = AllProducts.objects.get(id=article_id)
        images = [product.lien_image1 , product.lien_image2, product.lien_image3, product.lien_image4]
        images = [image for image in images if image]
        return JsonResponse({'images': images})
    except AllProducts.DoesNotExist:
        return JsonResponse({'error': 'Product not found'}, status=404)