import React from 'react';

export default function ProductItem({ product, onEdit, onDelete, canEdit, canDelete }) {
  return (
    <div className="product-card">
      {product.image && (
        <div className="product-image">
          <img src={product.image} alt={product.title} />
        </div>
      )}
      <div className="product-info">
        <h3>{product.title}</h3>
        <p className="category">{product.category}</p>
        <p className="description">{product.description}</p>
        <p className="price">{product.price} ₽</p>
        <div className="product-actions">
          {canEdit && <button onClick={() => onEdit(product)}>Редактировать</button>}
          {canDelete && <button onClick={() => onDelete(product.id)}>Удалить</button>}
        </div>
      </div>
    </div>
  );
}