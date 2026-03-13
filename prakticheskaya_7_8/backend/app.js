const express = require('express');
const { nanoid } = require('nanoid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const port = 3000;

const JWT_SECRET = 'your-secret-key-change-in-production';
const ACCESS_EXPIRES_IN = '15m';

let users = [];
let products = [];

products.push(
  { id: nanoid(6), title: 'Смартфон', category: 'Электроника', description: 'Отличный смартфон', price: 25000, image: 'https://via.placeholder.com/200x150?text=Phone' },
  { id: nanoid(6), title: 'Ноутбук', category: 'Электроника', description: 'Мощный ноутбук', price: 55000, image: 'https://via.placeholder.com/200x150?text=Laptop' },
  { id: nanoid(6), title: 'Наушники', category: 'Аксессуары', description: 'Беспроводные наушники', price: 4000, image: 'https://via.placeholder.com/200x150?text=Headphones' }
);

app.use(express.json());
app.use(cors());

//настройки свагера
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API интернет-магазина с аутентификацией',
      version: '1.0.0',
      description: 'Управление товарами и пользователями (JWT)',
    },
    servers: [{ url: `http://localhost:${port}` }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./app.js'], //файл с аннотациями
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

//вспм функции
function findUserByEmail(email) {
  return users.find(u => u.email === email);
}
function findProductOr404(id, res) {
  const product = products.find(p => p.id === id);
  if (!product) {
    res.status(404).json({ error: 'Товар не найден' });
    return null;
  }
  return product;
}

// Middleware для проверки JWT
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Не авторизован' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { sub, email, first_name, last_name, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Недействительный или просроченный токен' });
  }
}

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required: [email, first_name, last_name, password]
 *       properties:
 *         id: { type: string, example: "abc123" }
 *         email: { type: string, example: "user@example.com" }
 *         first_name: { type: string, example: "Иван" }
 *         last_name: { type: string, example: "Иванов" }
 *     Product:
 *       type: object
 *       required: [title, category, description, price]
 *       properties:
 *         id: { type: string, example: "def456" }
 *         title: { type: string, example: "Смартфон" }
 *         category: { type: string, example: "Электроника" }
 *         description: { type: string, example: "Описание товара" }
 *         price: { type: number, example: 25000 }
 *         image: { type: string, example: "https://via.placeholder.com/200x150?text=Phone" }
 */

// ---------- Аутентификация ----------
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Регистрация нового пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, first_name, last_name, password]
 *             properties:
 *               email: { type: string, example: "user@example.com" }
 *               first_name: { type: string, example: "Иван" }
 *               last_name: { type: string, example: "Иванов" }
 *               password: { type: string, example: "123456" }
 *     responses:
 *       201:
 *         description: Пользователь создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Ошибка валидации или email уже занят
 */
app.post('/api/auth/register', async (req, res) => {
  const { email, first_name, last_name, password } = req.body;
  if (!email || !first_name || !last_name || !password) {
    return res.status(400).json({ error: 'Все поля обязательны' });
  }
  if (findUserByEmail(email)) {
    return res.status(400).json({ error: 'Email уже занят' });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = {
    id: nanoid(6),
    email,
    first_name,
    last_name,
    hashedPassword,
  };
  users.push(newUser);
  res.status(201).json({
    id: newUser.id,
    email: newUser.email,
    first_name: newUser.first_name,
    last_name: newUser.last_name,
  });
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Вход в систему
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: "user@example.com" }
 *               password: { type: string, example: "123456" }
 *     responses:
 *       200:
 *         description: Успешный вход, возвращает JWT токен
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken: { type: string }
 *       401:
 *         description: Неверные учётные данные
 */
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email и пароль обязательны' });
  }
  const user = findUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: 'Неверные данные' });
  }
  const isValid = await bcrypt.compare(password, user.hashedPassword);
  if (!isValid) {
    return res.status(401).json({ error: 'Неверные данные' });
  }
  const accessToken = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
    },
    JWT_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN }
  );
  res.json({ accessToken });
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Получить данные текущего пользователя
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Объект пользователя
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Не авторизован
 */
app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = users.find(u => u.id === req.user.sub);
  if (!user) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }
  res.json({
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
  });
});

// ---------- Товары ----------
/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Получить список всех товаров (доступно без авторизации)
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Массив товаров
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
 *     summary: Получить товар по id (доступно без авторизации)
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: ID товара
 *     responses:
 *       200:
 *         description: Товар
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Не найден
 */
app.get('/api/products/:id', (req, res) => {
  const product = findProductOr404(req.params.id, res);
  if (product) res.json(product);
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создать новый товар (только для авторизованных)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, category, description, price]
 *             properties:
 *               title: { type: string, example: "Планшет" }
 *               category: { type: string, example: "Электроника" }
 *               description: { type: string, example: "Новый планшет" }
 *               price: { type: number, example: 30000 }
 *               image: { type: string, example: "https://example.com/tablet.jpg" }
 *     responses:
 *       201:
 *         description: Созданный товар
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Не все поля
 *       401:
 *         description: Не авторизован
 */
app.post('/api/products', authMiddleware, (req, res) => {
  const { title, category, description, price, image } = req.body;
  if (!title || !category || !description || price === undefined) {
    return res.status(400).json({ error: 'Заполните title, category, description, price' });
  }
  const newProduct = {
    id: nanoid(6),
    title,
    category,
    description,
    price: Number(price),
    image: image || null,
  };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Полностью обновить товар (только для авторизованных)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: ID товара
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, category, description, price]
 *             properties:
 *               title: { type: string }
 *               category: { type: string }
 *               description: { type: string }
 *               price: { type: number }
 *               image: { type: string }
 *     responses:
 *       200:
 *         description: Обновлённый товар
 *       400:
 *         description: Не все поля
 *       401:
 *         description: Не авторизован
 *       404:
 *         description: Товар не найден
 */
app.put('/api/products/:id', authMiddleware, (req, res) => {
  const product = findProductOr404(req.params.id, res);
  if (!product) return;
  const { title, category, description, price, image } = req.body;
  if (!title || !category || !description || price === undefined) {
    return res.status(400).json({ error: 'Заполните title, category, description, price' });
  }
  product.title = title;
  product.category = category;
  product.description = description;
  product.price = Number(price);
  product.image = image || product.image;
  res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Удалить товар (только для авторизованных)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: ID товара
 *     responses:
 *       204:
 *         description: Удалено (нет содержимого)
 *       401:
 *         description: Не авторизован
 *       404:
 *         description: Товар не найден
 */
app.delete('/api/products/:id', authMiddleware, (req, res) => {
  const index = products.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Товар не найден' });
  }
  products.splice(index, 1);
  res.status(204).send();
});

//для несуществующих маршрутов
app.use((req, res) => {
  res.status(404).json({ error: 'Маршрут не найден' });
});

//глобальный обработчик ошибок
app.use((err, req, res, next) => {
  console.error('Ошибка сервера:', err);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
  console.log(`Swagger UI: http://localhost:${port}/api-docs`);
});