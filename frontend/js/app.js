// Expense Tracker - frontend logic

// PHASE 2
// Your backend from Phase 1 is already running, with real expenses in the
// database (from schema.sql). Build this page directly against it with
// fetch and async/await - there is no in-memory or localStorage stage
// this time, and no sample data file.
//
// A possible structure (change it if you have a better idea):
//   - async function getExpenses()          fetch(API_URL), return the JSON
//   - async function addExpense(data)       fetch(API_URL, { method: "POST", ... })
//   - async function updateExpense(id,data) fetch(API_URL + "/" + id, { method: "PUT", ... })
//   - async function deleteExpense(id)      fetch(API_URL + "/" + id, { method: "DELETE" })
//   - async function refresh()              get the list, then call renderTable and renderSummary
//   - renderTable(list)                     build the table rows from the array the API returned
//   - renderSummary(list)                   update the summary cards
//   - applyFilter()                         re-render with the list filtered by category
//
// Don't forget:
//   - Show a Bootstrap spinner while a request is in flight.
//   - Wrap every fetch call in try/catch, and show a Bootstrap alert on failure.
//   - After add, edit, or delete, call refresh() so the page always shows
//     what the server actually saved - never update the table by hand.
//   - The API is at http://localhost:3000/api/expenses (see the Roadmap).

const API_URL = "http://localhost:3000/api/expenses";

let allExpenses = [];

// DOM Elements
const tbody = document.getElementById("expenses-tbody");
const totalAmountEl = document.getElementById("total-amount");
const totalCountEl = document.getElementById("total-count");
const highestExpenseEl = document.getElementById("highest-expense");
const spinner = document.getElementById("loading-spinner");
const alertContainer = document.getElementById("alert-container");
const filterSelect = document.getElementById("filter-category");

// Helper: Show/Hide Spinner
function setLoading(isLoading) {
  if (isLoading) {
    spinner.classList.remove("d-none");
  } else {
    spinner.classList.add("d-none");
  }
}

// Helper: Show Bootstrap Alert
function showAlert(message, type = "danger") {
  alertContainer.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;
}

// Helper: Category Badge Colors
function getCategoryBadge(category) {
  const colors = {
    Food: "bg-success",
    Transport: "bg-info text-dark",
    Bills: "bg-warning text-dark",
    Entertainment: "bg-primary",
    Other: "bg-secondary",
  };
  const badgeClass = colors[category] || "bg-secondary";
  return `<span class="badge ${badgeClass}">${category}</span>`;
}

// 1. Fetch all expenses from API
async function getExpenses() {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error("Failed to fetch expenses from the server.");
  }
  return await response.json();
}

// 2. Update the 3 Summary Cards (Always counts ALL expenses, not filtered)
function renderSummary(list) {
  const count = list.length;
  const total = list.reduce((sum, item) => sum + Number(item.amount), 0);
  const highest =
    count > 0 ? Math.max(...list.map((item) => Number(item.amount))) : 0;

  totalAmountEl.textContent = `$${total.toFixed(2)}`;
  totalCountEl.textContent = count;
  highestExpenseEl.textContent = `$${highest.toFixed(2)}`;
}

// 3. Render the Table Rows
function renderTable(list) {
  tbody.innerHTML = "";

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-muted py-4">No expenses found.</td>
      </tr>
    `;
    return;
  }

  list.forEach((expense) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="fw-medium">${expense.title}</td>
      <td>$${Number(expense.amount).toFixed(2)}</td>
      <td>${getCategoryBadge(expense.category)}</td>
      <td>${expense.date}</td>
      <td class="text-end">
        <button class="btn btn-sm btn-outline-primary me-1 edit-btn" data-id="${expense.id}">Edit</button>
        <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${expense.id}">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// 4. Apply Category Filter
function applyFilter() {
  const selected = filterSelect.value;
  if (selected === "All") {
    renderTable(allExpenses);
  } else {
    const filtered = allExpenses.filter((item) => item.category === selected);
    renderTable(filtered);
  }
}

// 5. Refresh: Fetch latest data from server and update UI
async function refresh() {
  setLoading(true);
  try {
    allExpenses = await getExpenses();
    renderSummary(allExpenses);
    applyFilter();
  } catch (err) {
    showAlert(
      "Could not connect to the server. Make sure the backend is running on port 3000.",
    );
  } finally {
    setLoading(false);
  }
}

// Filter dropdown event listener
filterSelect.addEventListener("change", applyFilter);

// Load data when page opens
refresh();

// ==========================================
// DAY 7 & 8: ADD, EDIT, AND DELETE LOGIC
// ==========================================

const expenseForm = document.getElementById("expense-form");
const editForm = document.getElementById("edit-form");
const editModalEl = document.getElementById("editModal");
const editModal = new bootstrap.Modal(editModalEl);

// Helper: Validate form inputs before sending
function validateExpenseInput(title, amount, category, date) {
  if (!title || title.trim() === "") {
    return "Please enter a title for the expense.";
  }
  if (amount === "" || isNaN(amount) || Number(amount) <= 0) {
    return "Amount must be a number greater than 0.";
  }
  if (!category) {
    return "Please select a valid category.";
  }
  if (!date) {
    return "Please select a date.";
  }
  return null; // Valid
}

// API Call: POST a new expense
async function addExpense(data) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Failed to add expense.");
  }
  return result;
}

// API Call: PUT (update) an existing expense
async function updateExpense(id, data) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Failed to update expense.");
  }
  return result;
}

// API Call: DELETE an expense
async function deleteExpense(id) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Failed to delete expense.");
  }
  return result;
}

// Handle "Add Expense" Form Submit
expenseForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  alertContainer.innerHTML = ""; // Clear old alerts

  const title = document.getElementById("title").value;
  const amount = document.getElementById("amount").value;
  const category = document.getElementById("category").value;
  const date = document.getElementById("date").value;

  const validationError = validateExpenseInput(title, amount, category, date);
  if (validationError) {
    showAlert(validationError, "warning");
    return;
  }

  setLoading(true);
  try {
    await addExpense({
      title: title.trim(),
      amount: Number(amount),
      category,
      date,
    });
    expenseForm.reset();
    showAlert("Expense added successfully!", "success");
    await refresh(); // Re-fetch from server so UI shows the truth
  } catch (err) {
    showAlert(
      err.message.includes("Failed to fetch")
        ? "Cannot reach the server. Please check if the backend is running."
        : err.message,
      "danger",
    );
  } finally {
    setLoading(false);
  }
});

// Handle Table Button Clicks (Edit & Delete)
tbody.addEventListener("click", async (e) => {
  const editBtn = e.target.closest(".edit-btn");
  const deleteBtn = e.target.closest(".delete-btn");

  // If Edit button clicked: Fill modal with current expense data and open it
  if (editBtn) {
    const id = Number(editBtn.dataset.id);
    const expense = allExpenses.find((item) => item.id === id);
    if (!expense) return;

    document.getElementById("edit-id").value = expense.id;
    document.getElementById("edit-title").value = expense.title;
    document.getElementById("edit-amount").value = expense.amount;
    document.getElementById("edit-category").value = expense.category;
    document.getElementById("edit-date").value = expense.date;

    editModal.show();
  }

  // If Delete button clicked: Send DELETE request and refresh list
  if (deleteBtn) {
    const id = Number(deleteBtn.dataset.id);
    alertContainer.innerHTML = "";
    setLoading(true);

    try {
      await deleteExpense(id);
      showAlert("Expense deleted successfully!", "success");
      await refresh();
    } catch (err) {
      showAlert(
        err.message.includes("Failed to fetch")
          ? "Cannot reach the server. Please check if the backend is running."
          : err.message,
        "danger",
      );
    } finally {
      setLoading(false);
    }
  }
});

// Handle "Edit Expense" Modal Form Submit
editForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  alertContainer.innerHTML = "";

  const id = document.getElementById("edit-id").value;
  const title = document.getElementById("edit-title").value;
  const amount = document.getElementById("edit-amount").value;
  const category = document.getElementById("edit-category").value;
  const date = document.getElementById("edit-date").value;

  const validationError = validateExpenseInput(title, amount, category, date);
  if (validationError) {
    showAlert(validationError, "warning");
    return;
  }

  setLoading(true);
  try {
    await updateExpense(id, {
      title: title.trim(),
      amount: Number(amount),
      category,
      date,
    });
    editModal.hide();
    showAlert("Expense updated successfully!", "success");
    await refresh();
  } catch (err) {
    showAlert(
      err.message.includes("Failed to fetch")
        ? "Cannot reach the server. Please check if the backend is running."
        : err.message,
      "danger",
    );
  } finally {
    setLoading(false);
  }
});

// ==========================================
// BONUS: DARK MODE TOGGLE
// ==========================================

const darkModeBtn = document.getElementById("dark-mode-toggle");

function applyTheme(theme) {
  if (theme === "dark") {
    document.documentElement.setAttribute("data-bs-theme", "dark");
    darkModeBtn.textContent = "☀️ Light Mode";
    darkModeBtn.classList.replace("btn-outline-light", "btn-warning");
  } else {
    document.documentElement.setAttribute("data-bs-theme", "light");
    darkModeBtn.textContent = "🌙 Dark Mode";
    darkModeBtn.classList.replace("btn-warning", "btn-outline-light");
  }
}

// Load saved theme preference on page startup
const savedTheme = localStorage.getItem("theme") || "light";
applyTheme(savedTheme);

// Toggle theme when button is clicked
darkModeBtn.addEventListener("click", () => {
  const currentTheme = document.documentElement.getAttribute("data-bs-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  localStorage.setItem("theme", newTheme);
  applyTheme(newTheme);
});
