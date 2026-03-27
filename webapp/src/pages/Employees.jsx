import { useState, useEffect } from 'react';
import api from '../services/api';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', company_id: '' });
  const [error, setError] = useState('');

  const fetchAll = async () => {
    const [emp, comp] = await Promise.all([api.get('/users'), api.get('/companies')]);
    setEmployees(emp.data);
    setCompanies(comp.data);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCreate = async e => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/users', form);
      setForm({ name: '', email: '', password: '', company_id: '' });
      setShowForm(false);
      fetchAll();
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
            <div className="form-group">
              <label>Full Name *</label>
              <input
                placeholder="e.g. John Doe"
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                placeholder="e.g. john@example.com"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Password * (min 6 chars)</label>
              <input
                type="password"
                placeholder="Min 6 characters"
                required
                minLength={6}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Assign Company</label>
              <select
                value={form.company_id}
                onChange={e => setForm({ ...form, company_id: e.target.value })}
              >
                <option value="">— No Company —</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {companies.length === 0 && (
                <p className="field-hint">No companies yet. <a href="/companies">Add a company first →</a></p>
              )}
            </div>
            <button type="submit" className="btn-primary">Create Employee</button>
          </form>
        </div>
      )}

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Company</th>
              <th>Role</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => (
              <tr key={emp.id}>
                <td>{emp.name}</td>
                <td>{emp.email}</td>
                <td>
                  {emp.companies?.name
                    ? <span className="company-tag">🏢 {emp.companies.name}</span>
                    : <span className="muted">—</span>
                  }
                </td>
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
