import React from 'react';

export default function ProductItem({ product, onEdit, onDelete, isAuthenticated }) {
  console.log('Product image:', product.image);
  return (
    <div className="product-card">
      {product.image && (
        <div className="product-image">
          <img src={product.image} alt={product.title} onError={(e) => console.log('Image load error', e)} />
        </div>
      )}
      <div className="product-info">
        <h3>{product.title}</h3>
        <p className="category">{product.category}</p>
        <p className="description">{product.description}</p>
        <p className="price">{product.price} ₽</p>
        {isAuthenticated && (
          <div className="product-actions">
            <button onClick={() => onEdit(product)}>Редактировать</button>
            <button onClick={() => onDelete(product.id)}>Удалить</button>
          </div>
        )}
      </div>
    </div>
  );
}