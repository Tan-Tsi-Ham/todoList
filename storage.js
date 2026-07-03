let taskGroups = [];
let tasks = [];

function loadData() {
    try {
        const savedGroups = localStorage.getItem('taskGroups');
        const savedTasks = localStorage.getItem('tasks');
        if (savedGroups) taskGroups = JSON.parse(savedGroups);
        if (savedTasks) tasks = JSON.parse(savedTasks);
    } catch (err) {
        console.error('Failed to load data:', err);
        taskGroups = [];
        tasks = [];
    }
    migrateOldData();
}

function migrateOldData() {
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    let migrated = false;
    
    tasks.forEach(task => {
        if (!task.taskDate && task.showOnHome) {
            task.taskDate = today;
            migrated = true;
        }
    });
    
    taskGroups.forEach(group => {
        if (!group.description) {
            group.description = '';
            migrated = true;
        }
    });
    
    if (migrated) {
        saveData();
    }
}

function saveData() {
    try {
        localStorage.setItem('taskGroups', JSON.stringify(taskGroups));
        localStorage.setItem('tasks', JSON.stringify(tasks));
    } catch (err) {
        console.error('Failed to save data:', err);
        showToast('数据保存失败', 'error');
    }
}

function getTaskGroups() {
    return taskGroups;
}

function setTaskGroups(groups) {
    taskGroups = groups;
}

function getTasks() {
    return tasks;
}

function setTasks(newTasks) {
    tasks = newTasks;
}

function initDefaultGroups() {
    if (taskGroups.length === 0) {
        taskGroups = [
            { id: generateId(), name: '工作', description: '', order: 0, createdAt: new Date().toISOString(), collapsed: true, movedToHistory: false },
            { id: generateId(), name: '生活', description: '', order: 1, createdAt: new Date().toISOString(), collapsed: true, movedToHistory: false },
            { id: generateId(), name: '学习', description: '', order: 2, createdAt: new Date().toISOString(), collapsed: true, movedToHistory: false }
        ];
        saveData();
    }
}