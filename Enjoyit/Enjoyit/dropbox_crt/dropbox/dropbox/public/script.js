
const form = document.getElementById("productForm");
const imageInput = document.getElementById("image");
const preview = document.getElementById("preview");
const productList = document.getElementById("productList");
const message = document.getElementById("message");

// 1. Preview selected image
imageInput.addEventListener("change", function () {
    const file = this.files[0];

    if (file) {
        preview.src = URL.createObjectURL(file);
        preview.style.display = "block";
    }
});

// 2. Add product
form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const price = document.getElementById("price").value;
    const quantity = document.getElementById("quantity").value;
    const image = imageInput.files[0];

    if (!image) {
        message.textContent = "Please select an image.";
        return;
    }

    try {
        message.textContent = "Uploading image...";

        // Upload image to backend
        const formData = new FormData();
        formData.append("image", image);

        const response = await fetch("/upload", {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            throw new Error("Image upload failed.");
        }

        const result = await response.json();

        if (!result.imagePath) {
            throw new Error("Image path was not returned by backend.");
        }

        // Display product in table
        displayProduct({
            name: name,
            price: price,
            quantity: quantity,
            imagePath: result.imagePath
        });

        form.reset();
        preview.style.display = "none";
        message.style.color = "green";
        message.textContent = "Product added successfully!";

    } catch (error) {
        message.style.color = "red";
        message.textContent = error.message;
    }
});

// 3. Display product
function displayProduct(product) {
    if (productList.textContent.includes("No products added yet")) {
        productList.innerHTML = "";
    }

    const row = document.createElement("tr");

    const imageCell = document.createElement("td");
    const img = document.createElement("img");

    img.src = "/image?path=" + encodeURIComponent(product.imagePath);
    img.alt = product.name;
    img.className = "product-image";
    imageCell.appendChild(img);

    const nameCell = document.createElement("td");
    nameCell.textContent = product.name;

    const priceCell = document.createElement("td");
    priceCell.textContent = "₹" + Number(product.price).toFixed(2);

    const quantityCell = document.createElement("td");
    quantityCell.textContent = product.quantity;

    const actionsCell = document.createElement("td");

    // 4. Download image
    const downloadButton = document.createElement("button");
    downloadButton.textContent = "Download Image";
    downloadButton.className = "download-btn";

    downloadButton.addEventListener("click", function () {
        window.location.href =
            "/download?path=" +
            encodeURIComponent(product.imagePath);
    });

    // 5. Delete product row
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.className = "delete-btn";

    deleteButton.addEventListener("click", function () {
        row.remove();

        if (productList.children.length === 0) {
            productList.innerHTML =
                '<tr><td colspan="5">No products added yet.</td></tr>';
        }
    });

    actionsCell.append(downloadButton, deleteButton);

    row.append(
        imageCell,
        nameCell,
        priceCell,
        quantityCell,
        actionsCell
    );

    productList.appendChild(row);
}