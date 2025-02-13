const flags = document.querySelectorAll('.flag');

// Fonction pour changer la langue
function changeLanguage(lang) {
    // Mettre à jour le contenu de la page grace au fichier translations.JSON
    fetch('/static/page_vente/translations.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (!data[lang]) {
                console.error(`Language ${lang} not found in translations`);
                return;
            }
            const translations = data[lang];
            
            // Liste des éléments à traduire
            const elementsToTranslate = {
                'title_page_index': translations.title_page_index,
                'title_index': translations.title_index,
                'menu_button_home':translations.menu_button_home,
                'menu_button_produit':translations.menu_button_produit,
                'menu_button_panier':translations.menu_button_panier,
                'menu_button_a_propos':translations.menu_button_a_propos,
                'menu_button_tous_les_produits':translations.menu_button_tous_les_produits,
                'menu_button_maroquinerie':translations.menu_button_maroquinerie,
                'menu_button_macrames':translations.menu_button_macrames,
                'menu_button_hybride':translations.menu_button_hybride,
                'menu_button_creation_sur_mesure':translations.menu_button_creation_sur_mesure,
                'macrames_title':translations.macrames_title,
                'macrames_description':translations.macrames_description,
                'creation_sur_mesure_title':translations.creation_sur_mesure_title,
                'creation_sur_mesure_description':translations.creation_sur_mesure_description,
                'maroquinerie_title':translations.maroquinerie_title,
                'maroquinerie_description':translations.maroquinerie_description,
                'hybride_title':translations.hybride_title,
                'autres_produits_description':translations.autres_produits_description,
                'title_page_cart':translations.title_page_cart,
                'title_panier':translations.title_panier,
                'vider_panier':translations.vider_panier,
                'panier_vide':translations.panier_vide,
                'title_page_all_products':translations.title_page_all_products,
                'title_all_products':translations.title_all_products

            };

            // Mettre à jour chaque élément s'il existe
            for (const [id, text] of Object.entries(elementsToTranslate)) {
                const element = document.getElementById(id);
                if (element) {
                    element.innerHTML = text;
                }
            }
            
            // Met à jour l'état actif des drapeaux
            flags.forEach(flag => {
                flag.classList.toggle('active', flag.getAttribute('data-lang') === lang);
            });
        })
        .catch(error => {
            console.error('Error fetching translations:', error);
        });
}

// Définir la langue par défaut au chargement
document.addEventListener('DOMContentLoaded', () => {
    changeLanguage('fr'); // Langue par défaut
});

// Écouteurs d'événements pour les clics sur les drapeaux
flags.forEach(flag => {
    flag.addEventListener('click', () => {
        const selectedLang = flag.getAttribute('data-lang');
        changeLanguage(selectedLang);
    });
});

// Fonction pour afficher le menu
function toggleMenu() {
    const menuContent = document.querySelector('.menu-content');
    const menuButton = document.querySelector('.menu button');
    const menuContentProduit = document.querySelector('.menu-content-produit');
    menuContent.classList.toggle('active');
    menuButton.classList.toggle('active');
    if (menuContentProduit.classList.contains('active')) {
        menuContentProduit.classList.remove('active');
    }
}

// Fermer le menu si on clique en dehors
document.addEventListener('click', function(event) {
    const menuButton = document.querySelector('.menu button');
    const menuContent = document.querySelector('.menu-content');
    const menuContentProduit = document.querySelector('.menu-content-produit');
    
    // Si le clic n'est ni sur le bouton du menu ni sur le contenu du menu et que le manu est actif
    if (!menuButton.contains(event.target) && !menuContent.contains(event.target) && menuContent.classList.contains('active')) {
        menuContent.classList.remove('active');
        menuButton.classList.remove('active');
        if (menuContentProduit.classList.contains('active')) {
            menuContentProduit.classList.remove('active');
        }
    }
});

// Fonction pour afficher le sous-menu "Produit"
function toggleMenuProduit(event){
    event.preventDefault();
    const menuContentProduit = document.querySelector('.menu-content-produit');
    menuContentProduit.classList.toggle('active');
}

// Pour que le menu modifie son style en fonction de la scroll
window.addEventListener('scroll', function() {
    const menuContent = document.querySelector('.menu-content');
    const menuButton = document.querySelector('.menu button');
    const headerDiv = document.querySelector('div.header');
    const headerTop = headerDiv.offsetTop + 40;
    if (window.scrollY >= headerTop) { // quand on dépasse la div.header
        menuContent.classList.add('scrolled');
        menuButton.classList.add('scrolled');
    } else {
        menuContent.classList.remove('scrolled');
        menuButton.classList.remove('scrolled');
    }
});


document.addEventListener('DOMContentLoaded', function () {
    afficherPanier();  // Charger les articles du panier au démarrage
});
// Fonction pour afficher les articles du panier
function afficherPanier() {
    fetch('/cart_detail/')
        .then(response => response.json())
        .then(data => {
            let listeArticles = document.getElementById('liste-articles');
            listeArticles.innerHTML = ''; 

            data.cart.forEach(article => {
                let li = document.createElement('li');
                li.textContent = `${article.name} - ${article.price} € (x${article.quantity})`;
                listeArticles.appendChild(li);
            });
        });
}

// Helper function to get CSRF token from cookies
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Ajouter un produit au panier
function ajouterAuPanier(articleId) {
    fetch(`/add_to_cart/${articleId}/`, { 
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken'),
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(data.message);
                afficherPanier(); // Mettre à jour l'affichage du panier
                location.reload(); // Rafraîchir pour mettre à jour la disponibilité
            } else {
                alert("Erreur : " + data.message);
            }
        });
}

// Fonction pour vider le panier
function viderPanier() {
    fetch('/vider_panier/', { 
        method: 'POST',
        
        headers: {
            'X-CSRFToken': getCookie('csrftoken'),
            'Content-Type': 'application/json' 
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(data.message);
                afficherPanier();
                location.reload();
            } else {
                alert("Erreur lors de la suppression du panier.");
            }
        });
}


/*
// Initialiser la variable locale pour le panier
let panier = JSON.parse(localStorage.getItem('panier'))||[];
let nombreArticles = panier.length;
const textCartButton = document.getElementById('text-cart-button');
const listeArticles = document.getElementById('liste-articles');

document.addEventListener('DOMContentLoaded', function() {
    

    // Fonction pour ajouter un article au panier

        window.ajouterAuPanier = function ajouterAuPanier(articleId) {
            // First, fetch the product details to check availability
            fetch(`/get_product_details/${articleId}/`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(product => {
                    // Check if the product is available
                    if (!product.data.disponible) {
                        alert("Le produit est indisponible.");
                        return; // Exit the function if the product is not available
                    }
        
                    // If available, proceed to mark the product as unavailable
                    return fetch(`/rendre_indisponible/${articleId}/`, {
                        method: 'POST',
                        headers: {
                            'X-CSRFToken': getCookie('csrftoken'),
                            'Content-Type': 'application/json'
                        }
                    });
                })
                .then(response => {
                    if (response && response.ok) {
                        const productElement = document.querySelector(`[data-product-id="${articleId}"]`);
                        if (productElement) {
                            const productDetails = {
                                id: articleId,
                                nom: productElement.querySelector('p').textContent.split(' - ')[0],
                                prix: productElement.querySelector('p').textContent.split(' - ')[2]
                            };
                            panier.push(productDetails);
                            localStorage.setItem('panier', JSON.stringify(panier)); 
                            nombreArticles = panier.length;   
                            textCartButton.textContent = nombreArticles;
                            afficherPanier(); // Refresh the cart display
                            location.reload();
                        }
                    } else {
                        console.error('Failed to update product availability');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                });
        }
    
    

    // Appeler afficherPanier au chargement de la page
    textCartButton.textContent = nombreArticles;
    afficherPanier();

    
        
        
});
// Fonction pour afficher les articles du panier
function afficherPanier() {
    if (listeArticles === null) return;
    listeArticles.innerHTML = '';
    panier.forEach((article, index) => {
        const li = document.createElement('li');
        li.textContent = `${article.nom} - ${article.prix}`;
        listeArticles.appendChild(li);
    });
} 
// Helper function to get CSRF token from cookies
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Fonction pour vider le panier
window.viderPanier = function viderPanier(){

    if (panier.length === 0) {
        alert("Votre panier est déjà vide.");
        return;
    }

    // Create an array of promises for each AJAX request
    const requests = panier.map(article => {
        return fetch(`/rendre_disponible/${article.id}/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken'),
                'Content-Type': 'application/json'
            }
        });
    });

    // Wait for all requests to complete
    Promise.all(requests)
        .then(responses => {
            // Check if all responses are ok
            const allSuccessful = responses.every(response => response.ok);
            if (allSuccessful) {
                // Clear the local storage and the panier array
                localStorage.removeItem('panier');
                panier.length = 0; // Clear the array
                afficherPanier(); // Refresh the cart display
                location.reload();
            } else {
                console.error('Une erreur est survenue lors de la mise à jour des articles.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }

    window.addEventListener('beforeunload', function (event) {
        // Vérifiez si le panier contient des articles
        if (panier.length > 0) {
            // Afficher le message de confirmation
            event.returnValue = 'Vous avez des articles dans votre panier. Êtes-vous sûr de vouloir quitter ?';
        }
    });*/
