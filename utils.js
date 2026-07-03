function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDateTime(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = new Date(now.getTime() + 86400000).toDateString() === date.toDateString();
    
    let dateStr;
    if (isToday) {
        dateStr = '今天';
    } else if (isTomorrow) {
        dateStr = '明天';
    } else {
        dateStr = `${date.getMonth() + 1}月${date.getDate()}日`;
    }
    
    const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    return `${dateStr} ${timeStr}`;
}

function formatLocalDateTime(isoString) {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function toggleWeeklyDays() {
    const repeatType = document.querySelector('input[name="task-repeat"]:checked').value;
    const weeklyDaysGroup = document.getElementById('weekly-days-group');
    weeklyDaysGroup.style.display = repeatType === 'weekly' ? 'block' : 'none';
}