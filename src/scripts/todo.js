const STORAGE_KEY = 'todos:v1';
let todos = [];

function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}
function load() {
    try {
        todos = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
        todos = [];
    }
}
function uid() {
    return Math.random().toString(36).slice(2, 9);
}
function render() {
    const list = document.getElementById('todo-list');
    list.innerHTML = '';
    for (const t of todos) {
        const li = document.createElement('li');
        li.dataset.id = t.id;
        li.innerHTML = `
      <label>
        <input type="checkbox" ${t.done ? 'checked' : ''} />
        <span class="title ${t.done ? 'done' : ''}"></span>
      </label>
      <button class="remove" aria-label="Taak verwijderen">✕</button>
    `;
        li.querySelector('.title').textContent = t.title;
        list.appendChild(li);
    }
}
function add(title) {
    todos.unshift({ id: uid(), title: title.trim(), done: false });
    save();
    render();
}
function toggle(id) {
    const t = todos.find((x) => x.id === id);
    if (t) {
        t.done = !t.done;
        save();
        render();
    }
}
function removeTodo(id) {
    todos = todos.filter((x) => x.id !== id);
    save();
    render();
}
function clearCompleted() {
    todos = todos.filter((x) => !t.done);
    save();
    render();
}

// init
load();
render();

// events
const form = document.getElementById('new-todo-form');
const input = document.getElementById('todo-input');
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const value = input.value.trim();
    if (value) {
        add(value);
        input.value = '';
        input.focus();
    }
});

document.getElementById('todo-list').addEventListener('click', (e) => {
    const li = e.target.closest('li');
    if (!li) return;
    const id = li.dataset.id;
    if (e.target.matches('input[type="checkbox"]')) {
        toggle(id);
    } else if (e.target.matches('.remove')) {
        removeTodo(id);
    }
});

document.getElementById('clear-completed').addEventListener('click', clearCompleted);