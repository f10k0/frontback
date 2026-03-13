import React from 'react';
import ProductItem from './ProductItem';

export default function ProductList({ products, onEdit, onDelete, isAuthenticated }) {
  if (!products.length) {
    return <p className="empty">Товаров пока нет</p>;
  }
  return (
    <div className="product-list">
      {products.map(product => (
        <ProductItem
          key={product.id}
          product={product}
          onEdit={onEdit}
          onDelete={onDelete}
          isAuthenticated={isAuthenticated}
        />
      ))}
    </div>
  );
}