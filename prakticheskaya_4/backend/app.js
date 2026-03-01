const express = require('express');
const { nanoid } = require('nanoid');
const cors = require('cors');

const app = express();
const port = 3000;

let products = [
  { id: nanoid(6), name: 'Смартфон', category: 'Электроника', description: 'Современный смартфон с отличной камерой', price: 25000, stock: 15, rating: 4.5, image: 'https://via.placeholder.com/200x150?text=Phone' },
  { id: nanoid(6), name: 'Ноутбук', category: 'Электроника', description: 'Мощный ноутбук для работы и игр', price: 55000, stock: 8, rating: 4.7, image: 'https://via.placeholder.com/200x150?text=Laptop' },
  { id: nanoid(6), name: 'Наушники', category: 'Аксессуары', description: 'Беспроводные наушники с шумоподавлением', price: 4000, stock: 25, rating: 4.3, image: 'https://via.placeholder.com/200x150?text=Headphones' },
  { id: nanoid(6), name: 'Книга "JavaScript для начинающих"', category: 'Книги', description: 'Самоучитель по JavaScript', price: 800, stock: 50, rating: 4.8, image: 'https://via.placeholder.com/200x150?text=Book' },
  { id: nanoid(6), name: 'Фитнес-браслет', category: 'Электроника', description: 'Отслеживание активности и сна', price: 3000, stock: 12, rating: 4.2, image: 'https://via.placeholder.com/200x150?text=Band' },
  { id: nanoid(6), name: 'Кофеварка', category: 'Техника', description: 'Капельная кофеварка для дома', price: 4500, stock: 7, rating: 4.4, image: 'https://via.placeholder.com/200x150?text=Coffee' },
  { id: nanoid(6), name: 'Рюкзак', category: 'Аксессуары', description: 'Удобный рюкзак для ноутбука', price: 2500, stock: 20, rating: 4.6, image: 'https://via.placeholder.com/200x150?text=Backpack' },
  { id: nanoid(6), name: 'Мышка беспроводная', category: 'Электроника', description: 'Эргономичная мышь', price: 1200, stock: 30, rating: 4.5, image: 'https://via.placeholder.com/200x150?text=Mouse' },
  { id: nanoid(6), name: 'Чайник электрический', category: 'Техника', description: 'Быстрый нагрев, 1.7л', price: 2200, stock: 10, rating: 4.3, image: 'https://via.placeholder.com/200x150?text=Kettle' },
  { id: nanoid(6), name: 'Зарядное устройство', category: 'Электроника', description: 'Быстрая зарядка для телефона', price: 900, stock: 40, rating: 4.7, image: 'https://via.placeholder.com/200x150?text=Charger' }
];

app.use(express.json());
app.use(cors({ origin: 'http://localhost:3001', methods: ['GET', 'POST', 'PATCH', 'DELETE'] }));

app.use((req, res, next) => {
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] [${req.method}] ${res.statusCode} ${req.path}`);
    if (req.method === 'POST' || req.method === 'PATCH') {
      console.log('Body:', req.body);
    }
  });
  next();
});

function findProductOr404(id, res) {
  const product = products.find(p => p.id === id);
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return null;
  }
  return product;
}

app.get('/api/products', (req, res) => {
  res.json(products);
});

app.get('/api/products/:id', (req, res) => {
  const product = findProductOr404(req.params.id, res);
  if (product) res.json(product);
});

app.post('/api/products', (req, res) => {
  const { name, category, description, price, stock, rating, image } = req.body;
  if (!name || !category || !description || price === undefined || stock === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const newProduct = {
    id: nanoid(6),
    name: name.trim(),
    category,
    description,
    price: Number(price),
    stock: Number(stock),
    rating: rating ? Number(rating) : null,
    image: image || null
  };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

app.patch('/api/products/:id', (req, res) => {
  const product = findProductOr404(req.params.id, res);
  if (!product) return;

  const { name, category, description, price, stock, rating, image } = req.body;
  if (name !== undefined) product.name = name.trim();
  if (category !== undefined) product.category = category;
  if (description !== undefined) product.description = description;
  if (price !== undefined) product.price = Number(price);
  if (stock !== undefined) product.stock = Number(stock);
  if (rating !== undefined) product.rating = rating ? Number(rating) : null;
  if (image !== undefined) product.image = image;

  res.json(product);
});

app.delete('/api/products/:id', (req, res) => {
  const exists = products.some(p => p.id === req.params.id);
  if (!exists) return res.status(404).json({ error: 'Product not found' });
  products = products.filter(p => p.id !== req.params.id);
  res.status(204).send();
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});