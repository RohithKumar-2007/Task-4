// app.js
import { renderTaskList } from './modules/render.js';
import { validateTaskInput, clearError } from './modules/validation.js';

document.addEventListener('DOMContentLoaded', () => {
  const taskForm = document.getElementById('task-form');
  const taskInput = document.getElementById('task-input');
  const errorMsg = document.getElementById('error-msg');
  const taskList = document.getElementById('task-list');
  const taskCounter = document.getElementById('task-counter');
  const clearCompletedBtn = document.getElementById('clear-completed');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const themeToggleBtn = document.getElementById('theme-toggle');
  const sunIcon = themeToggleBtn.querySelector('.sun-icon');
  const moonIcon = themeToggleBtn.querySelector('.moon-icon');
  const undoBtn = document.getElementById('undo-btn');
  const redoBtn = document.getElementById('redo-btn');

  const API_URL = '/api/tasks';

  // Application State
  let tasks = [];
  let editingTaskId = null;
  let currentFilter = 'all';
  let isSyncing = false; // Prevents overlapping sync operations

  // History stack for Undo/Redo (deep copy of states)
  let undoStack = [];
  let redoStack = [];

  // Theme Management
  const currentTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);
  updateThemeIcons(currentTheme);

  themeToggleBtn.addEventListener('click', () => {
    const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    updateThemeIcons(theme);
  });

  function updateThemeIcons(theme) {
    if (theme === 'dark') {
      sunIcon.style.display = 'inline-block';
      moonIcon.style.display = 'none';
    } else {
      sunIcon.style.display = 'none';
      moonIcon.style.display = 'inline-block';
    }
  }

  // Load initial tasks from the cloud database
  async function fetchTasks() {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Failed to fetch tasks');
      tasks = await response.json();
      updateCounter();
      render();
    } catch (err) {
      showError(errorMsg, 'Connection error: Could not load tasks from database.');
      console.error(err);
    }
  }

  // Helper: Deep clone state to push to history stacks
  function cloneState(state) {
    return state.map(t => ({ ...t }));
  }

  function pushState() {
    undoStack.push(cloneState(tasks));
    redoStack = []; // Clear redo stack on new actions
    updateUndoRedoButtons();
  }

  function updateUndoRedoButtons() {
    undoBtn.disabled = undoStack.length === 0;
    redoBtn.disabled = redoStack.length === 0;
  }

  // State Reconciler: Synchronizes local history state with the MongoDB cloud database
  async function syncStateWithBackend(targetTasks) {
    if (isSyncing) return;
    isSyncing = true;
    showLoadingState(true);

    try {
      // 1. Fetch current database state to perform a diff
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Database fetch failed');
      const dbTasks = await response.json();

      // 2. Identify deletions (exists in DB, but not in target state)
      const deletions = dbTasks.filter(dbT => !targetTasks.some(targetT => targetT.id === dbT.id));
      for (const t of deletions) {
        await fetch(`${API_URL}/${t.id}`, { method: 'DELETE' });
      }

      // 3. Identify updates and insertions
      for (const targetT of targetTasks) {
        const dbMatch = dbTasks.find(dbT => dbT.id === targetT.id);
        if (dbMatch) {
          // If properties differ, update
          if (dbMatch.text !== targetT.text || dbMatch.completed !== targetT.completed) {
            await fetch(`${API_URL}/${targetT.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: targetT.text, completed: targetT.completed })
            });
          }
        } else {
          // Insert missing task with original text/completed state
          const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: targetT.text })
          });
          if (res.ok && targetT.completed) {
            // If the restored task was completed, update it
            const createdTask = await res.json();
            await fetch(`${API_URL}/${createdTask.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ completed: true })
            });
          }
        }
      }

      // 4. Reload final synchronized state from database
      await fetchTasks();
    } catch (err) {
      showError(errorMsg, 'Sync Error: Failed to restore state in MongoDB.');
      console.error(err);
    } finally {
      isSyncing = false;
      showLoadingState(false);
    }
  }

  async function undo() {
    if (undoStack.length === 0 || isSyncing) return;
    const previous = undoStack.pop();
    redoStack.push(cloneState(tasks));
    updateUndoRedoButtons();
    await syncStateWithBackend(previous);
  }

  async function redo() {
    if (redoStack.length === 0 || isSyncing) return;
    const next = redoStack.pop();
    undoStack.push(cloneState(tasks));
    updateUndoRedoButtons();
    await syncStateWithBackend(next);
  }

  // Show a loading/syncing spinner indicator
  function showLoadingState(show) {
    if (show) {
      taskCounter.textContent = 'Syncing cloud DB...';
    } else {
      updateCounter();
    }
  }

  function updateCounter() {
    const activeCount = tasks.filter(t => !t.completed).length;
    taskCounter.textContent = `${activeCount} active task${activeCount === 1 ? '' : 's'} left`;
  }

  // Load initial tasks from the cloud database
  function render() {
    renderTaskList(taskList, tasks, editingTaskId, currentFilter);
  }

  function showError(element, message) {
    element.textContent = message;
    element.style.display = 'block';
  }

  // Handle Form Submission (Add Task)
  taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = taskInput.value.trim();
    
    // Client-side validation check
    const validation = validateTaskInput(text);
    if (!validation.isValid) {
      showError(errorMsg, validation.message);
      return;
    }
    clearError(errorMsg);

    try {
      pushState();
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details?.join(', ') || errorData.error || 'Failed to create task');
      }

      const newTask = await response.json();
      tasks.unshift(newTask); // Add to local array
      taskInput.value = '';
      updateCounter();
      render();
    } catch (err) {
      showError(errorMsg, err.message);
      undoStack.pop(); // Revert history push on failure
      updateUndoRedoButtons();
    }
  });

  // Debounced input validation
  let validationTimeout;
  taskInput.addEventListener('input', e => {
    clearTimeout(validationTimeout);
    validationTimeout = setTimeout(() => {
      const validation = validateTaskInput(e.target.value);
      if (!validation.isValid && e.target.value.trim().length > 0) {
        showError(errorMsg, validation.message);
      } else {
        clearError(errorMsg);
      }
    }, 300);
  });

  // Task List Event Delegation (Click handlers)
  taskList.addEventListener('click', async (e) => {
    const li = e.target.closest('.task');
    if (!li) return;
    const id = li.dataset.id;
    const idx = tasks.findIndex(t => t.id === id);

    // 1. Toggle Completion Checkbox
    if (e.target.classList.contains('task-checkbox')) {
      const completed = e.target.checked;
      try {
        pushState();
        const response = await fetch(`${API_URL}/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ completed })
        });

        if (!response.ok) throw new Error('Failed to update status');
        
        tasks[idx].completed = completed;
        li.classList.toggle('completed', completed);
        updateCounter();
        
        if (currentFilter !== 'all') {
          setTimeout(render, 150); // Small delay for smooth transition
        }
      } catch (err) {
        e.target.checked = !completed; // Rollback UI checkbox
        undoStack.pop();
        updateUndoRedoButtons();
        console.error(err);
      }
    }

    // 2. Click Edit Button
    if (e.target.closest('.edit-btn')) {
      editingTaskId = id;
      render();
      const activeLi = taskList.querySelector(`[data-id="${id}"]`);
      if (activeLi) {
        const input = activeLi.querySelector('.edit-input');
        if (input) {
          input.focus();
          const len = input.value.length;
          input.setSelectionRange(len, len); // Move cursor to the end
        }
      }
    }

    // 3. Click Delete Button
    if (e.target.closest('.delete-btn')) {
      if (confirm('Delete this task?')) {
        try {
          pushState();
          const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
          if (!response.ok) throw new Error('Failed to delete task');
          
          tasks.splice(idx, 1);
          render();
          updateCounter();
        } catch (err) {
          undoStack.pop();
          updateUndoRedoButtons();
          console.error(err);
        }
      }
    }

    // 4. Click Inline Save Button
    if (e.target.closest('.save-btn')) {
      await saveInlineEdit(li, idx);
    }

    // 5. Click Inline Cancel Button
    if (e.target.closest('.cancel-btn')) {
      editingTaskId = null;
      render();
    }
  });

  // Double-Click task card to trigger Inline Editing
  taskList.addEventListener('dblclick', e => {
    const li = e.target.closest('.task');
    if (!li) return;
    if (e.target.closest('.task-actions') || e.target.closest('.checkbox-container') || li.classList.contains('editing')) {
      return;
    }
    const id = li.dataset.id;
    editingTaskId = id;
    render();
    const activeLi = taskList.querySelector(`[data-id="${id}"]`);
    if (activeLi) {
      const input = activeLi.querySelector('.edit-input');
      if (input) {
        input.focus();
        const len = input.value.length;
        input.setSelectionRange(len, len);
      }
    }
  });

  // Save Inline Edit Function
  async function saveInlineEdit(li, idx) {
    const input = li.querySelector('.edit-input');
    const editError = li.querySelector('.edit-error-msg');
    const newText = input.value.trim();

    const validation = validateTaskInput(newText);
    if (!validation.isValid) {
      showError(editError, validation.message);
      return;
    }
    clearError(editError);

    try {
      pushState();
      const response = await fetch(`${API_URL}/${tasks[idx].id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newText })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details?.join(', ') || errorData.error || 'Failed to update task');
      }

      tasks[idx].text = newText;
      editingTaskId = null;
      render();
    } catch (err) {
      showError(editError, err.message);
      undoStack.pop();
      updateUndoRedoButtons();
    }
  }

  // Keybindings (Enter to Save, Esc to Cancel) inside inline editor inputs
  taskList.addEventListener('keydown', e => {
    if (e.target.classList.contains('edit-input')) {
      const li = e.target.closest('.task');
      if (!li) return;
      const id = li.dataset.id;
      const idx = tasks.findIndex(t => t.id === id);
      
      if (e.key === 'Enter') {
        e.preventDefault();
        saveInlineEdit(li, idx);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        editingTaskId = null;
        render();
      }
    }
  });

  // Filter Buttons
  filterBtns.forEach(btn => {
    btn.addEventListener('click', e => {
      filterBtns.forEach(b => {
        b.classList.remove('active');
        b.removeAttribute('aria-current');
      });
      e.target.classList.add('active');
      e.target.setAttribute('aria-current', 'page');
      currentFilter = e.target.dataset.filter;
      editingTaskId = null;
      render();
    });
  });

  // Clear Completed Button (utilizing the database Transaction handling endpoint)
  clearCompletedBtn.addEventListener('click', async () => {
    const completedTasksCount = tasks.filter(t => t.completed).length;
    if (completedTasksCount === 0) return;

    if (confirm(`Clear all ${completedTasksCount} completed task(s)?`)) {
      try {
        pushState();
        const response = await fetch(`${API_URL}/clear-completed`, {
          method: 'POST'
        });

        if (!response.ok) throw new Error('Transaction failed on database');
        
        tasks = tasks.filter(t => !t.completed);
        render();
        updateCounter();
      } catch (err) {
        undoStack.pop();
        updateUndoRedoButtons();
        showError(errorMsg, 'Could not clear completed tasks from cloud database.');
        console.error(err);
      }
    }
  });

  // Undo/Redo click binds
  undoBtn.addEventListener('click', undo);
  redoBtn.addEventListener('click', redo);

  // Global Keyboard shortcuts for Undo (Ctrl+Z) and Redo (Ctrl+Y)
  document.addEventListener('keydown', e => {
    const activeTag = document.activeElement.tagName.toLowerCase();
    const isEditingText = activeTag === 'input' || activeTag === 'textarea';
    
    if (!isEditingText) {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
    }
  });

  // Initial Boot
  fetchTasks();
});
