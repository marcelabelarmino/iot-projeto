const API_BASE = 'http://localhost:5000/api';

// Elementos DOM
const userTable = document.getElementById('userTable');
const emptyMessage = document.getElementById('emptyMessage');
const userModal = document.getElementById('userModal');
const deleteModal = document.getElementById('deleteModal');
const notification = document.getElementById('notification');

const openModalBtn = document.getElementById('openModal');
const closeModalBtn = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const saveUserBtn = document.getElementById('saveUser');
const closeDeleteModalBtn = document.getElementById('closeDeleteModal');
const cancelDeleteBtn = document.getElementById('cancelDelete');
const confirmDeleteBtn = document.getElementById('confirmDelete');
const backDashboardBtn = document.getElementById('back-dashboard');

const nomeInput = document.getElementById('nome');
const emailInput = document.getElementById('email');
const funcaoSelect = document.getElementById('funcao');
const statusSelect = document.getElementById('status');
const senhaInput = document.getElementById('senha');  // Novo
const confirmarSenhaInput = document.getElementById('confirmarSenha');  // Novo
const modalTitle = document.getElementById('modalTitle');

const nomeError = document.getElementById('nomeError');
const emailError = document.getElementById('emailError');
const senhaError = document.getElementById('senhaError');  // Novo
const confirmarSenhaError = document.getElementById('confirmarSenhaError');  // Novo

let currentUserId = null;
let userToDelete = null;

// Função de notificação
function showNotification(message, isSuccess = true) {
    const notificationIcon = document.getElementById('notificationIcon');
    const notificationText = document.getElementById('notificationText');
    
    notificationText.textContent = message;
    notification.classList.remove('hidden', 'bg-green-500', 'bg-red-500');
    notification.classList.add(isSuccess ? 'bg-green-500' : 'bg-red-500', 'flex');
    notificationIcon.textContent = isSuccess ? 'Success' : 'Error';

    setTimeout(() => notification.classList.add('hidden'), 3000);
}

// Carregar usuários do backend
async function loadUsers() {
    try {
        const response = await fetch(`${API_BASE}/users`);
        if (!response.ok) throw new Error('Erro ao carregar usuários');
        const users = await response.json();
        renderUserTable(users);
    } catch (err) {
        showNotification('Erro ao carregar usuários: ' + err.message, false);
        renderUserTable([]);
    }
}

// Renderizar tabela
function renderUserTable(users) {
    userTable.innerHTML = '';
    if (users.length === 0) {
        emptyMessage.classList.remove('hidden');
        return;
    }
    emptyMessage.classList.add('hidden');

    users.forEach(user => {
        const statusClass = user.status === 'Ativo' ? 'text-green-600' : 'text-red-600';
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-4 md:px-6 py-4">${user.nome}</td>
            <td class="px-4 md:px-6 py-4">${user.email}</td>
            <td class="px-4 md:px-6 py-4">${user.funcao}</td>
            <td class="px-4 md:px-6 py-4 ${statusClass}">${user.status}</td>
            <td class="px-4 md:px-6 py-4 flex gap-2">
                <button class="edit-btn text-primary hover:text-primary-dark" data-id="${user.id}">Editar</button>
                <button class="delete-btn text-red-600 hover:text-red-800" data-id="${user.id}">Deletar</button>
            </td>
        `;
        userTable.appendChild(row);
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => openUserModal(parseInt(btn.dataset.id)));
    });
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => openDeleteModal(parseInt(btn.dataset.id)));
    });
}

// Abrir modal
function openUserModal(userId = null) {
    currentUserId = userId;
    nomeError.classList.add('hidden');
    emailError.classList.add('hidden');
    senhaError.classList.add('hidden');
    confirmarSenhaError.classList.add('hidden');

    senhaInput.value = '';  // Limpa senha sempre
    confirmarSenhaInput.value = '';

    if (userId) {
        modalTitle.textContent = 'Editar Usuário';
        fetch(`${API_BASE}/users`)
            .then(r => r.json())
            .then(users => {
                const user = users.find(u => u.id === userId);
                if (user) {
                    nomeInput.value = user.nome;
                    emailInput.value = user.email;
                    funcaoSelect.value = user.funcao;
                    statusSelect.value = user.status;
                }
            });
    } else {
        modalTitle.textContent = 'Novo Usuário';
        nomeInput.value = '';
        emailInput.value = '';
        funcaoSelect.value = 'Operador';
        statusSelect.value = 'Ativo';
    }
    userModal.classList.remove('hidden');
}

function closeUserModal() {
    userModal.classList.add('hidden');
    currentUserId = null;
}

// Salvar usuário (com senha)
async function saveUser() {
    nomeError.classList.add('hidden');
    emailError.classList.add('hidden');
    senhaError.classList.add('hidden');
    confirmarSenhaError.classList.add('hidden');

    if (!nomeInput.value.trim()) {
        nomeError.classList.remove('hidden');
        return;
    }
    if (!emailInput.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value)) {
        emailError.classList.remove('hidden');
        return;
    }

    const senha = senhaInput.value.trim();
    const confirmarSenha = confirmarSenhaInput.value.trim();

    // Para novos usuários: Senha obrigatória
    if (!currentUserId && !senha) {
        senhaError.classList.remove('hidden');
        return;
    }

    // Se senha for informada, validar confirmação
    if (senha && senha !== confirmarSenha) {
        confirmarSenhaError.classList.remove('hidden');
        return;
    }

    const userData = {
        nome: nomeInput.value.trim(),
        email: emailInput.value.trim(),
        funcao: funcaoSelect.value,
        status: statusSelect.value
    };

    // Adicionar senha só se informada
    if (senha) {
        userData.senha = senha;
        userData.confirmarSenha = confirmarSenha;  // Para validação no backend (edição)
    }

    try {
        let url = `${API_BASE}/users`;
        let method = 'POST';

        if (currentUserId) {
            url += `/${currentUserId}`;
            method = 'PUT';
        }

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao salvar');
        }

        showNotification(currentUserId ? 'Usuário atualizado!' : 'Usuário criado!');
        closeUserModal();
        loadUsers();
    } catch (err) {
        showNotification(err.message, false);
    }
}

// Excluir usuário
async function deleteUser() {
    try {
        const response = await fetch(`${API_BASE}/users/${userToDelete}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Erro ao excluir');

        showNotification('Usuário excluído com sucesso!');
        closeDeleteModal();
        loadUsers();
    } catch (err) {
        showNotification(err.message, false);
    }
}

function openDeleteModal(userId) {
    userToDelete = userId;
    const row = [...userTable.querySelectorAll('tr')].find(row => row.querySelector(`.delete-btn[data-id="${userId}"]`));
    const nome = row.querySelector('td').textContent;
    document.getElementById('deleteMessage').textContent = `Tem certeza que deseja excluir "${nome}"?`;
    deleteModal.classList.remove('hidden');
}

function closeDeleteModal() {
    deleteModal.classList.add('hidden');
    userToDelete = null;
}

// Eventos
openModalBtn.addEventListener('click', () => openUserModal());
closeModalBtn.addEventListener('click', closeUserModal);
cancelBtn.addEventListener('click', closeUserModal);
saveUserBtn.addEventListener('click', saveUser);
confirmDeleteBtn.addEventListener('click', deleteUser);
closeDeleteModalBtn.addEventListener('click', closeDeleteModal);
cancelDeleteBtn.addEventListener('click', closeDeleteModal);
backDashboardBtn.addEventListener('click', () => {
    showNotification('Voltando ao dashboard...');
    setTimeout(() => window.location.href = 'dashboard.html', 1000);
});

// Inicializar
loadUsers();

// Botões show/hide senha
document.getElementById('toggleSenha').addEventListener('click', function () {
  const senhaInput = document.getElementById('senha');
  if (senhaInput.type === 'password') {
    senhaInput.type = 'text';
    this.innerHTML = 'Hide';
  } else {
    senhaInput.type = 'password';
    this.innerHTML = 'Show';
  }
});

document.getElementById('toggleConfirmar').addEventListener('click', function () {
  const confirmarInput = document.getElementById('confirmarSenha');
  if (confirmarInput.type === 'password') {
    confirmarInput.type = 'text';
    this.innerHTML = 'Hide';
  } else {
    confirmarInput.type = 'password';
    this.innerHTML = 'Show';
  }
});

const logoutBtn = document.getElementById('logout-btn');
logoutBtn?.addEventListener('click', () => {
    localStorage.clear(); 
    window.location.href = 'index.html';
});