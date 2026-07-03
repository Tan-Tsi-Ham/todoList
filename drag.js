let draggedItem = null;

function setupTaskDrag(container) {
    const taskCards = container.querySelectorAll('.task-card');
    taskCards.forEach(card => {
        card.addEventListener('dragstart', handleTaskDragStart);
        card.addEventListener('dragend', handleTaskDragEnd);
        card.addEventListener('dragover', handleTaskDragOver);
        card.addEventListener('drop', handleTaskDrop);
    });
}

function setupGroupDrag(container) {
    const groupCards = container.querySelectorAll('.group-card');
    groupCards.forEach(card => {
        card.addEventListener('dragstart', handleGroupDragStart);
        card.addEventListener('dragend', handleGroupDragEnd);
        card.addEventListener('dragover', handleGroupDragOver);
        card.addEventListener('drop', handleGroupDrop);
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