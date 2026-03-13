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

  useEffect(() => {
    loadProducts();
  }, []);

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

  const handleCreate = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить товар?')) return;
    try {
      await api.deleteProduct(id);
      setProducts(products.filter(p => p.id !== id));
    } catch (err) {
      alert('Ошибка удаления');
    }
  };

  const handleSave = async (productData) => {
    try {
      if (editingProduct) {
        const res = await api.updateProduct(editingProduct.id, productData);
        setProducts(products.map(p => p.id === editingProduct.id ? res.data : p));
      } else {
        const res = await api.createProduct(productData);
        setProducts([...products, res.data]);
      }
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
              <span>Привет, {user?.first_name}!</span>
              <button onClick={logout}>Выйти</button>
            </div>
          ) : (
            <div>
              <button onClick={() => navigate('/login')}>Войти</button>
              <button onClick={() => navigate('/register')}>Регистрация</button>
            </div>
          )}
        </div>
      </header>

      <main className="container">
        <div className="toolbar">
          <h2>Товары</h2>
          {isAuthenticated && <button onClick={handleCreate}>+ Добавить товар</button>}
        </div>

        <ProductList
          products={products}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isAuthenticated={isAuthenticated}
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