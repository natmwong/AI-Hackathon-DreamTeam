
// --- Task List Interactivity ---
document.addEventListener('DOMContentLoaded', function() {
	const addBtn = document.querySelector('.add-btn');
	const taskList = document.querySelector('.task-list');
	let tasks = [];
	let modalLoaded = false;
	let modal, taskTitleInput, confirmBtn, cancelBtn;

	// Show modal (load if needed)
	addBtn.addEventListener('click', () => {
		if (!modalLoaded) {
			fetch('task-modal.html')
				.then(res => res.text())
				.then(html => {
					const temp = document.createElement('div');
					temp.innerHTML = html;
					document.body.appendChild(temp.firstElementChild);
					setupModalRefs();
					showModal();
					modalLoaded = true;
				});
		} else {
			showModal();
		}
	});

	function setupModalRefs() {
		modal = document.getElementById('addTaskModal');
		taskTitleInput = document.getElementById('taskTitleInput');
		confirmBtn = document.getElementById('confirmAddTask');
		cancelBtn = document.getElementById('cancelAddTask');

		// Hide modal
		cancelBtn.addEventListener('click', closeModal);
		modal.addEventListener('click', (e) => {
			if (e.target === modal) closeModal();
		});

		// Add task
		confirmBtn.addEventListener('click', () => {
			const title = taskTitleInput.value.trim();
			if (!title) return taskTitleInput.focus();
			tasks.push({ title, completed: false });
			renderTasks();
			closeModal();
		});
		taskTitleInput.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') confirmBtn.click();
		});
	}

	function showModal() {
		modal.style.display = 'flex';
		taskTitleInput.value = '';
		setTimeout(() => taskTitleInput.focus(), 100);
	}
	function closeModal() {
		modal.style.display = 'none';
		taskTitleInput.value = '';
	}

	// Render tasks
	function renderTasks() {
		taskList.innerHTML = '';
		// Find the index of the first incomplete (not completed) task
		const firstIncompleteIdx = tasks.findIndex(t => !t.completed);
		tasks.forEach((task, idx) => {
			const li = document.createElement('li');
			li.className = 'task';
			if (task.completed) {
				li.classList.add('completed');
			} else if (idx !== firstIncompleteIdx) {
				li.classList.add('muted');
			}
			li.innerHTML = `
				<input type="checkbox" ${task.completed ? 'checked' : ''} />
				<span class="task-title" tabindex="0">${escapeHTML(task.title)}</span>
			`;
			// Checkbox logic
			const checkbox = li.querySelector('input[type="checkbox"]');
			checkbox.addEventListener('change', () => {
				task.completed = checkbox.checked;
				renderTasks();
			});
			// Enable editing on click
			const span = li.querySelector('.task-title');
			span.addEventListener('click', () => makeEditable(span, task, idx));
			span.addEventListener('keydown', (e) => {
				if (e.key === 'Enter') e.preventDefault();
			});
			taskList.appendChild(li);
		});
	}

	// Make task title editable
	function makeEditable(span, task, idx) {
		if (span.isContentEditable) return;
		span.contentEditable = 'true';
		span.focus();
		document.execCommand('selectAll', false, null);
		function finishEdit(e) {
			if (e.type === 'blur' || (e.type === 'keydown' && e.key === 'Enter')) {
				span.contentEditable = 'false';
				span.removeEventListener('blur', finishEdit);
				span.removeEventListener('keydown', finishEdit);
				task.title = span.textContent.trim();
				renderTasks();
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
