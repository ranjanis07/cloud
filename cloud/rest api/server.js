
const express = require('express');
const app = express();

app.use(express.json());

let products = [
    { id: 1, name: 'Laptop', price: 1999.99 },
    { id: 2, name: 'Wireless Mouse', price: 325.50 }
];

app.get('/', (req, res) => {
    res.send('Inventory API Home');
});

// GET all products
app.get('/api/products', (req, res) => {
    res.json(products);
});

// GET product by ID
app.get('/api/products/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const product = products.find(p => p.id === id);

    if (!product) {
        return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
});

// POST new product
app.post('/api/products', (req, res) => {
    const { name, price } = req.body;

    if (!name || price === undefined) {
        return res.status(400).json({
            error: 'Name and price are required'
        });
    }

    const nextId = products.length > 0
        ? Math.max(...products.map(p => p.id)) + 1
        : 1;

    const newProduct = {
        id: nextId,
        name,
        price: parseFloat(price)
    };

    products.push(newProduct);
    res.status(201).json(newProduct);
});

// PUT update product
app.put('/api/products/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { name, price } = req.body;
    const product = products.find(p => p.id === id);

    if (!product) {
        return res.status(404).json({ error: 'Product not found' });
    }

    if (!name || price === undefined) {
        return res.status(400).json({
            error: 'Name and price are required'
        });
    }

    product.name = name;
    product.price = parseFloat(price);

    res.json(product);
});

// DELETE product
app.delete('/api/products/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = products.findIndex(p => p.id === id);

    if (index === -1) {
        return res.status(404).json({ error: 'Product not found' });
    }

    const deletedProduct = products.splice(index, 1)[0];

    res.json({
        message: 'Product deleted successfully',
        deletedProduct
    });
});

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
