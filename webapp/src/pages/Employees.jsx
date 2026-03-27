import { useState, useEffect } from 'react';
import api from '../services/api';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  const fetchEmployees = () => api.get('/users').then(r => setEmployees(r.data));

  useEffect(() => { fetchEmployees(); }, []);

  const handleCreate = async e => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/users', form);
      setForm({ name: '', email: '', password: '' });
      setShowForm(false);
      fetchEmployees();
    } catch (err) {
      setError(err.error || 'Failed to create employee');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Employees</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Employee'}
        </button>
      </div>

      {showForm && (
        <div className="form-card">
          <h3>New Employee</h3>
          {error && <div className="error-msg">{error}</div>}
          <form onSubmit={handleCreate}>
            <input placeholder="Full Name" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <input type="email" placeholder="Email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            <input type="password" placeholder="Password (min 6 chars)" required minLength={6} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            <button type="submit" className="btn-primary">Create</button>
          </form>
        </div>
      )}

      <div className="table-card">
        <table>
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th></tr>
          </thead>
          <tbody>
            {employees.map(emp => (
              <tr key={emp.id}>
                <td>{emp.name}</td>
                <td>{emp.email}</td>
                <td><span className={`badge badge-${emp.role}`}>{emp.role}</span></td>
                <td>{new Date(emp.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {employees.length === 0 && <p className="empty-state">No employees found.</p>}
      </div>
    </div>
  );
};

export default Employees;
