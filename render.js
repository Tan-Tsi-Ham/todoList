let currentPage = 'home';
let selectedDate = getTodayString();

function getTodayString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function sortTasks(a, b) {
    if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
    }
    const aEnd = a.endTime ? new Date(a.endTime) : new Date('9999-12-31');
    const bEnd = b.endTime ? new Date(b.endTime) : new Date('9999-12-31');
    if (aEnd.getTime() !== bEnd.getTime()) {
        return aEnd.getTime() - bEnd.getTime();
    }
    const aCreated = new Date(a.createdAt || 0);
    const bCreated = new Date(b.createdAt || 0);
    return bCreated.getTime() - aCreated.getTime();
}

function render() {
    const datePicker = document.getElementById('date-picker');
    if (datePicker && !datePicker.value) {
        datePicker.value = selectedDate;
    }
    renderCurrentPage();
    updateStats();
}

function renderCurrentPage() {
    switch (currentPage) {
        case 'home':
            renderHomePage();
            break;
        case 'groups':
            renderGroupsPage();
            break;
        case 'history':
            renderHistoryPage();
            break;
    }
    updateStats();
}

function switchPage(page) {
    currentPage = page;
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.page === page);
    });
    document.querySelectorAll('.page').forEach(p => {
        p.classList.toggle('active', p.id === `page-${page}`);
    });
    renderCurrentPage();
}

function changeDate(days) {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    selectedDate = date.toISOString().split('T')[0];
    const datePicker = document.getElementById('date-picker');
    if (datePicker) {
        datePicker.value = selectedDate;
    }
    renderHomePage();
}

function handleDateChange() {
    const datePicker = document.getElementById('date-picker');
    if (datePicker && datePicker.value) {
        selectedDate = datePicker.value;
        renderHomePage();
    }
}

function resetToToday() {
    selectedDate = getTodayString();
    const datePicker = document.getElementById('date-picker');
    if (datePicker) {
        datePicker.value = selectedDate;
    }
    renderHomePage();
}

function isTaskVisibleOnDate(task, dateStr) {
    if (!task.taskDate) {
        return false;
    }
    
    const repeatType = task.repeatType || (task.dailyRefresh ? 'daily' : 'none');
    
    if (repeatType === 'none') {
        return task.taskDate === dateStr;
    }
    
    if (repeatType === 'daily') {
        return dateStr >= task.taskDate;
    }
    
    if (repeatType === 'weekly') {
        const repeatDays = task.repeatDays || [];
        if (repeatDays.length === 0) {
            return false;
        }
        
        if (dateStr < task.taskDate) {
            return false;
        }
        
        const targetDate = new Date(dateStr);
        const dayMap = { 0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat' };
        const targetDay = dayMap[targetDate.getDay()];
        return repeatDays.includes(targetDay);
    }
    
    return false;
}

function renderHomePage() {
    const container = document.getElementById('home-tasks');
    const searchQuery = document.getElementById('home-search')?.value.toLowerCase() || '';
    const tasks = getTasks();
    
    const todayTasks = tasks
        .filter(t => isTaskVisibleOnDate(t, selectedDate) && !t.movedToHistory)
        .filter(t => searchQuery === '' || t.title.toLowerCase().includes(searchQuery) || 
                   (t.description && t.description.toLowerCase().includes(searchQuery)))
        .sort(sortTasks);

    const dateStr = formatDateDisplay(selectedDate);

    const completedCount = todayTasks.filter(t => {
        if (t.repeatType && t.repeatType !== 'none') {
            return (t.completedDates || []).includes(selectedDate);
        }
        return t.completed;
    }).length;
    const totalCount = todayTasks.length;

    if (todayTasks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">${searchQuery ? '🔍' : '🎉'}</div>
                <div class="empty-state-text">${searchQuery ? '没有找到匹配的任务' : `${dateStr}还没有任务，快添加一个吧！`}</div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="daily-stats">
            <span class="daily-stat-item">
                <strong>${completedCount}/${totalCount}</strong> 已完成
            </span>
            <span class="daily-stat-item">
                <strong>${totalCount - completedCount}</strong> 待完成
            </span>
        </div>
        ${todayTasks.map(task => renderTaskCard(task)).join('')}
    `;
}

function formatDateDisplay(dateStr) {
    const date = new Date(dateStr);
    const today = new Date(getTodayString());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (dateStr === getTodayString()) {
        return '今天';
    } else if (dateStr === tomorrow.toISOString().split('T')[0]) {
        return '明天';
    } else {
        const options = { month: 'long', day: 'numeric', weekday: 'short' };
        return date.toLocaleDateString('zh-CN', options);
    }
}

function renderTaskCard(task) {
    const taskGroups = getTaskGroups();
    const group = taskGroups.find(g => g.id === task.groupId);
    
    const isCompletedToday = task.repeatType && task.repeatType !== 'none' 
        ? (task.completedDates || []).includes(selectedDate)
        : task.completed;
        
    const isOverdue = task.endTime && new Date(task.endTime) < new Date() && !isCompletedToday;

    return `
        <div class="task-card ${isCompletedToday ? 'completed' : ''}" 
             data-task-id="${task.id}">
            <div class="task-header">
                <div class="task-checkbox ${isCompletedToday ? 'checked' : ''}" 
                     onclick="toggleTask('${task.id}')"></div>
                <div class="task-content">
                    <div class="task-title">${escapeHtml(task.title)}</div>
                    ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
                    <div class="task-meta">
                        <span class="task-meta-item">
                            <span class="task-group-tag">${escapeHtml(group?.name || '未分组')}</span>
                        </span>
                        ${task.repeatType && task.repeatType !== 'none' ? `
                            <span class="task-meta-item">
                                <span class="task-repeat-tag">🔄 ${task.repeatType === 'daily' ? '每日重复' : '每周重复'}</span>
                            </span>
                        ` : ''}
                        ${task.endTime ? `
                            <span class="task-due ${isOverdue ? 'overdue' : ''}">
                                ⏰ ${formatDateTime(task.endTime)}
                            </span>
                        ` : ''}
                    </div>
                </div>
                <div class="task-actions">
                    <button class="btn btn-icon" onclick="openTaskModal('${task.id}')">✏️</button>
                    ${task.taskDate ? `${task.taskDate ? `<span class="task-date-tag">📅 ${task.taskDate}</span>` : '<span class="task-date-tag">📅 未安排</span>'}` : '<span class="task-date-tag">📅 未安排</span>'}
                    ${isCompletedToday ? `<button class="btn btn-icon" onclick="moveToHistory('${task.id}')" title="移入历史">📜</button>` : ''}
                    <button class="btn btn-icon danger" onclick="deleteTask('${task.id}')">🗑️</button>
                </div>
            </div>
        </div>
    `;
}

function renderGroupsPage() {
    const container = document.getElementById('groups-list');
    const searchQuery = document.getElementById('groups-search')?.value.toLowerCase() || '';
    const taskGroups = getTaskGroups();
    const tasks = getTasks();
    
    const sortedGroups = [...taskGroups]
        .filter(group => !group.movedToHistory)
        .sort(sortTasks);

    const filteredGroups = sortedGroups.filter(group => {
        if (searchQuery === '') return true;
        if (group.name.toLowerCase().includes(searchQuery)) return true;
        const groupTasks = tasks.filter(t => t.groupId === group.id && !t.movedToHistory);
        return groupTasks.some(t => t.title.toLowerCase().includes(searchQuery) || 
            (t.description && t.description.toLowerCase().includes(searchQuery)));
    });

    if (filteredGroups.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">${searchQuery ? '🔍' : '📁'}</div>
                <div class="empty-state-text">${searchQuery ? '没有找到匹配的任务组或任务' : '还没有任务组，快创建一个吧！'}</div>
            </div>
        `;
        return;
    }

    container.innerHTML = filteredGroups.map(group => {
        const groupTasks = tasks
            .filter(t => t.groupId === group.id && !t.movedToHistory)
            .filter(t => searchQuery === '' || t.title.toLowerCase().includes(searchQuery) || 
                       (t.description && t.description.toLowerCase().includes(searchQuery)))
            .sort(sortTasks);
        const isCollapsed = group.collapsed !== false;
        const allGroupTasks = tasks.filter(t => t.groupId === group.id && !t.movedToHistory);
        const completedCount = allGroupTasks.filter(t => {
            if (t.repeatType && t.repeatType !== 'none') {
                return (t.completedDates || []).includes(selectedDate);
            }
            return t.completed;
        }).length;
        return `
            <div class="group-card ${isCollapsed ? 'collapsed' : ''}" data-group-id="${group.id}">
                <div class="group-header" onclick="toggleGroupCollapse('${group.id}')">
                    <div class="group-title-wrapper">
                        <span class="collapse-icon">▼</span>
                        <h3 class="group-title">${escapeHtml(group.name)}</h3>
                        <span style="font-size: 12px; color: var(--gray-400); margin-left: 8px;">
                            (${completedCount}/${allGroupTasks.length})
                        </span>
                    </div>
                    <div class="group-actions" onclick="event.stopPropagation()">
                        <button class="btn btn-primary" onclick="openTaskModal(null, '${group.id}')">➕</button>
                        <button class="btn btn-icon" onclick="openGroupModal('${group.id}')">✏️</button>
                        <button class="btn btn-icon" onclick="moveGroupToHistory('${group.id}')" title="移入历史">📜</button>
                        <button class="btn btn-icon danger" onclick="deleteGroup('${group.id}')">🗑️</button>
                    </div>
                </div>
                ${group.description ? `<div class="group-description">${escapeHtml(group.description)}</div>` : ''}
                <div class="group-tasks" data-group-id="${group.id}">
                    ${groupTasks.length === 0 ? `
                        <div class="empty-state" style="padding: 30px 20px;">
                            <div class="empty-state-text">${searchQuery ? '该组没有匹配的任务' : '该组暂无任务'}</div>
                        </div>
                    ` : groupTasks.map(task => renderTaskCard(task)).join('')}
                </div>
            </div>
        `;
    }).join('');

    setupGroupDrag(container);
}

function renderHistoryPage() {
    const container = document.getElementById('history-tasks');
    const searchQuery = document.getElementById('history-search')?.value.toLowerCase() || '';
    const now = new Date();
    const tasks = getTasks();
    const taskGroups = getTaskGroups();
    
    const historyTasks = tasks
        .filter(t => {
            const group = t.groupId ? taskGroups.find(g => g.id === t.groupId) : null;
            const isCompletedToday = t.repeatType && t.repeatType !== 'none' 
                ? (t.completedDates || []).includes(selectedDate)
                : t.completed;
            return (t.endTime && new Date(t.endTime) < now && !isCompletedToday) || 
                   t.movedToHistory || 
                   (group && group.movedToHistory);
        })
        .filter(t => searchQuery === '' || t.title.toLowerCase().includes(searchQuery) || 
                   (t.description && t.description.toLowerCase().includes(searchQuery)));

    if (historyTasks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">${searchQuery ? '🔍' : '✨'}</div>
                <div class="empty-state-text">${searchQuery ? '没有找到匹配的历史任务' : '没有历史任务，做得很好！'}</div>
            </div>
        `;
        return;
    }

    const movedGroups = taskGroups.filter(g => g.movedToHistory);
    const tasksByGroup = {};
    
    movedGroups.forEach(group => {
        const groupTasks = tasks.filter(t => t.groupId === group.id);
        if (groupTasks.length > 0) {
            tasksByGroup[group.id] = groupTasks;
        }
    });

    historyTasks.forEach(task => {
        if (!task.groupId || !taskGroups.find(g => g.id === task.groupId)?.movedToHistory) {
            const groupId = task.groupId || 'ungrouped';
            if (!tasksByGroup[groupId]) {
                tasksByGroup[groupId] = [];
            }
            if (!tasksByGroup[groupId].find(t => t.id === task.id)) {
                tasksByGroup[groupId].push(task);
            }
        }
    });

    const groupIds = Object.keys(tasksByGroup).sort((a, b) => {
        if (a === 'ungrouped') return 1;
        if (b === 'ungrouped') return -1;
        const groupA = taskGroups.find(g => g.id === a);
        const groupB = taskGroups.find(g => g.id === b);
        return (groupA?.order || 0) - (groupB?.order || 0);
    });

    container.innerHTML = groupIds.map(groupId => {
        const group = groupId === 'ungrouped' ? null : taskGroups.find(g => g.id === groupId);
        const allGroupTasks = tasksByGroup[groupId];
        const groupTasks = allGroupTasks
            .filter(t => searchQuery === '' || t.title.toLowerCase().includes(searchQuery) || 
                       (t.description && t.description.toLowerCase().includes(searchQuery)))
            .sort(sortTasks);
        const completedCount = allGroupTasks.filter(t => {
            if (t.repeatType && t.repeatType !== 'none') {
                return (t.completedDates || []).includes(selectedDate);
            }
            return t.completed;
        }).length;
        return `
            <div class="group-card collapsed" data-group-id="${groupId}">
                <div class="group-header" onclick="toggleHistoryGroupCollapse('${groupId}')">
                    <div class="group-title-wrapper">
                        <span class="collapse-icon">▼</span>
                        <h3 class="group-title">${escapeHtml(group?.name || '未分组')}</h3>
                        <span style="font-size: 12px; color: var(--gray-400); margin-left: 8px;">
                            (${completedCount}/${allGroupTasks.length})
                        </span>
                    </div>
                    <div class="group-actions" onclick="event.stopPropagation()">
                        <button class="btn btn-primary" onclick="moveGroupOutOfHistory('${groupId}')" title="移出历史">↩️</button>
                    </div>
                </div>
                ${group && group.description ? `<div class="group-description">${escapeHtml(group.description)}</div>` : ''}
                <div class="group-tasks" data-group-id="${groupId}">
                    ${groupTasks.map(task => {
                        const isCompletedToday = task.repeatType && task.repeatType !== 'none' 
                            ? (task.completedDates || []).includes(selectedDate)
                            : task.completed;
                        return `
                            <div class="task-card ${isCompletedToday ? 'completed' : ''}" data-task-id="${task.id}">
                                <div class="task-header">
                                    <div class="task-checkbox ${isCompletedToday ? 'checked' : ''}" 
                                         onclick="toggleTask('${task.id}')"></div>
                                    <div class="task-content">
                                        <div class="task-title">${escapeHtml(task.title)}</div>
                                        ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
                                        <div class="task-meta">
                                            ${task.endTime ? `
                                                <span class="task-due">
                                                    ⏰ ${formatDateTime(task.endTime)}
                                                </span>
                                            ` : ''}
                                            ${task.completed && task.movedToHistory ? `
                                                <span class="task-meta-item">📜 已移入历史</span>
                                            ` : ''}
                                        </div>
                                    </div>
                                    <div class="task-actions">
                                        <button class="btn btn-icon" onclick="openTaskModal('${task.id}')">✏️</button>
                                        ${task.taskDate ? `<span class="task-date-tag">📅 ${task.taskDate}</span>` : '<span class="task-date-tag">📅 未安排</span>'}
                                        <button class="btn btn-icon" onclick="moveOutOfHistory('${task.id}')" title="移出历史">↩️</button>
                                        <button class="btn btn-icon danger" onclick="deleteTask('${task.id}')">🗑️</button>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }).join('');
}

function toggleGroupCollapse(groupId) {
    if (draggedItem) return;
    const taskGroups = getTaskGroups();
    const group = taskGroups.find(g => g.id === groupId);
    if (group) {
        group.collapsed = !group.collapsed;
        saveData();
        renderGroupsPage();
    }
}

function toggleHistoryGroupCollapse(groupId) {
    const container = document.getElementById('history-tasks');
    const groupCard = container.querySelector(`.group-card[data-group-id="${groupId}"]`);
    if (groupCard) {
        groupCard.classList.toggle('collapsed');
    }
}