const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

let products = [
    { id: 1, name: 'Телефон', price: 15000 },
    { id: 2, name: 'Ноутбук', price: 45000 },
    { id: 3, name: 'Наушники', price: 2000 }
];

// Главная страница с подсказкой
app.get('/', (req, res) => {
    res.send('Магазин товаров API. Перейти в /products чтобы увидеть товары');
});

// получить все товары (READ - все)
app.get('/products', (req, res) => {
    res.json(products);
});

// получить товар по id (READ - один)
app.get('/products/:id', (req, res) => {
    const product = products.find(p => p.id == req.params.id);
    
    if (!product) {
        return res.status(404).json({ error: 'Товар не найден' });
    }
    
    res.json(product);
});

// добавить новый товар (CREATE)
app.post('/products', (req, res) => {
    const { name, price } = req.body;
    
    if (!name || !price) {
        return res.status(400).json({ error: 'Укажите название и цену' });
    }
    
    const newProduct = {
        id: Date.now(),
        name: name,
        price: price
    };
    
    products.push(newProduct);
    res.status(201).json(newProduct);
});

// изменить товар (UPDATE)
app.put('/products/:id', (req, res) => {
    const product = products.find(p => p.id == req.params.id);
    
    if (!product) {
        return res.status(404).json({ error: 'Товар не найден' });
    }
    
    const { name, price } = req.body;
    
    if (name) product.name = name;
    if (price) product.price = price;
    
    res.json(product);
});

// удалить товар (DELETE)
app.delete('/products/:id', (req, res) => {
    const productIndex = products.findIndex(p => p.id == req.params.id);
    
    if (productIndex === -1) {
        return res.status(404).json({ error: 'Товар не найден' });
    }
    
    products.splice(productIndex, 1);
    res.json({ message: 'Товар удален' });
});

app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});