import { useState, useEffect } from 'react';
import api from '../services/api';

const Companies = () => {
  const [companies, setCompanies] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', address_line1: '', address_line2: '' });
  const [error, setError] = useState('');

  const fetchCompanies = () => api.get('/companies').then(r => setCompanies(r.data));

  useEffect(() => { fetchCompanies(); }, []);

  const resetForm = () => {
    setForm({ name: '', address_line1: '', address_line2: '' });
    setEditingId(null);
    setShowForm(false);
    setError('');
  };

  const handleEdit = (company) => {
    setForm({ name: company.name, address_line1: company.address_line1 || '', address_line2: company.address_line2 || '' });
    setEditingId(company.id);
    setShowForm(true);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await api.put(`/companies/${editingId}`, form);
      } else {
        await api.post('/companies', form);
      }
      resetForm();
      fetchCompanies();
    } catch (err) {
      setError(err.error || 'Failed to save company');
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this company? Employees assigned to it will be unassigned.')) return;
    await api.delete(`/companies/${id}`);
    fetchCompanies();
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>🏢 Companies</h1>
        <button className="btn-primary" onClick={() => { resetForm(); setShowForm(!showForm); }}>
          {showForm ? 'Cancel' : '+ Add Company'}
        </button>
      </div>

      {showForm && (
        <div className="form-card">
          <h3>{editingId ? 'Edit Company' : 'New Company'}</h3>
          {error && <div className="error-msg">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Company Name *</label>
              <input
                placeholder="e.g. Acme Corp"
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Address Line 1</label>
              <input
                placeholder="e.g. 123 Main Street, Floor 4"
                value={form.address_line1}
                onChange={e => setForm({ ...form, address_line1: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Address Line 2</label>
              <input
                placeholder="e.g. Mumbai, Maharashtra 400001"
                value={form.address_line2}
                onChange={e => setForm({ ...form, address_line2: e.target.value })}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" className="btn-primary">{editingId ? 'Update' : 'Create'}</button>
              <button type="button" className="btn-secondary" onClick={resetForm}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {companies.length === 0 && !showForm ? (
        <div className="empty-card">
          <p>🏢</p>
          <p>No companies added yet.</p>
          <button className="btn-primary" onClick={() => setShowForm(true)}>Add Your First Company</button>
        </div>
      ) : (
        <div className="companies-list">
          {companies.map(c => (
            <div key={c.id} className="company-detail-card">
              <div className="company-detail-header">
                <div>
                  <h3>{c.name}</h3>
                  <div className="company-address">
                    {c.address_line1 && <p>📍 {c.address_line1}</p>}
                    {c.address_line2 && <p>&nbsp;&nbsp;&nbsp;&nbsp;{c.address_line2}</p>}
                    {!c.address_line1 && !c.address_line2 && <p className="muted">No address added</p>}
                  </div>
                </div>
                <div className="company-actions">
                  <button className="btn-sm" onClick={() => handleEdit(c)}>✏️ Edit</button>
                  <button className="btn-sm btn-danger" onClick={() => handleDelete(c.id)}>🗑️ Delete</button>
                </div>
              </div>
              <div className="company-meta">
                <span>Added: {new Date(c.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Companies;
