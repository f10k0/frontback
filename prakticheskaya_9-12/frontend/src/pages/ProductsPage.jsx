import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import ProductList from '../components/ProductList';
import ProductModal from '../components/ProductModal';
import { useNavigate } from 'react-router-dom';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const loadProducts = async () => {
    try {
      const res = await api.getProducts();
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  //права доступа
  const canEdit = () => user && (user.role === 'seller' || user.role === 'admin');
  const canDelete = () => user && user.role === 'admin';
  const canCreate = () => user && (user.role === 'seller' || user.role === 'admin');

  const handleCreate = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setEditingProduct(null);
    setModalOpen(true);
  };
  const handleEdit = (product) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setEditingProduct(product);
    setModalOpen(true);
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Удалить товар?')) return;
    try {
      await api.deleteProduct(id);
      loadProducts();
    } catch (err) {
      alert('Ошибка удаления');
    }
  };
  const handleSave = async (productData) => {
    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, productData);
      } else {
        await api.createProduct(productData);
      }
      loadProducts();
      setModalOpen(false);
    } catch (err) {
      alert('Ошибка сохранения');
    }
  };

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <div className="page">
      <header className="header">
        <div className="container">
          <h1>Магазин товаров</h1>
          {isAuthenticated ? (
            <div className="user-info">
              <span>Привет, {user?.first_name}! (Роль: {user?.role})</span>
              {user?.role === 'admin' && (
                <button onClick={() => navigate('/users')}>Управление пользователями</button>
              )}
              <button onClick={logout}>Выйти</button>
            </div>
          ) : (
            <div className="user-info">
              <span>Гость</span>
              <button onClick={() => navigate('/login')}>Войти</button>
              <button onClick={() => navigate('/register')}>Регистрация</button>
            </div>
          )}
        </div>
      </header>

      <main className="container">
        <div className="toolbar">
          <h2>Товары</h2>
          {canCreate() && <button onClick={handleCreate}>+ Добавить товар</button>}
          {!isAuthenticated && <span className="login-prompt">Войдите, чтобы как-либо взаимодействовать с товарами</span>}
        </div>

        <ProductList
          products={products}
          onEdit={handleEdit}
          onDelete={handleDelete}
          canEdit={canEdit()}
          canDelete={canDelete()}
        />
      </main>

      <ProductModal
        open={modalOpen}
        product={editingProduct}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}