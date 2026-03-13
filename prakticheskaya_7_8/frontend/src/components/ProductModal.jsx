import React, { useState, useEffect } from 'react';

export default function ProductModal({ open, product, onClose, onSave }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState('');

  useEffect(() => {
    if (product) {
      setTitle(product.title);
      setCategory(product.category);
      setDescription(product.description);
      setPrice(product.price);
      setImage(product.image || '');
    } else {
      setTitle('');
      setCategory('');
      setDescription('');
      setPrice('');
      setImage('');
    }
  }, [product]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      title,
      category,
      description,
      price: Number(price),
      image: image || null,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>{product ? 'Редактировать товар' : 'Создать товар'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Название</label>
            <input value={title} onChange={e => setTitle(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Категория</label>
            <input value={category} onChange={e => setCategory(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Описание</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Цена (₽)</label>
            <input type="number" value={price} onChange={e => setPrice(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>URL изображения (опционально)</label>
            <input type="url" value={image} onChange={e => setImage(e.target.value)} placeholder="https://..." />
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose}>Отмена</button>
            <button type="submit">Сохранить</button>
          </div>
        </form>
      </div>
    </div>
  );
}