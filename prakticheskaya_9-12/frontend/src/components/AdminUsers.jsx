import React, { useState, useEffect } from 'react';
import { api } from '../api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ first_name: '', last_name: '', role: 'user', active: true });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await api.getUsers();
      setUsers(res.data);
    } catch (err) {
      console.error(err);
      alert('Ошибка загрузки пользователей');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditing(user.id);
    setForm({
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      active: user.active,
    });
  };

  const handleSave = async (id) => {
    try {
      await api.updateUser(id, form);
      setEditing(null);
      loadUsers();
    } catch (err) {
      alert('Ошибка обновления');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Удалить пользователя?')) {
      try {
        await api.deleteUser(id);
        loadUsers();
      } catch (err) {
        alert('Ошибка удаления');
      }
    }
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="container">
      <h2>Управление пользователями</h2>
      <table className="users-table">
        <thead>
          <tr>
            <th>ID</th><th>Email</th><th>Имя</th><th>Фамилия</th><th>Роль</th><th>Активен</th><th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.email}</td>
              <td>
                {editing === user.id ? (
                  <input value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} />
                ) : user.first_name}
              </td>
              <td>
                {editing === user.id ? (
                  <input value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} />
                ) : user.last_name}
              </td>
              <td>
                {editing === user.id ? (
                  <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                    <option value="user">Пользователь</option>
                    <option value="seller">Продавец</option>
                    <option value="admin">Администратор</option>
                  </select>
                ) : user.role}
              </td>
              <td>
                {editing === user.id ? (
                  <input type="checkbox" checked={form.active} onChange={e => setForm({...form, active: e.target.checked})} />
                ) : (user.active ? 'Да' : 'Нет')}
              </td>
              <td>
                {editing === user.id ? (
                  <>
                    <button onClick={() => handleSave(user.id)}>Сохранить</button>
                    <button onClick={() => setEditing(null)}>Отмена</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => handleEdit(user)}>Редактировать</button>
                    <button onClick={() => handleDelete(user.id)}>Удалить</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}