// Variables globales
let debts = [];
let userRole = 'user'; // Par défaut, l'utilisateur est un simple utilisateur
let chart;
let deleteId = null;
let currentDebtor = '';

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', function() {
    // Chargement des données
    loadData();
    
    // Mise en place des écouteurs d'événements
    setupEventListeners();
    
    // Mise à jour des listes déroulantes
    updateDebtorLists();
    
    // Animation d'entrée
    animateLoginBox();
});

// Fonctions d'animation
function animateLoginBox() {
    anime({
        targets: '.login-box',
        opacity: [0, 1],
        translateY: [20, 0],
        easing: 'easeOutExpo',
        duration: 800
    });
}

function animateSections() {
    anime({
        targets: ['.admin-panel', '.search-panel', '.statistics', '.payment-info'],
        opacity: [0, 1],
        translateY: [20, 0],
        delay: anime.stagger(100),
        easing: 'easeOutExpo',
        duration: 600
    });
}

// Configuration des écouteurs d'événements
function setupEventListeners() {
    // Écouteurs pour le login
    document.getElementById('admin-login').addEventListener('click', () => login('admin'));
    document.getElementById('user-login').addEventListener('click', () => login('user'));
    document.getElementById('logout-btn').addEventListener('click', logout);
    
    // Switch mode sombre/clair
    document.getElementById('theme-switch').addEventListener('change', toggleTheme);
    
    // Formulaire de dette
    document.getElementById('debt-form').addEventListener('submit', addDebt);
    
    // Recherche
    document.getElementById('search-btn').addEventListener('click', searchDebts);
    document.getElementById('search-name').addEventListener('input', autoSearch);
    document.getElementById('start-date').addEventListener('change', autoSearch);
    document.getElementById('end-date').addEventListener('change', autoSearch);
    
    // Modal de suppression
    document.getElementById('confirm-delete').addEventListener('click', confirmDelete);
    document.getElementById('cancel-delete').addEventListener('click', closeDeleteModal);
    
    // Modal d'édition
    document.getElementById('edit-form').addEventListener('submit', saveEdit);
    document.getElementById('cancel-edit').addEventListener('click', closeEditModal);
}

// Fonction de connexion
function login(role) {
    userRole = role;
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('app-section').classList.remove('hidden');
    document.getElementById('user-role-display').textContent = role === 'admin' ? 'Admin' : 'Utilisateur';
    document.body.setAttribute('data-role', role);
    
    // Animation des sections
    animateSections();
    
    // Charger les données et mettre à jour l'interface
    loadData();
    searchDebts();
    updateChart();
}

// Fonction de déconnexion
function logout() {
    document.getElementById('app-section').classList.add('hidden');
    document.getElementById('login-section').classList.remove('hidden');
    document.body.removeAttribute('data-role');
}

// Toggle thème sombre/clair
function toggleTheme() {
    const isChecked = document.getElementById('theme-switch').checked;
    if (isChecked) {
        document.body.classList.remove('light-mode');
        document.body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
    } else {
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode');
        localStorage.setItem('theme', 'light');
    }
}

// Ajouter une dette
function addDebt(e) {
    e.preventDefault();
    
    const debtor = document.getElementById('debtor-name').value;
    const date = document.getElementById('debt-date').value;
    const description = document.getElementById('debt-description').value;
    const amount = parseFloat(document.getElementById('debt-amount').value);
    const discount = parseFloat(document.getElementById('debt-discount').value) || 0;
    
    const newDebt = {
        id: Date.now(),
        debtor,
        date,
        description,
        amount,
        discount,
        total: amount - discount
    };
    
    debts.push(newDebt);
    saveData();
    updateDebtorLists();
    searchDebts();
    updateChart();
    
    // Animation de confirmation
    animateAddSuccess();
    
    // Réinitialiser le formulaire
    document.getElementById('debt-form').reset();
}

function animateAddSuccess() {
    const submitBtn = document.querySelector('.submit-btn');
    submitBtn.textContent = 'Đã lưu!';
    submitBtn.style.backgroundColor = 'var(--success-color)';
    
    setTimeout(() => {
        submitBtn.textContent = 'Lưu ghi nợ';
        submitBtn.style.backgroundColor = 'var(--primary-color)';
    }, 1500);
}

// Recherche de dettes
function searchDebts() {
    const nameFilter = document.getElementById('search-name').value.toLowerCase();
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    
    let filteredDebts = [...debts];
    
    // Appliquer les filtres
    if (nameFilter) {
        filteredDebts = filteredDebts.filter(debt => 
            debt.debtor.toLowerCase().includes(nameFilter)
        );
        currentDebtor = nameFilter;
    } else {
        currentDebtor = '';
    }
    
    if (startDate) {
        filteredDebts = filteredDebts.filter(debt => debt.date >= startDate);
    }
    
    if (endDate) {
        filteredDebts = filteredDebts.filter(debt => debt.date <= endDate);
    }
    
    // Mettre à jour le tableau et le graphique
    displayDebts(processDebts(filteredDebts));
    updateChart();
}

// Auto-recherche quand les filtres changent
function autoSearch() {
    searchDebts();
}

// Traiter les dettes pour compenser les dettes croisées
function processDebts(debtList) {
    // Si pas de filtrage par nom, renvoyer la liste originale
    if (!currentDebtor) {
        return debtList;
    }
    
    // Créer une copie pour ne pas modifier l'original
    const processedDebts = [...debtList];
    
    // Trouver les dettes croisées
    const currentPersonDebts = debtList.filter(debt => 
        debt.debtor.toLowerCase().includes(currentDebtor.toLowerCase())
    );
    
    const otherPersonDebts = debts.filter(debt => 
        !debt.debtor.toLowerCase().includes(currentDebtor.toLowerCase()) &&
        debt.debtor.toLowerCase() === currentDebtor
    );
    
    // TODO: Implémenter la logique de compensation des dettes croisées
    
    return processedDebts;
}

// Afficher les dettes dans le tableau
function displayDebts(debtList) {
    const tableBody = document.getElementById('debt-results');
    tableBody.innerHTML = '';
    
    if (debtList.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center;">Không có kết quả nào được tìm thấy</td>
            </tr>
        `;
        return;
    }
    
    // Trier par date (plus récent en premier)
    debtList.sort((a, b) => new Date(b.date) - new Date(a.date));
