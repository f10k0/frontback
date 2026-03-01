import React, { useEffect, useState } from 'react';

export default function ProductModal({ open, mode, initialProduct, onClose, onSubmit }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [rating, setRating] = useState('');
  const [image, setImage] = useState('');

  useEffect(() => {
    if (!open) return;
    setName(initialProduct?.name || '');
    setCategory(initialProduct?.category || '');
    setDescription(initialProduct?.description || '');
    setPrice(initialProduct?.price != null ? String(initialProduct.price) : '');
    setStock(initialProduct?.stock != null ? String(initialProduct.stock) : '');
    setRating(initialProduct?.rating != null ? String(initialProduct.rating) : '');
    setImage(initialProduct?.image || '');
  }, [open, initialProduct]);

  if (!open) return null;

  const title = mode === 'edit' ? 'Редактирование товара' : 'Создание товара';

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedCategory = category.trim();
    const trimmedDescription = description.trim();
    const parsedPrice = Number(price);
    const parsedStock = Number(stock);
    const parsedRating = rating ? Number(rating) : null;

    if (!trimmedName) { alert('Введите название'); return; }
    if (!trimmedCategory) { alert('Введите категорию'); return; }
    if (!trimmedDescription) { alert('Введите описание'); return; }
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) { alert('Введите корректную цену'); return; }
    if (!Number.isInteger(parsedStock) || parsedStock < 0) { alert('Введите целое количество на складе'); return; }
    if (parsedRating !== null && (parsedRating < 0 || parsedRating > 5)) { alert('Рейтинг должен быть от 0 до 5'); return; }

    onSubmit({
      id: initialProduct?.id,
      name: trimmedName,
      category: trimmedCategory,
      description: trimmedDescription,
      price: parsedPrice,
      stock: parsedStock,
      rating: parsedRating,
      image: image.trim() || null,
    });
  };

  return (
    <div className="backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={e => e.stopPropagation()} role="dialog">
        <div className="modal__header">
          <div className="modal__title">{title}</div>
          <button className="iconBtn" onClick={onClose}>×</button>
        </div>
        <form className="form" onSubmit={handleSubmit}>
          <label className="label">
            Название
            <input className="input" value={name} onChange={e => setName(e.target.value)} autoFocus />
          </label>
          <label className="label">
            Категория
            <input className="input" value={category} onChange={e => setCategory(e.target.value)} />
          </label>
          <label className="label">
            Описание
            <textarea className="input" value={description} onChange={e => setDescription(e.target.value)} />
          </label>
          <label className="label">
            Цена (₽)
            <input className="input" type="number" value={price} onChange={e => setPrice(e.target.value)} />
          </label>
          <label className="label">
            Количество на складе
            <input className="input" type="number" value={stock} onChange={e => setStock(e.target.value)} />
          </label>
          <label className="label">
            Рейтинг (0–5, опционально)
            <input className="input" type="number" step="0.1" min="0" max="5" value={rating} onChange={e => setRating(e.target.value)} />
          </label>
          <label className="label">
            Фото (URL, опционально)
            <input className="input" value={image} onChange={e => setImage(e.target.value)} placeholder="https://..." />
          </label>
          <div className="modal__footer">
            <button type="button" className="btn" onClick={onClose}>Отмена</button>
            <button type="submit" className="btn btn--primary">{mode === 'edit' ? 'Сохранить' : 'Создать'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}