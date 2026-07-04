function init() {
    loadData();
    initDefaultGroups();
    checkDailyRefresh();
    render();
    setupNavigation();
    setupKeyboardShortcuts();
}

function setupNavigation() {
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const page = tab.dataset.page;
            switchPage(page);
        });
    });
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case 'n':
                    e.preventDefault();
                    openTaskModal();
                    break;
                case 'g':
                    e.preventDefault();
                    openGroupModal();
                    break;
                case '1':
                    e.preventDefault();
                    switchPage('home');
                    break;
                case '2':
                    e.preventDefault();
                    switchPage('groups');
                    break;
                case '3':
                    e.preventDefault();
                    switchPage('history');
                    break;
                case 'e':
                    e.preventDefault();
                    exportData();
                    break;
                case 'i':
                    e.preventDefault();
                    openImportModal();
                    break;
            }
        }
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.active, .confirm-modal.active').forEach(el => {
                el.classList.remove('active');
            });
        }
    });
}

function getTodayDateString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function checkDailyRefresh() {
    const today = new Date();
    const todayStr = today.toDateString();
    const todayDateStr = getTodayDateString();
    const lastRefresh = localStorage.getItem('lastDailyRefresh');
    const dayOfWeek = today.getDay();
    const dayMap = { 0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat' };
    const currentDayKey = dayMap[dayOfWeek];
    
    if (lastRefresh !== todayStr) {
        const tasks = getTasks();
        tasks.forEach(task => {
            if (!task.completedDates) {
                task.completedDates = [];
            }
            if (!task.completed && task.taskDate) {
                const taskDate = new Date(task.taskDate);
                const todayStart = new Date(todayDateStr);
                if (taskDate < todayStart && !task.repeatType) {
                    task.taskDate = todayDateStr;
                }
            }
        });
        saveData();
        localStorage.setItem('lastDailyRefresh', todayStr);
    }

    localStorage.setItem('lastWeeklyRefreshDate', todayStr);
}

function exportData() {
    const taskGroups = getTaskGroups();
    const tasks = getTasks();
    const data = {
        version: '1.0',
        exportTime: new Date().toISOString(),
        taskGroups: taskGroups,
        tasks: tasks
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `todolist-backup-${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function saveTask() {
    const title = document.getElementById('task-title').value.trim();
    const description = document.getElementById('task-description').value.trim();
    const groupId = document.getElementById('task-group').value;
    const endTime = document.getElementById('task-end').value;
    const repeatType = document.querySelector('input[name="task-repeat"]:checked').value;
    const taskId = editingTaskId;

    let taskDate = document.getElementById('task-date').value || null;
    if (repeatType !== 'none') {
        taskDate = taskDate || getTodayDateString();
    }

    let repeatDays = [];
    if (repeatType === 'weekly') {
        const dayCheckboxes = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        dayCheckboxes.forEach(day => {
            if (document.getElementById(`task-repeat-${day}`).checked) {
                repeatDays.push(day);
            }
        });
        if (repeatDays.length === 0) {
            showToast('请至少选择一个重复的星期', 'warning');
            return;
        }
    }

    if (!title || !groupId) {
        showToast('请填写必填项', 'warning');
        return;
    }

    const tasks = getTasks();

    if (taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            task.title = title;
            task.description = description;
            task.groupId = groupId;
            task.taskDate = taskDate;
            task.endTime = endTime ? new Date(endTime).toISOString() : null;
            task.repeatType = repeatType;
            task.repeatDays = repeatDays.length > 0 ? repeatDays : undefined;
            if (!task.completedDates) {
                task.completedDates = [];
            }
            delete task.dailyRefresh;
            delete task.dependsOnPrev;
        }
    } else {
        const maxOrder = Math.max(...tasks.map(t => t.order), -1);
        tasks.push({
            id: generateId(),
            title,
            description,
            groupId,
            taskDate,
            endTime: endTime ? new Date(endTime).toISOString() : null,
            repeatType,
            repeatDays: repeatDays.length > 0 ? repeatDays : undefined,
            completed: false,
            completedDates: [],
            order: maxOrder + 1,
            createdAt: new Date().toISOString()
        });
    }

    saveData();
    closeTaskModal();
    render();
    showToast(taskId ? '任务更新成功' : '任务创建成功', 'success');
}

function saveGroup() {
    const name = document.getElementById('group-name').value.trim();
    const description = document.getElementById('group-description').value.trim();
    const groupId = editingGroupId;

    if (!name) {
        showToast('请输入任务组名称', 'warning');
        return;
    }

    const taskGroups = getTaskGroups();

    if (groupId) {
        const group = taskGroups.find(g => g.id === groupId);
        if (group) {
            group.name = name;
            group.description = description;
        }
    } else {
        const maxOrder = Math.max(...taskGroups.map(g => g.order), -1);
        taskGroups.push({
            id: generateId(),
            name,
            description,
            order: maxOrder + 1,
            createdAt: new Date().toISOString(),
            collapsed: true,
            movedToHistory: false
        });
    }

    saveData();
    closeGroupModal();
    render();
    showToast(groupId ? '任务组更新成功' : '任务组创建成功', 'success');
}

function toggleTask(taskId) {
    const tasks = getTasks();
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        const todayStr = getTodayDateString();
        if (!task.completedDates) {
            task.completedDates = [];
        }
        
        if (task.repeatType && task.repeatType !== 'none') {
            const dateIndex = task.completedDates.indexOf(todayStr);
            if (dateIndex >= 0) {
                task.completedDates.splice(dateIndex, 1);
            } else {
                task.completedDates.push(todayStr);
            }
        } else {
            task.completed = !task.completed;
        }
        
        const isCompletedToday = task.repeatType && task.repeatType !== 'none' 
            ? task.completedDates.includes(todayStr)
            : task.completed;
        
        if (!isCompletedToday && task.movedToHistory) {
            task.movedToHistory = false;
        }
        saveData();
        render();
    }
}

function moveToHistory(taskId) {
    const tasks = getTasks();
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.movedToHistory = true;
        saveData();
        render();
    }
}

function moveGroupToHistory(groupId) {
    showConfirm('移入历史', '确定要将这个任务组移入历史吗？', (result) => {
        if (result) {
            const taskGroups = getTaskGroups();
            const tasks = getTasks();
            const group = taskGroups.find(g => g.id === groupId);
            if (group) {
                group.movedToHistory = true;
                tasks.forEach(task => {
                    if (task.groupId === groupId) {
                        task.movedToHistory = true;
                    }
                });
                saveData();
                render();
                showToast('任务组已移入历史', 'info');
            }
        }
    });
}

function moveOutOfHistory(taskId) {
    const tasks = getTasks();
    const taskGroups = getTaskGroups();
    const task = tasks.find(t => t.id === taskId);
    if (task && task.groupId) {
        const group = taskGroups.find(g => g.id === task.groupId);
        if (group && group.movedToHistory) {
            showConfirm('移出历史', '该任务属于已移入历史的任务组，确定要将整个任务组移出历史吗？', (result) => {
                if (result) {
                    moveGroupOutOfHistory(task.groupId);
                }
            });
            return;
        }
    }
    if (task) {
        task.movedToHistory = false;
        saveData();
        render();
        showToast('任务已移出历史', 'success');
    }
}

function moveGroupOutOfHistory(groupId) {
    const taskGroups = getTaskGroups();
    const tasks = getTasks();
    const group = taskGroups.find(g => g.id === groupId);
    if (group) {
        group.movedToHistory = false;
    }
    tasks.forEach(task => {
        if (task.groupId === groupId) {
            task.movedToHistory = false;
        }
    });
    saveData();
    render();
    showToast('任务组已移出历史', 'success');
}

function deleteTask(taskId) {
    showConfirm('删除任务', '确定要删除这个任务吗？', (result) => {
        if (result) {
            const tasks = getTasks();
            setTasks(tasks.filter(t => t.id !== taskId));
            saveData();
            render();
            showToast('任务已删除', 'success');
        }
    });
}

function deleteGroup(groupId) {
    const tasks = getTasks();
    const hasTasks = tasks.some(t => t.groupId === groupId);
    if (hasTasks) {
        showConfirm('删除任务组', '该任务组下还有任务，确定要删除任务组及其所有任务吗？', (result) => {
            if (result) {
                const taskGroups = getTaskGroups();
                setTasks(tasks.filter(t => t.groupId !== groupId));
                setTaskGroups(taskGroups.filter(g => g.id !== groupId));
                saveData();
                render();
                showToast('任务组已删除', 'success');
            }
        });
    } else {
        showConfirm('删除任务组', '确定要删除这个任务组吗？', (result) => {
            if (result) {
                const taskGroups = getTaskGroups();
                setTaskGroups(taskGroups.filter(g => g.id !== groupId));
                saveData();
                render();
                showToast('任务组已删除', 'success');
            }
        });
    }
}