console.log("todo.js loaded");

/* ---------- constants ---------- */
const DEFAULT_CATEGORIES = ["Werk", "Persoonlijk", "Vrije tijd"];
const STORAGE_TASKS_KEY = "todos:tasks:v1";
const STORAGE_CATEGORIES_KEY = "todos:categories:v1";
const STORAGE_CATEGORY_COLORS_KEY = "todos:categoryColors:v1";

/* ---------- state ---------- */
let todos = [];
let categories = [];
let categoryColors = {};
let activeCategoryFilter = "ALL";

/* ---------- storage ---------- */
function saveTasks() { localStorage.setItem(STORAGE_TASKS_KEY, JSON.stringify(todos)); }
function loadTasks() { try { todos = JSON.parse(localStorage.getItem(STORAGE_TASKS_KEY)) || []; } catch { todos = []; } }
function saveCategories() { localStorage.setItem(STORAGE_CATEGORIES_KEY, JSON.stringify(categories)); }
function loadCategories() {
    try { categories = JSON.parse(localStorage.getItem(STORAGE_CATEGORIES_KEY)) || []; } catch { categories = []; }
    if (!Array.isArray(categories) || categories.length === 0) {
        categories = [...DEFAULT_CATEGORIES];
        saveCategories();
    }
}
function saveCategoryColors() { localStorage.setItem(STORAGE_CATEGORY_COLORS_KEY, JSON.stringify(categoryColors)); }
function loadCategoryColors() {
    try { categoryColors = JSON.parse(localStorage.getItem(STORAGE_CATEGORY_COLORS_KEY)) || {}; } catch { categoryColors = {}; }
    if (!categoryColors["Werk"]) categoryColors["Werk"] = "var(--brand-text-blue)";
    if (!categoryColors["Vrije tijd"]) categoryColors["Vrije tijd"] = "var(--brand-text-green)";
    if (!categoryColors["Persoonlijk"]) categoryColors["Persoonlijk"] = "var(--brand-text-pink)";
}

/* ---------- utils ---------- */
function uid() { return Math.random().toString(36).slice(2, 9); }
function byCategory(items) {
    const map = new Map();
    for (const t of items) {
        const cat = t.category || DEFAULT_CATEGORIES[0];
        if (!map.has(cat)) map.set(cat, []);
        map.get(cat).push(t);
    }
    for (const [, arr] of map) arr.sort((a, b) => b.createdAt - a.createdAt);
    return map;
}

/* ---------- DOM ---------- */
const form = document.getElementById("new-todo-form");
const input = document.getElementById("todo-input");
const select = document.getElementById("category-select");
const container = document.getElementById("lists-by-category");

const catForm = document.getElementById("new-category-form");
const newCatInput = document.getElementById("new-category-input");
const newCatColorInput = document.getElementById("new-category-color");
const catList = document.getElementById("category-list");

const catNavToggle = document.getElementById("catNavToggle");
const catNavBody = document.getElementById("catNavBody");
const categoryTabs = document.getElementById("categoryTabs");
const categoryFilterSelect = document.getElementById("categoryFilterSelect");

if (!form || !select || !container) {
    console.error("Required elements missing. Check IDs: new-todo-form, category-select, lists-by-category.");
}

/* ---------- render ---------- */
function ensureValidFilter() {
    if (activeCategoryFilter !== "ALL" && !categories.includes(activeCategoryFilter)) {
        activeCategoryFilter = "ALL";
    }
}
function ensureValidTaskSelect() {
    if (!select) return;
    const has = categories.includes(select.value);
    if (!has) select.value = categories[0] || "";
}

function renderCategorySelect() {
    select.innerHTML = "";
    for (const c of categories) {
        const opt = document.createElement("option");
        opt.value = c; opt.textContent = c;
        select.appendChild(opt);
    }
    ensureValidTaskSelect();
}

function renderCategoryTabs() {
    if (!categoryTabs) return;
    categoryTabs.innerHTML = "";

    const allLi = document.createElement("li");
    allLi.className = "category-tab";
    allLi.role = "tab";
    allLi.dataset.name = "ALL";
    allLi.setAttribute("aria-selected", activeCategoryFilter === "ALL" ? "true" : "false");
    allLi.innerHTML = `<span>Alle categorieën</span>`;
    categoryTabs.appendChild(allLi);

    const groups = byCategory(todos);
    const catNames = [...categories].sort((a, b) => a.localeCompare(b, "nl"));

    for (const name of catNames) {
        const count = (groups.get(name) || []).length;
        const li = document.createElement("li");
        li.className = "category-tab";
        li.role = "tab";
        li.dataset.name = name;
        li.setAttribute("aria-selected", activeCategoryFilter === name ? "true" : "false");

        const color = categoryColors[name];
        const titleSpan = document.createElement("span");
        titleSpan.textContent = name;
        if (color) titleSpan.style.color = color;

        const countSpan = document.createElement("span");
        countSpan.className = "count";
        countSpan.textContent = count;

        li.append(titleSpan, countSpan);
        categoryTabs.appendChild(li);
    }
}

function renderCategoryFilterSelect() {
    if (!categoryFilterSelect) return;
    categoryFilterSelect.innerHTML = "";

    const optAll = document.createElement("option");
    optAll.value = "ALL"; optAll.textContent = "Alle categorieën";
    categoryFilterSelect.appendChild(optAll);

    for (const c of categories) {
        const opt = document.createElement("option");
        opt.value = c; opt.textContent = c;
        categoryFilterSelect.appendChild(opt);
    }
    categoryFilterSelect.value = activeCategoryFilter;
}

function renderTasksByCategory() {
    const groups = byCategory(todos);
    container.innerHTML = "";

    const renderNames = activeCategoryFilter === "ALL"
        ? [...categories].sort((a, b) => a.localeCompare(b, "nl"))
        : [activeCategoryFilter];

    const title = document.getElementById("tasks-by-category-title");
    if (title) title.textContent = renderNames.length === 1 && renderNames[0] !== "ALL"
        ? `Taken: ${renderNames[0]}`
        : "Taken per categorie";

    for (const cat of renderNames) {
        const items = groups.get(cat) || [];
        const section = document.createElement("section");
        section.className = "category-section";
        section.dataset.category = cat;

        const header = document.createElement("div");
        header.className = "category-header";
        const h3 = document.createElement("h3"); h3.textContent = cat;
        const color = categoryColors[cat];
        if (color) h3.style.color = color;

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

    if (activeCategoryFilter !== "ALL" && container.children.length === 0) {
        const section = document.createElement("section");
        section.className = "category-section";
        section.dataset.category = activeCategoryFilter;
        const header = document.createElement("div");
        header.className = "category-header";
        const h3 = document.createElement("h3"); h3.textContent = activeCategoryFilter;
        const count = document.createElement("span"); count.className = "count";
        count.textContent = "0 taken • 0 voltooid";
        header.append(h3, count);
        const empty = document.createElement("p");
        empty.className = "empty"; empty.textContent = "Geen taken in deze categorie.";
        const ul = document.createElement("ul"); ul.className = "task-list";
        ul.appendChild(empty);
        section.append(header, ul);
        container.appendChild(section);
    }
}

function renderCategoryList() {
    if (!catList) return;
    catList.innerHTML = "";
    const names = [...categories].sort((a, b) => a.localeCompare(b, "nl"));
    for (const name of names) {
        const li = document.createElement("li");
        li.className = "category-item";
        li.dataset.name = name;

        const label = document.createElement("label");
        label.textContent = name;

        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "category-remove";
        removeBtn.textContent = "Verwijderen";

        li.append(label, removeBtn);
        catList.appendChild(li);
    }
}

function renderAll() {
    ensureValidFilter();
    renderCategorySelect();
    renderCategoryList();
    renderCategoryTabs();
    renderCategoryFilterSelect();
    renderTasksByCategory();
    initCategoryNav();
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
    t.done = !t.done;
    saveTasks();
    renderAll();
}
function removeTask(id) {
    todos = todos.filter((x) => x.id !== id);
    saveTasks();
    renderAll();
}
function addCategory(name, pickedColor) {
    const clean = (name || "").trim();
    if (!clean || categories.includes(clean)) return;
    categories.push(clean);
    saveCategories();
    if (pickedColor) {
        categoryColors[clean] = pickedColor;
        saveCategoryColors();
    }
    renderAll();
}
function removeCategory(name) {
    categories = categories.filter((c) => c !== name);
    todos = todos.filter((t) => t.category !== name);
    // Reset filter if it was pointing to the removed category
    if (activeCategoryFilter === name) activeCategoryFilter = "ALL";
    saveCategories();
    saveTasks();
    renderAll();
}

/* ---------- events ---------- */
if (form) {
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        // Ensure select has a valid value before adding
        ensureValidTaskSelect();
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

const newCatSubmit = document.getElementById("new-category-submit");
const colorPopover = document.getElementById("category-color-popover");
function setPendingCategoryName(name) { if (colorPopover) colorPopover.dataset.pendingName = name || ""; }
function getPendingCategoryName() { return colorPopover ? (colorPopover.dataset.pendingName || "") : ""; }
function showColorPopover() { if (colorPopover) colorPopover.hidden = false; }
function hideColorPopover() { if (colorPopover) { colorPopover.hidden = true; setPendingCategoryName(""); } }

if (catForm && newCatSubmit && colorPopover && catList) {
    catForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = (newCatInput?.value || "").trim();
        if (!name) return;
        setPendingCategoryName(name);
        showColorPopover(newCatSubmit);
    });

    colorPopover.addEventListener("click", (e) => {
        const swatch = e.target.closest(".swatch");
        if (swatch) {
            const name = getPendingCategoryName();
            const picked = swatch.dataset.color;
            hideColorPopover();
            if (name) {
                addCategory(name, picked);
                if (newCatInput) { newCatInput.value = ""; newCatInput.focus(); }
            }
            return;
        }
        if (e.target.matches(".popover-cancel")) hideColorPopover();
    });

    document.addEventListener("click", (e) => {
        if (colorPopover.hidden) return;
        const inside = colorPopover.contains(e.target) || catForm.contains(e.target);
        if (!inside) hideColorPopover();
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !colorPopover.hidden) hideColorPopover();
    });

    catList.addEventListener("click", (e) => {
        if (e.target.matches(".category-remove")) {
            const li = e.target.closest("li.category-item"); if (!li) return;
            removeCategory(li.dataset.name);
        }
    });
}

if (categoryTabs) {
    categoryTabs.addEventListener("click", (e) => {
        const li = e.target.closest(".category-tab"); if (!li) return;
        activeCategoryFilter = li.dataset.name || "ALL";
        renderAll();
    });
}

if (categoryFilterSelect) {
    categoryFilterSelect.addEventListener("change", (e) => {
        activeCategoryFilter = e.target.value || "ALL";
        renderAll();
    });
}

if (catNavToggle && catNavBody) {
    catNavToggle.addEventListener("click", () => {
        const expanded = catNavToggle.getAttribute("aria-expanded") === "true";
        catNavToggle.setAttribute("aria-expanded", String(!expanded));
        catNavBody.hidden = expanded;
        catNavToggle.textContent = expanded ? "Toon categorieën" : "Verberg categorieën";
    });
}

function initCategoryNav() {
    const isMobile = window.matchMedia("(max-width: 820px)").matches;
    if (!catNavToggle || !catNavBody) return;
    if (isMobile) {
        catNavBody.hidden = true;
        catNavToggle.setAttribute("aria-expanded", "false");
        catNavToggle.textContent = "Toon categorieën";
    } else {
        catNavBody.hidden = false;
        catNavToggle.setAttribute("aria-expanded", "true");
        catNavToggle.textContent = "Verberg categorieën";
    }
}

window.addEventListener("resize", initCategoryNav);

/* ---------- init ---------- */
loadCategoryColors();
loadCategories();
loadTasks();
renderAll();
initCategoryNav();
console.log("Init done. Categories:", categories, "Todos:", todos);