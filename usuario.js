  
    // Dados de exemplo
    let users = [
      {
        id: 1,
        nome: "Maria Silva",
        email: "maria@exemplo.com",
        funcao: "Administrador",
        status: "Ativo"
      },
      {
        id: 2,
        nome: "João Santos",
        email: "joao@exemplo.com",
        funcao: "Operador",
        status: "Ativo"
      },
      {
        id: 3,
        nome: "Ana Oliveira",
        email: "ana@exemplo.com",
        funcao: "Visitante",
        status: "Inativo"
      }
    ];

    // Elementos DOM
    const userTable = document.getElementById('userTable');
    const emptyMessage = document.getElementById('emptyMessage');
    const userModal = document.getElementById('userModal');
    const deleteModal = document.getElementById('deleteModal');
    const notification = document.getElementById('notification');
    
    // Botões
    const openModalBtn = document.getElementById('openModal');
    const closeModalBtn = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelBtn');
    const saveUserBtn = document.getElementById('saveUser');
    const closeDeleteModalBtn = document.getElementById('closeDeleteModal');
    const cancelDeleteBtn = document.getElementById('cancelDelete');
    const confirmDeleteBtn = document.getElementById('confirmDelete');
    const backDashboardBtn = document.getElementById('back-dashboard');
    
    // Campos do formulário
    const nomeInput = document.getElementById('nome');
    const emailInput = document.getElementById('email');
    const funcaoSelect = document.getElementById('funcao');
    const statusSelect = document.getElementById('status');
    const modalTitle = document.getElementById('modalTitle');
    
    // Elementos de erro
    const nomeError = document.getElementById('nomeError');
    const emailError = document.getElementById('emailError');
    
    // Variáveis de estado
    let currentUserId = null;
    let userToDelete = null;

    // Função para exibir notificação
    function showNotification(message, isSuccess = true) {
      const notificationIcon = document.getElementById('notificationIcon');
      const notificationText = document.getElementById('notificationText');
      
      notificationText.textContent = message;
      
      if (isSuccess) {
        notification.classList.remove('bg-red-500', 'text-white');
        notification.classList.add('bg-green-500', 'text-white');
        notificationIcon.textContent = '✅';
      } else {
        notification.classList.remove('bg-green-500', 'text-white');
        notification.classList.add('bg-red-500', 'text-white');
        notificationIcon.textContent = '❌';
      }
      
      notification.classList.remove('hidden');
      notification.classList.add('flex');
      
      setTimeout(() => {
        notification.classList.add('hidden');
        notification.classList.remove('flex');
      }, 3000);
    }

    // Função para renderizar a tabela de usuários
    function renderUserTable() {
      userTable.innerHTML = '';
      
      if (users.length === 0) {
        emptyMessage.classList.remove('hidden');
        return;
      }
      
      emptyMessage.classList.add('hidden');
      
      users.forEach(user => {
        const row = document.createElement('tr');
        
        const statusClass = user.status === 'Ativo' ? 'text-green-600' : 'text-red-600';
        
        row.innerHTML = `
          <td class="px-4 md:px-6 py-4 whitespace-nowrap">${user.nome}</td>
          <td class="px-4 md:px-6 py-4 whitespace-nowrap">${user.email}</td>
          <td class="px-4 md:px-6 py-4 whitespace-nowrap">${user.funcao}</td>
          <td class="px-4 md:px-6 py-4 whitespace-nowrap ${statusClass}">${user.status}</td>
          <td class="px-4 md:px-6 py-4 whitespace-nowrap flex gap-2">
            <button class="edit-btn text-primary hover:text-primary-dark" data-id="${user.id}">
              ✏️
            </button>
            <button class="delete-btn text-red-600 hover:text-red-800" data-id="${user.id}">
              🗑️
            </button>
          </td>
        `;
        
        userTable.appendChild(row);
      });
      
      // Adicionar event listeners aos botões de edição e exclusão
      document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => editUser(parseInt(btn.getAttribute('data-id'))));
      });
      
      document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => openDeleteModal(parseInt(btn.getAttribute('data-id'))));
      });
    }

    // Função para abrir o modal de adição/edição
    function openUserModal(userId = null) {
      currentUserId = userId;
      
      // Limpar erros
      nomeError.classList.add('hidden');
      emailError.classList.add('hidden');
      
      if (userId) {
        // Modo edição
        modalTitle.textContent = 'Editar Usuário';
        const user = users.find(u => u.id === userId);
        
        nomeInput.value = user.nome;
        emailInput.value = user.email;
        funcaoSelect.value = user.funcao;
        statusSelect.value = user.status;
      } else {
        // Modo adição
        modalTitle.textContent = 'Novo Usuário';
        nomeInput.value = '';
        emailInput.value = '';
        funcaoSelect.value = 'Operador';
        statusSelect.value = 'Ativo';
      }
      
      userModal.classList.remove('hidden');
    }

    // Função para fechar o modal de adição/edição
    function closeUserModal() {
      userModal.classList.add('hidden');
      currentUserId = null;
    }

    // Função para validar o formulário
    function validateForm() {
      let isValid = true;
      
      // Validar nome
      if (!nomeInput.value.trim()) {
        nomeError.classList.remove('hidden');
        isValid = false;
      } else {
        nomeError.classList.add('hidden');
      }
      
      // Validar email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailInput.value.trim() || !emailRegex.test(emailInput.value)) {
        emailError.classList.remove('hidden');
        isValid = false;
      } else {
        emailError.classList.add('hidden');
      }
      
      return isValid;
    }

    // Função para salvar usuário (adicionar ou editar)
    function saveUser() {
      if (!validateForm()) {
        return;
      }
      
      const userData = {
        nome: nomeInput.value.trim(),
        email: emailInput.value.trim(),
        funcao: funcaoSelect.value,
        status: statusSelect.value
      };
      
      if (currentUserId) {
        // Atualizar usuário existente
        const userIndex = users.findIndex(u => u.id === currentUserId);
        users[userIndex] = { ...users[userIndex], ...userData };
        showNotification('Usuário atualizado com sucesso!');
      } else {
        // Adicionar novo usuário
        const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
        users.push({ id: newId, ...userData });
        showNotification('Usuário adicionado com sucesso!');
      }
      
      renderUserTable();
      closeUserModal();
    }

    // Função para editar usuário
    function editUser(userId) {
      openUserModal(userId);
    }

    // Função para abrir o modal de confirmação de exclusão
    function openDeleteModal(userId) {
      userToDelete = userId;
      const user = users.find(u => u.id === userId);
      document.getElementById('deleteMessage').textContent = `Tem certeza que deseja excluir o usuário "${user.nome}"?`;
      deleteModal.classList.remove('hidden');
    }

    // Função para fechar o modal de confirmação de exclusão
    function closeDeleteModal() {
      deleteModal.classList.add('hidden');
      userToDelete = null;
    }

    // Função para excluir usuário
    function deleteUser() {
      users = users.filter(u => u.id !== userToDelete);
      renderUserTable();
      closeDeleteModal();
      showNotification('Usuário excluído com sucesso!');
    }

    // Função para voltar ao dashboard
    function goToDashboard() {
      // Mostrar notificação
      showNotification('Redirecionando para o Dashboard...');
      
      // Aguardar um pouco para mostrar a notificação
      setTimeout(() => {
        // Tentar redirecionar para o dashboard
        // Altere 'dashboard.html' para o caminho correto do seu dashboard
        window.location.href = 'dashboard.html';
      }, 1000);
    }

    // Event Listeners
    openModalBtn.addEventListener('click', () => openUserModal());
    closeModalBtn.addEventListener('click', closeUserModal);
    cancelBtn.addEventListener('click', closeUserModal);
    saveUserBtn.addEventListener('click', saveUser);
    
    closeDeleteModalBtn.addEventListener('click', closeDeleteModal);
    cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    confirmDeleteBtn.addEventListener('click', deleteUser);
    
    // Botão do dashboard
    backDashboardBtn.addEventListener('click', goToDashboard);
    
    // Botão sair
    document.getElementById('index').addEventListener('click', () => {
      showNotification('Saindo do sistema...');
      // Aqui você redirecionaria para a página de login
      // window.location.href = 'login.html';
    });
    
    // Fechar modais ao clicar fora deles
    window.addEventListener('click', (e) => {
      if (e.target === userModal) {
        closeUserModal();
      }
      if (e.target === deleteModal) {
        closeDeleteModal();
      }
    });

    // Inicializar a tabela
    renderUserTable();
