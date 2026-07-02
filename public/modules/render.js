// render.js

export const renderTaskList = (taskListElement, tasks, editingTaskId, filter = 'all') => {
  taskListElement.innerHTML = '';

  const filteredTasks = tasks.filter(task => {
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  if (filteredTasks.length === 0) {
    taskListElement.innerHTML = `
      <div class="empty-state">
        <svg class="empty-icon" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 20h9M3 20h4M3 16h18M3 12h18M3 8h18M3 4h18"/>
        </svg>
        <p class="empty-message">No tasks yet. Add one above!</p>
      </div>
    `;
    return;
  }

  filteredTasks.forEach(task => {
    const li = document.createElement('li');
    li.className = `task ${task.completed ? 'completed' : ''} ${editingTaskId === task.id ? 'editing' : ''}`;
    li.dataset.id = task.id;

    if (editingTaskId === task.id) {
      li.innerHTML = `
        <div class="task-edit-container">
          <input type="text" class="edit-input" value="${escapeHtml(task.text)}" aria-label="Edit task text">
          <div class="edit-actions">
            <button class="save-btn" aria-label="Save changes" title="Save">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
            </button>
            <button class="cancel-btn" aria-label="Cancel editing" title="Cancel">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        </div>
        <div class="edit-error-msg" style="display: none;" role="alert"></div>
      `;
    } else {
      li.innerHTML = `
        <label class="checkbox-container">
          <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} aria-label="Mark task completed">
          <span class="custom-checkbox"></span>
        </label>
        <span class="task-text">${escapeHtml(task.text)}</span>
        <div class="task-actions">
          <button class="edit-btn" aria-label="Edit task inline" title="Edit">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="delete-btn" aria-label="Delete task permanently" title="Delete">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></polyline><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </button>
        </div>
      `;
    }

    taskListElement.appendChild(li);
  });
};

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
