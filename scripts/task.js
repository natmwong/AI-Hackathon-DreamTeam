
// --- Task List Interactivity ---
document.addEventListener('DOMContentLoaded', function() {
	const addBtn = document.querySelector('.add-btn');
	const modal = document.getElementById('addTaskModal');
	const taskTitleInput = document.getElementById('taskTitleInput');
	const confirmBtn = document.getElementById('confirmAddTask');
	const cancelBtn = document.getElementById('cancelAddTask');
	const taskList = document.querySelector('.task-list');

	// Show modal
	addBtn.addEventListener('click', () => {
		modal.style.display = 'flex';
		taskTitleInput.value = '';
		setTimeout(() => taskTitleInput.focus(), 100);
	});

	// Hide modal
	function closeModal() {
		modal.style.display = 'none';
		taskTitleInput.value = '';
	}
	cancelBtn.addEventListener('click', closeModal);
	modal.addEventListener('click', (e) => {
		if (e.target === modal) closeModal();
	});

	// Add task
	confirmBtn.addEventListener('click', () => {
		const title = taskTitleInput.value.trim();
		if (!title) return taskTitleInput.focus();
		addTask(title);
		closeModal();
	});
	taskTitleInput.addEventListener('keydown', (e) => {
		if (e.key === 'Enter') confirmBtn.click();
	});

	// Add task to list
	function addTask(title) {
		const li = document.createElement('li');
		li.className = 'task';
		li.innerHTML = `
			<input type="checkbox" />
			<span class="task-title" tabindex="0">${escapeHTML(title)}</span>
		`;
		// Enable editing on click
		const span = li.querySelector('.task-title');
		span.addEventListener('click', () => makeEditable(span));
		span.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') e.preventDefault();
		});
		taskList.appendChild(li);
	}

	// Make task title editable
	function makeEditable(span) {
		if (span.isContentEditable) return;
		span.contentEditable = 'true';
		span.focus();
		// Select all text
		document.execCommand('selectAll', false, null);
		// Save on blur or Enter
		function finishEdit(e) {
			if (e.type === 'blur' || (e.type === 'keydown' && e.key === 'Enter')) {
				span.contentEditable = 'false';
				span.removeEventListener('blur', finishEdit);
				span.removeEventListener('keydown', finishEdit);
				// Optionally trim whitespace
				span.textContent = span.textContent.trim();
			}
		}
		span.addEventListener('blur', finishEdit);
		span.addEventListener('keydown', finishEdit);
	}

	// Escape HTML to prevent XSS
	function escapeHTML(str) {
		return str.replace(/[&<>"']/g, function(tag) {
			const chars = {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'};
			return chars[tag] || tag;
		});
	}
});
