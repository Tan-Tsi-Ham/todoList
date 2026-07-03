let draggedItem = null;
let touchStartX = 0;
let touchStartY = 0;
let touchDragging = false;

function setupTaskDrag(container) {
    const taskCards = container.querySelectorAll('.task-card');
    taskCards.forEach(card => {
        card.addEventListener('dragstart', handleTaskDragStart);
        card.addEventListener('dragend', handleTaskDragEnd);
        card.addEventListener('dragover', handleTaskDragOver);
        card.addEventListener('drop', handleTaskDrop);
        card.addEventListener('touchstart', handleTouchStart, { passive: false });
        card.addEventListener('touchmove', handleTouchMove, { passive: false });
        card.addEventListener('touchend', handleTouchEnd);
    });
}

function setupGroupDrag(container) {
    const groupCards = container.querySelectorAll('.group-card');
    groupCards.forEach(card => {
        card.addEventListener('dragstart', handleGroupDragStart);
        card.addEventListener('dragend', handleGroupDragEnd);
        card.addEventListener('dragover', handleGroupDragOver);
        card.addEventListener('drop', handleGroupDrop);
        card.addEventListener('touchstart', handleTouchStart, { passive: false });
        card.addEventListener('touchmove', handleTouchMove, { passive: false });
        card.addEventListener('touchend', handleTouchEnd);
    });
}

function handleTaskDragStart(e) {
    draggedItem = e.target.closest('.task-card');
    draggedItem.classList.add('dragging');
}

function handleTaskDragEnd(e) {
    draggedItem.classList.remove('dragging');
    draggedItem = null;
}

function handleTaskDragOver(e) {
    e.preventDefault();
    const card = e.target.closest('.task-card');
    if (card && card !== draggedItem) {
        const container = draggedItem.parentElement;
        const cards = [...container.querySelectorAll('.task-card')];
        const draggedIdx = cards.indexOf(draggedItem);
        const targetIdx = cards.indexOf(card);
        if (draggedIdx < targetIdx) {
            card.after(draggedItem);
        } else {
            card.before(draggedItem);
        }
        updateTaskOrder(container);
    }
}

function handleTaskDrop(e) {
    e.preventDefault();
    const container = draggedItem.parentElement;
    updateTaskOrder(container);
}

function updateTaskOrder(container) {
    const cards = [...container.querySelectorAll('.task-card')];
    const groupId = container.dataset.groupId;
    const tasks = getTasks();
    cards.forEach((card, idx) => {
        const taskId = card.dataset.taskId;
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            if (groupId) {
                const groupTasks = tasks.filter(t => t.groupId === groupId);
                task.order = idx;
            } else {
                task.order = idx;
            }
        }
    });
    saveData();
}

function handleGroupDragStart(e) {
    draggedItem = e.target.closest('.group-card');
    draggedItem.classList.add('dragging');
}

function handleGroupDragEnd(e) {
    draggedItem.classList.remove('dragging');
    draggedItem = null;
}

function handleGroupDragOver(e) {
    e.preventDefault();
    const card = e.target.closest('.group-card');
    if (card && card !== draggedItem) {
        const container = document.getElementById('groups-list');
        const cards = [...container.querySelectorAll('.group-card')];
        const draggedIdx = cards.indexOf(draggedItem);
        const targetIdx = cards.indexOf(card);
        if (draggedIdx < targetIdx) {
            card.after(draggedItem);
        } else {
            card.before(draggedItem);
        }
    }
}

function handleGroupDrop(e) {
    e.preventDefault();
    const container = document.getElementById('groups-list');
    const cards = [...container.querySelectorAll('.group-card')];
    const taskGroups = getTaskGroups();
    cards.forEach((card, idx) => {
        const groupId = card.dataset.groupId;
        const group = taskGroups.find(g => g.id === groupId);
        if (group) {
            group.order = idx;
        }
    });
    saveData();
    render();
}

function handleTouchStart(e) {
    if (e.touches.length !== 1) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchDragging = false;
}

function handleTouchMove(e) {
    if (e.touches.length !== 1) return;
    const deltaX = Math.abs(e.touches[0].clientX - touchStartX);
    const deltaY = Math.abs(e.touches[0].clientY - touchStartY);
    if (deltaX > 10 && deltaX > deltaY * 1.5) {
        touchDragging = true;
        e.preventDefault();
    }
}

function handleTouchEnd(e) {
    if (touchDragging) {
        touchDragging = false;
        const card = e.target.closest('.task-card, .group-card');
        if (card) {
            card.classList.remove('dragging');
        }
    }
}