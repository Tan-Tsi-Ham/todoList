let editingTaskId = null;
let editingGroupId = null;
let pendingImportData = null;

function openTaskModal(taskId = null, groupId = null) {
    editingTaskId = taskId;
    const modal = document.getElementById('task-modal');
    const title = document.getElementById('task-modal-title');
    const groupSelect = document.getElementById('task-group');
    const taskGroups = getTaskGroups();
    
    groupSelect.innerHTML = taskGroups
        .sort((a, b) => a.order - b.order)
        .map(g => `<option value="${g.id}">${escapeHtml(g.name)}</option>`)
        .join('');

    const dayCheckboxes = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    dayCheckboxes.forEach(day => {
        document.getElementById(`task-repeat-${day}`).checked = false;
    });

    if (taskId) {
        const tasks = getTasks();
        title.textContent = '编辑任务';
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            document.getElementById('task-title').value = task.title;
            document.getElementById('task-description').value = task.description || '';
            document.getElementById('task-group').value = task.groupId;
            document.getElementById('task-date').value = task.taskDate || '';
            document.getElementById('task-end').value = task.endTime ? formatLocalDateTime(task.endTime) : '';
            const repeatType = task.repeatType || (task.dailyRefresh ? 'daily' : 'none');
            document.querySelector(`input[name="task-repeat"][value="${repeatType}"]`).checked = true;
            if (task.repeatDays && Array.isArray(task.repeatDays)) {
                task.repeatDays.forEach(day => {
                    const checkbox = document.getElementById(`task-repeat-${day}`);
                    if (checkbox) checkbox.checked = true;
                });
            }
            
        }
    } else {
        title.textContent = '新建任务';
        document.getElementById('task-form').reset();
        document.getElementById('task-date').value = '';
        document.querySelector('input[name="task-repeat"][value="none"]').checked = true;
        if (groupId) {
            document.getElementById('task-group').value = groupId;
        }
    }
    toggleWeeklyDays();
    modal.classList.add('active');
}

function closeTaskModal() {
    document.getElementById('task-modal').classList.remove('active');
    editingTaskId = null;
}

function clearTaskDate() {
    document.getElementById('task-date').value = '';
}

function openGroupModal(groupId = null) {
    editingGroupId = groupId;
    const modal = document.getElementById('group-modal');
    const title = document.getElementById('group-modal-title');

    if (groupId) {
        const taskGroups = getTaskGroups();
        title.textContent = '编辑任务组';
        const group = taskGroups.find(g => g.id === groupId);
        if (group) {
            document.getElementById('group-name').value = group.name;
            document.getElementById('group-description').value = group.description || '';
        }
    } else {
        title.textContent = '新建任务组';
        document.getElementById('group-form').reset();
    }
    modal.classList.add('active');
}

function closeGroupModal() {
    document.getElementById('group-modal').classList.remove('active');
    editingGroupId = null;
}

function openImportModal() {
    pendingImportData = null;
    document.getElementById('import-file').value = '';
    document.getElementById('import-preview').innerHTML = '';
    document.getElementById('import-modal').classList.add('active');
}

function closeImportModal() {
    document.getElementById('import-modal').classList.remove('active');
    pendingImportData = null;
    document.getElementById('import-file').value = '';
    document.getElementById('import-preview').innerHTML = '';
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (!data.taskGroups || !data.tasks) {
                showToast('文件格式不正确，缺少必要的数据字段', 'error');
                return;
            }
            pendingImportData = data;
            const preview = document.getElementById('import-preview');
            preview.innerHTML = `
                <div style="background: var(--gray-50); padding: 16px; border-radius: 10px;">
                    <div style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">数据预览：</div>
                    <div style="font-size: 13px; color: var(--gray-600);">
                        <div>📁 任务组：${data.taskGroups.length} 个</div>
                        <div>📝 任务：${data.tasks.length} 个</div>
                        ${data.exportTime ? `<div style="margin-top: 4px; font-size: 12px; color: var(--gray-400);">导出时间：${new Date(data.exportTime).toLocaleString()}</div>` : ''}
                    </div>
                </div>
            `;
        } catch (err) {
            showToast('文件解析失败，请确保是有效的 JSON 文件', 'error');
            console.error(err);
        }
    };
    reader.readAsText(file);
}

function confirmImport() {
    if (!pendingImportData) {
        showToast('请先选择一个有效的备份文件', 'warning');
        return;
    }
    showConfirm('确认导入', `确定要导入数据吗？这将覆盖当前所有数据。\n\n将导入：\n- ${pendingImportData.taskGroups.length} 个任务组\n- ${pendingImportData.tasks.length} 个任务`, (result) => {
        if (result) {
            setTaskGroups(pendingImportData.taskGroups);
            setTasks(pendingImportData.tasks);
            saveData();
            closeImportModal();
            render();
            showToast('数据导入成功！', 'success');
        }
    });
}