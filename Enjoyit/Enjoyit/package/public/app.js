
async function api(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options.headers
        },
        credentials: "same-origin"
    });

    const data = await response.json();

    if (!response.ok) {
        if (response.status === 401) {
            window.location.href = "/login.html";
        }

        throw new Error(data.message || "Something went wrong");
    }

    return data;
}

// LOGIN PAGE
const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const message = document.getElementById("message");
        message.textContent = "Checking login...";

        try {
            await api("/api/login", {
                method: "POST",
                body: JSON.stringify({
                    username: document.getElementById("username").value,
                    password: document.getElementById("password").value
                })
            });

            window.location.href = "/dashboard.html";
        } catch (error) {
            message.textContent = error.message;
        }
    });
}

// DASHBOARD PAGE
const productForm = document.getElementById("productForm");

if (productForm) {
    // Check login before showing the dashboard
    api("/api/me")
        .then(() => loadProducts())
        .catch(() => {});

    // ADD PRODUCT
    productForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const message = document.getElementById("addMessage");

        try {
            const result = await api("/api/products", {
                method: "POST",
                body: JSON.stringify({
                    name: document.getElementById("productName").value,
                    price: document.getElementById("productPrice").value,
                    quantity: document.getElementById("productQuantity").value
                })
            });

            message.textContent = result.message;
            productForm.reset();

            await loadProducts();
        } catch (error) {
            message.textContent = error.message;
        }
    });

    // VIEW PRODUCTS
    document.getElementById("viewBtn").addEventListener("click", loadProducts);

    // DELETE PRODUCT BY NAME
    document.getElementById("deleteForm").addEventListener(
        "submit",
        async function (event) {
            event.preventDefault();

            const message = document.getElementById("deleteMessage");
            const name = document.getElementById("deleteName").value;

            try {
                const result = await api("/api/products", {
                    method: "DELETE",
                    body: JSON.stringify({ name })
                });

                message.textContent = result.message;
                document.getElementById("deleteForm").reset();

                await loadProducts();
            } catch (error) {
                message.textContent = error.message;
            }
        }
    );

    // LOGOUT
    document.getElementById("logoutBtn").addEventListener(
        "click",
        async function () {
            try {
                await api("/api/logout", { method: "POST" });
                window.location.href = "/login.html";
            } catch (error) {
                alert(error.message);
            }
        }
    );
}

// DISPLAY PRODUCTS IN TABLE
async function loadProducts() {
    const list = document.getElementById("productList");

    if (!list) return;

    try {
        const products = await api("/api/products");
        list.replaceChildren();

        if (products.length === 0) {
            const row = document.createElement("tr");
            const cell = document.createElement("td");

            cell.colSpan = 3;
            cell.textContent = "No products found";

            row.appendChild(cell);
            list.appendChild(row);
            return;
        }

        products.forEach(product => {
            const row = document.createElement("tr");

            [product.name, product.price, product.quantity].forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = String(value);
                row.appendChild(cell);
            });

            list.appendChild(row);
        });
    } catch (error) {
        list.replaceChildren();

        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 3;
        cell.textContent = error.message;

        row.appendChild(cell);
        list.appendChild(row);
    }
}
