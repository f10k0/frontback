const express = require('express');
const { nanoid } = require('nanoid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const port = 3000;

const ACCESS_SECRET = 'access_secret_key';
const REFRESH_SECRET = 'refresh_secret_key';

const ACCESS_EXPIRES_IN = '15m';
const REFRESH_EXPIRES_IN = '7d';

let users = [];
let products = [];
let refreshTokens = new Set();

(async () => {
  //админка
  const adminExists = users.find(u => u.email === 'admin@example.com');
  if (!adminExists) {
    const hashedAdminPassword = await bcrypt.hash('admin123', 10);
    users.push({
      id: nanoid(6),
      email: 'admin@example.com',
      first_name: 'Admin',
      last_name: 'Adminov',
      hashedPassword: hashedAdminPassword,
      role: 'admin',
      active: true
    });
  }

  const sellerExists = users.find(u => u.email === 'seller@example.com');
  if (!sellerExists) {
    const hashedSellerPassword = await bcrypt.hash('seller123', 10);
    users.push({
      id: nanoid(6),
      email: 'seller@example.com',
      first_name: 'Seller',
      last_name: 'Sellovich',
      hashedPassword: hashedSellerPassword,
      role: 'seller',
      active: true
    });
  }
})();

products.push(
  { id: nanoid(6), title: 'Смартфон', category: 'Электроника', description: 'Отличный смартфон', price: 25000, image: 'https://via.placeholder.com/200x150?text=Phone' },
  { id: nanoid(6), title: 'Ноутбук', category: 'Электроника', description: 'Мощный ноутбук', price: 55000, image: 'https://via.placeholder.com/200x150?text=Laptop' },
  { id: nanoid(6), title: 'Наушники', category: 'Аксессуары', description: 'Беспроводные наушники', price: 4000, image: 'https://via.placeholder.com/200x150?text=Headphones' }
);

app.use(express.json());
app.use(cors());

function generateAccessToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN }
  );
}
function generateRefreshToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN }
  );
}
function findUserByEmail(email) {
  return users.find(u => u.email === email);
}
function findUserById(id) {
  return users.find(u => u.id === id);
}
function findProductOr404(id, res) {
  const product = products.find(p => p.id === id);
  if (!product) {
    res.status(404).json({ error: 'Товар не найден' });
    return null;
  }
  return product;
}
function findUserOr404(id, res) {
  const user = users.find(u => u.id === id);
  if (!user) {
    res.status(404).json({ error: 'Пользователь не найден' });
    return null;
  }
  return user;
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Не авторизован' });
  }
  try {
    const payload = jwt.verify(token, ACCESS_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Недействительный или просроченный токен' });
  }
}
function roleMiddleware(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Не авторизован' });
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Доступ запрещён' });
    }
    next();
  };
}

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
    role: 'user',
    active: true
  };
  users.push(newUser);
  res.status(201).json({
    id: newUser.id,
    email: newUser.email,
    first_name: newUser.first_name,
    last_name: newUser.last_name,
    role: newUser.role
  });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email и пароль обязательны' });
  }
  const user = findUserByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.hashedPassword))) {
    return res.status(401).json({ error: 'Неверные данные' });
  }
  if (!user.active) {
    return res.status(403).json({ error: 'Пользователь заблокирован' });
  }
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  refreshTokens.add(refreshToken);
  res.json({ accessToken, refreshToken });
});

app.post('/api/auth/refresh', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: 'refreshToken обязателен' });
  }
  if (!refreshTokens.has(refreshToken)) {
    return res.status(401).json({ error: 'Недействительный refresh-токен' });
  }
  try {
    const payload = jwt.verify(refreshToken, REFRESH_SECRET);
    const user = findUserById(payload.sub);
    if (!user || !user.active) {
      return res.status(401).json({ error: 'Пользователь не найден или заблокирован' });
    }

    refreshTokens.delete(refreshToken);
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    refreshTokens.add(newRefreshToken);
    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    return res.status(401).json({ error: 'Недействительный или просроченный refresh-токен' });
  }
});


app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = findUserById(req.user.sub);
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
  res.json({
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    role: user.role,
    active: user.active
  });
});

app.get('/api/users', authMiddleware, roleMiddleware(['admin']), (req, res) => {
  const safeUsers = users.map(u => ({
    id: u.id,
    email: u.email,
    first_name: u.first_name,
    last_name: u.last_name,
    role: u.role,
    active: u.active
  }));
  res.json(safeUsers);
});

app.get('/api/users/:id', authMiddleware, roleMiddleware(['admin']), (req, res) => {
  const user = findUserOr404(req.params.id, res);
  if (!user) return;
  res.json({
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    role: user.role,
    active: user.active
  });
});

app.put('/api/users/:id', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  const user = findUserOr404(req.params.id, res);
  if (!user) return;
  const { first_name, last_name, role, active } = req.body;
  if (first_name !== undefined) user.first_name = first_name;
  if (last_name !== undefined) user.last_name = last_name;
  if (role !== undefined && ['user', 'seller', 'admin'].includes(role)) user.role = role;
  if (active !== undefined) user.active = Boolean(active);
  if (active === false) {

    for (let rt of refreshTokens) {
      try {
        const decoded = jwt.verify(rt, REFRESH_SECRET);
        if (decoded.sub === user.id) refreshTokens.delete(rt);
      } catch {}
    }
  }
  res.json({
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    role: user.role,
    active: user.active
  });
});

app.delete('/api/users/:id', authMiddleware, roleMiddleware(['admin']), (req, res) => {
  const user = findUserOr404(req.params.id, res);
  if (!user) return;
  users = users.filter(u => u.id !== req.params.id);

  for (let rt of refreshTokens) {
    try {
      const decoded = jwt.verify(rt, REFRESH_SECRET);
      if (decoded.sub === req.params.id) refreshTokens.delete(rt);
    } catch {}
  }
  res.status(204).send();
});

app.get('/api/products', (req, res) => {
  res.json(products);
});

app.get('/api/products/:id', (req, res) => {
  const product = findProductOr404(req.params.id, res);
  if (product) res.json(product);
});

app.post('/api/products', authMiddleware, roleMiddleware(['seller', 'admin']), (req, res) => {
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
    image: image || null
  };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

app.put('/api/products/:id', authMiddleware, roleMiddleware(['seller', 'admin']), (req, res) => {
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

app.delete('/api/products/:id', authMiddleware, roleMiddleware(['admin']), (req, res) => {
  const index = products.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Товар не найден' });
  }
  products.splice(index, 1);
  res.status(204).send();
});

app.use((req, res) => {
  res.status(404).json({ error: 'Маршрут не найден' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});