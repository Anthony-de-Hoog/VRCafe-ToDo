console.log("todo.js loaded");

const DEFAULT_CATEGORIES = ["Werk", "Persoonlijk", "Vrije tijd"];

const STORAGE_TASKS_KEY = "todos:tasks:v1";
const STORAGE_CATEGORIES_KEY = "todos:categories:v1";

let todos = [];
let categories = [];

/* ---------- opslag ---------- */
function saveTasks() { localStorage.setItem(STORAGE_TASKS_KEY, JSON.stringify(todos)); }
function loadTasks() {
    try { todos = JSON.parse(localStorage.getItem(STORAGE_TASKS_KEY)) || []; }
    catch { todos = []; }
}
function saveCategories() { localStorage.setItem(STORAGE_CATEGORIES_KEY, JSON.stringify(categories)); }
function loadCategories() {
    try { categories = JSON.parse(localStorage.getItem(STORAGE_CATEGORIES_KEY)) || []; }
    catch { categories = []; }
    if (!Array.isArray(categories) || categories.length === 0) {
        categories = [...DEFAULT_CATEGORIES];
        saveCategories();
    }
}

/* ---------- helpers ---------- */
function uid() { return Math.random().toString(36).slice(2, 9); }
function byCategory(items) {
    const map = new Map();
    for (const t of items) {
        const cat = t.category || DEFAULT_CATEGORIES[0];
        if (!map.has(cat)) map.set(cat, []);
        map.get(cat).push(t);
    }
    for (const [, arr] of map) { arr.sort((a, b) => b.createdAt - a.createdAt); }
    return map;
}

/* ---------- DOM refs ---------- */
const form = document.getElementById("new-todo-form");
const input = document.getElementById("todo-input");
const select = document.getElementById("category-select");
const container = document.getElementById("lists-by-category");
const catForm = document.getElementById("new-category-form");
const newCatInput = document.getElementById("new-category-input");
const catList = document.getElementById("category-list");

if (!form || !select || !container) {
    console.error("Required elements missing. Check IDs: new-todo-form, category-select, lists-by-category.");
}

/* ---------- render ---------- */
function renderCategorySelect() {
    select.innerHTML = "";
    for (const c of categories) {
        const opt = document.createElement("option");
        opt.value = c; opt.textContent = c;
        select.appendChild(opt);
    }
    if (!select.value && categories.length) select.value = categories[0];
}

function renderCategoryList() {
    if (!catList) return;
    catList.innerHTML = "";
    for (const c of categories) {
        const li = document.createElement("li");
        li.className = "category-item"; li.dataset.name = c;
        li.innerHTML = `<span>${c}</span><button class="category-remove" type="button">Verwijderen</button>`;
        catList.appendChild(li);
    }
}

function renderTasksByCategory() {
    const groups = byCategory(todos);
    container.innerHTML = "";

    const allCats = [...categories].sort((a, b) => a.localeCompare(b, "nl"));
    for (const cat of allCats) {
        const items = groups.get(cat) || [];
        const section = document.createElement("section");
        section.className = "category-section"; section.dataset.category = cat;

        const header = document.createElement("div");
        header.className = "category-header";
        const h3 = document.createElement("h3"); h3.textContent = cat;
        const count = document.createElement("span"); count.className = "count";
        const completed = items.filter((t) => t.done).length;
        count.textContent = `${items.length} taak${items.length === 1 ? "" : "en"} • ${completed} voltooid`;
        header.append(h3, count);

        const ul = document.createElement("ul"); ul.className = "task-list";
        for (const t of items) {
            const li = document.createElement("li");
            li.className = "task"; li.dataset.id = t.id;
            li.innerHTML = `
        <label>
          <input type="checkbox" ${t.done ? "checked" : ""} />
          <span class="title ${t.done ? "done" : ""}"></span>
        </label>
        <button class="remove" type="button">Verwijderen</button>
      `;
            li.querySelector(".title").textContent = t.title;
            ul.appendChild(li);
        }
        if (items.length === 0) {
            const empty = document.createElement("p");
            empty.className = "empty"; empty.textContent = "Geen taken in deze categorie.";
            ul.appendChild(empty);
        }

        section.append(header, ul);
        container.appendChild(section);
    }
}

function renderAll() {
    renderCategorySelect();
    renderCategoryList();
    renderTasksByCategory();
}

/* ---------- actions ---------- */
function addTask(title, categoryName) {
    const cleanTitle = (title || "").trim();
    if (!cleanTitle) return;
    const cat = (categoryName || DEFAULT_CATEGORIES[0]).trim() || DEFAULT_CATEGORIES[0];
    if (!categories.includes(cat)) { categories.push(cat); saveCategories(); }

    todos.unshift({ id: uid(), title: cleanTitle, category: cat, done: false, createdAt: Date.now() });
    saveTasks();
    renderAll();
}
function toggleTask(id) {
    const t = todos.find((x) => x.id === id);
    if (!t) return;
    t.done = !t.done; saveTasks(); renderAll();
}
function removeTask(id) {
    todos = todos.filter((x) => x.id !== id);
    saveTasks(); renderAll();
}
function addCategory(name) {
    const clean = (name || "").trim();
    if (!clean || categories.includes(clean)) return;
    categories.push(clean); saveCategories(); renderAll();
}
function removeCategory(name) {
    categories = categories.filter((c) => c !== name);
    todos = todos.filter((t) => t.category !== name);
    saveCategories(); saveTasks(); renderAll();
}

/* ---------- events ---------- */
if (form) {
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        addTask(input.value, select.value);
        input.value = ""; input.focus();
    });
}
if (container) {
    container.addEventListener("change", (e) => {
        if (e.target.matches('input[type="checkbox"]')) {
            const li = e.target.closest("li.task"); if (!li) return;
            toggleTask(li.dataset.id);
        }
    });
    container.addEventListener("click", (e) => {
        if (e.target.matches(".remove")) {
            const li = e.target.closest("li.task"); if (!li) return;
            removeTask(li.dataset.id);
        }
    });
}
if (catForm && catList) {
    catForm.addEventListener("submit", (e) => {
        e.preventDefault();
        addCategory(newCatInput.value);
        newCatInput.value = ""; newCatInput.focus();
    });
    catList.addEventListener("click", (e) => {
        if (e.target.matches(".category-remove")) {
            const li = e.target.closest("li.category-item"); if (!li) return;
            removeCategory(li.dataset.name);
        }
    });
}

/* ---------- init ---------- */
loadCategories();
loadTasks();
renderAll();
console.log("Init done. Categories:", categories, "Todos:", todos);