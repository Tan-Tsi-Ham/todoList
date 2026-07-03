let confirmCallback = null;

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function showConfirm(title, message, callback) {
    document.getElementById('confirm-header').textContent = title;
    document.getElementById('confirm-body').textContent = message;
    confirmCallback = callback;
    document.getElementById('confirm-modal').classList.add('active');
}

function closeConfirm(result) {
    document.getElementById('confirm-modal').classList.remove('active');
    if (confirmCallback) {
        confirmCallback(result);
        confirmCallback = null;
    }
}

function updateStats() {
    const tasks = getTasks();
    const total = tasks.filter(t => !t.movedToHistory).length;
    const completed = tasks.filter(t => !t.movedToHistory && t.completed).length;
    const pending = total - completed;
    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-pending').textContent = pending;
    document.getElementById('stat-completed').textContent = completed;
}