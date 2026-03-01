const express = require('express');
const { nanoid } = require('nanoid');
const cors = require('cors');

// подключаем сваггер
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const port = 3000;

// товары которые уже есть в магазине
let products = [
  { id: nanoid(6), name: 'Смартфон', category: 'Электроника', description: 'Современный смартфон с отличной камерой', price: 25000, stock: 15, rating: 4.5, image: 'https://via.placeholder.com/200x150?text=Phone' },
  { id: nanoid(6), name: 'Ноутбук', category: 'Электроника', description: 'Мощный ноутбук для работы и игр', price: 55000, stock: 8, rating: 4.7, image: 'https://via.placeholder.com/200x150?text=Laptop' },
  { id: nanoid(6), name: 'Наушники', category: 'Аксессуары', description: 'Беспроводные наушники с шумоподавлением', price: 4000, stock: 25, rating: 4.3, image: 'https://via.placeholder.com/200x150?text=Headphones' },
  { id: nanoid(6), name: 'Книга JavaScript для начинающих', category: 'Книги', description: 'Самоучитель по JavaScript', price: 800, stock: 50, rating: 4.8, image: 'https://via.placeholder.com/200x150?text=Book' },
  { id: nanoid(6), name: 'Фитнес-браслет', category: 'Электроника', description: 'Отслеживание активности и сна', price: 3000, stock: 12, rating: 4.2, image: 'https://via.placeholder.com/200x150?text=Band' },
  { id: nanoid(6), name: 'Кофеварка', category: 'Техника', description: 'Капельная кофеварка для дома', price: 4500, stock: 7, rating: 4.4, image: 'https://via.placeholder.com/200x150?text=Coffee' },
  { id: nanoid(6), name: 'Рюкзак', category: 'Аксессуары', description: 'Удобный рюкзак для ноутбука', price: 2500, stock: 20, rating: 4.6, image: 'https://via.placeholder.com/200x150?text=Backpack' },
  { id: nanoid(6), name: 'Мышка беспроводная', category: 'Электроника', description: 'Эргономичная мышь', price: 1200, stock: 30, rating: 4.5, image: 'https://via.placeholder.com/200x150?text=Mouse' },
  { id: nanoid(6), name: 'Чайник электрический', category: 'Техника', description: 'Быстрый нагрев, 1.7л', price: 2200, stock: 10, rating: 4.3, image: 'https://via.placeholder.com/200x150?text=Kettle' },
  { id: nanoid(6), name: 'Зарядное устройство', category: 'Электроника', description: 'Быстрая зарядка для телефона', price: 900, stock: 40, rating: 4.7, image: 'https://via.placeholder.com/200x150?text=Charger' }
];

app.use(express.json());
app.use(cors({ origin: 'http://localhost:3001', methods: ['GET', 'POST', 'PATCH', 'DELETE'] }));

// логируем запросы
app.use((req, res, next) => {
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] [${req.method}] ${res.statusCode} ${req.path}`);
    if (req.method === 'POST' || req.method === 'PATCH') {
      console.log('Body:', req.body);
    }
  });
  next();
});

// настройки сваггера
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API интернет-магазина',
      version: '1.0.0',
      description: 'управление товарами',
    },
    servers: [
      {
        url: `http://localhost:${port}`,
        description: 'локальный сервер',
      },
    ],
  },
  apis: ['./app.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
// страница с документацией будет по адресу /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ищем товар по id, если нет - 404
function findProductOr404(id, res) {
  const product = products.find(p => p.id === id);
  if (!product) {
    res.status(404).json({ error: 'товар не найден' });
    return null;
  }
  return product;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - category
 *         - description
 *         - price
 *         - stock
 *       properties:
 *         id:
 *           type: string
 *           description: айди товара
 *           example: "abc123"
 *         name:
 *           type: string
 *           description: название
 *           example: "смартфон"
 *         category:
 *           type: string
 *           description: категория
 *           example: "электроника"
 *         description:
 *           type: string
 *           description: описание
 *           example: "крутой смартфон"
 *         price:
 *           type: number
 *           description: цена
 *           example: 25000
 *         stock:
 *           type: integer
 *           description: сколько на складе
 *           example: 15
 *         rating:
 *           type: number
 *           description: рейтинг
 *           example: 4.5
 *         image:
 *           type: string
 *           description: ссылка на фото
 *           example: "https://example.com/phone.jpg"
 */

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: получить все товары
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: ок
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
app.get('/api/products', (req, res) => {
  res.json(products);
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: получить один товар по айди
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: айди товара
 *     responses:
 *       200:
 *         description: ок
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: нет такого
 */
app.get('/api/products/:id', (req, res) => {
  const product = findProductOr404(req.params.id, res);
  if (product) res.json(product);
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: создать новый товар
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category
 *               - description
 *               - price
 *               - stock
 *             properties:
 *               name:
 *                 type: string
 *                 example: "планшет"
 *               category:
 *                 type: string
 *                 example: "электроника"
 *               description:
 *                 type: string
 *                 example: "новый планшет"
 *               price:
 *                 type: number
 *                 example: 30000
 *               stock:
 *                 type: integer
 *                 example: 10
 *               rating:
 *                 type: number
 *                 example: 4.8
 *               image:
 *                 type: string
 *                 example: "https://example.com/tablet.jpg"
 *     responses:
 *       201:
 *         description: создано
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: не все поля заполнены
 */
app.post('/api/products', (req, res) => {
  const { name, category, description, price, stock, rating, image } = req.body;
  if (!name || !category || !description || price === undefined || stock === undefined) {
    return res.status(400).json({ error: 'заполни все поля' });
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

/**
 * @swagger
 * /api/products/{id}:
 *   patch:
 *     summary: обновить товар
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: айди товара
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "новое название"
 *               category:
 *                 type: string
 *                 example: "новая категория"
 *               description:
 *                 type: string
 *                 example: "новое описание"
 *               price:
 *                 type: number
 *                 example: 35000
 *               stock:
 *                 type: integer
 *                 example: 5
 *               rating:
 *                 type: number
 *                 example: 4.9
 *               image:
 *                 type: string
 *                 example: "https://example.com/new.jpg"
 *     responses:
 *       200:
 *         description: обновлено
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: ничего не прислали для обновления
 *       404:
 *         description: товар не найден
 */
app.patch('/api/products/:id', (req, res) => {
  const product = findProductOr404(req.params.id, res);
  if (!product) return;

  if (req.body?.name === undefined && req.body?.category === undefined &&
      req.body?.description === undefined && req.body?.price === undefined &&
      req.body?.stock === undefined && req.body?.rating === undefined &&
      req.body?.image === undefined) {
    return res.status(400).json({ error: 'ничего не меняешь' });
  }

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

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: удалить товар
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: айди товара
 *     responses:
 *       204:
 *         description: удалили
 *       404:
 *         description: товара нет
 */
app.delete('/api/products/:id', (req, res) => {
  const exists = products.some(p => p.id === req.params.id);
  if (!exists) return res.status(404).json({ error: 'товар не найден' });
  products = products.filter(p => p.id !== req.params.id);
  res.status(204).send();
});

// если ни один маршрут не подошел
app.use((req, res) => {
  res.status(404).json({ error: 'не туда попал' });
});

// если ошибка на сервере
app.use((err, req, res, next) => {
  console.error('ошибка:', err);
  res.status(500).json({ error: 'всё сломалось' });
});

app.listen(port, () => {
  console.log(`сервер работает на http://localhost:${port}`);
  console.log(`сваггер тут http://localhost:${port}/api-docs`);
});