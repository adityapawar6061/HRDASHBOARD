import { useState, useEffect } from 'react';
import api from '../services/api';

const EMPTY_FORM = {
  name: '', description: '',
  location_lat: '', location_lng: '', location_radius_meters: '200',
  min_hours: '5', salary_per_min_hours: '500'
};

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [assignModal, setAssignModal] = useState(null);
  const [selectedUser, setSelectedUser] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const fetchAll = async () => {
    const [c, u] = await Promise.all([api.get('/campaigns'), api.get('/users')]);
    setCampaigns(c.data);
    setEmployees(u.data);
  };

  useEffect(() => { fetchAll(); }, []);

  const resetForm = () => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(false); setError(''); };

  const handleEdit = (c) => {
    setForm({
      name: c.name || '', description: c.description || '',
      location_lat: c.location_lat || '', location_lng: c.location_lng || '',
      location_radius_meters: c.location_radius_meters || '200',
      min_hours: c.min_hours || '5', salary_per_min_hours: c.salary_per_min_hours || '500'
    });
    setEditingId(c.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    const payload = {
      ...form,
      location_lat: form.location_lat ? parseFloat(form.location_lat) : null,
      location_lng: form.location_lng ? parseFloat(form.location_lng) : null,
      location_radius_meters: parseInt(form.location_radius_meters),
      min_hours: parseFloat(form.min_hours),
      salary_per_min_hours: parseFloat(form.salary_per_min_hours),
    };
    try {
      if (editingId) await api.put(`/campaigns/${editingId}`, payload);
      else await api.post('/campaigns', payload);
      resetForm();
      fetchAll();
    } catch (err) { setError(err.error || 'Failed to save campaign'); }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this campaign?')) return;
    await api.delete(`/campaigns/${id}`);
    fetchAll();
  };

  const handleAssign = async () => {
    if (!selectedUser) return;
    await api.post(`/campaigns/${assignModal}/assign`, { userId: selectedUser });
    setAssignModal(null); setSelectedUser(''); fetchAll();
  };

  const handleRemoveEmployee = async (campaignId, userId) => {
    await api.delete(`/campaigns/${campaignId}/assign/${userId}`);
    fetchAll();
  };

  const f = (k) => e => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="page">
      <div className="page-header">
        <h1>📋 Campaigns</h1>
        <button className="btn-primary" onClick={() => { resetForm(); setShowForm(!showForm); }}>
          {showForm ? 'Cancel' : '+ New Campaign'}
        </button>
      </div>

      {showForm && (
        <div className="form-card">
          <h3>{editingId ? '✏️ Edit Campaign' : '➕ New Campaign'}</h3>
          {error && <div className="error-msg">{error}</div>}
          <form onSubmit={handleSubmit}>

            {/* Basic Info */}
            <div className="form-section-title">Basic Info</div>
            <div className="form-row">
              <div className="form-group">
                <label>Campaign Name *</label>
                <input placeholder="e.g. Summer Drive 2024" required value={form.name} onChange={f('name')} />
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea placeholder="What is this campaign about?" value={form.description} onChange={f('description')} />
            </div>

            {/* Location */}
            <div className="form-section-title">📍 Campaign Location</div>
            <div className="form-row-3">
              <div className="form-group">
                <label>Latitude</label>
                <input type="number" step="any" placeholder="e.g. 28.6139" value={form.location_lat} onChange={f('location_lat')} />
              </div>
              <div className="form-group">
                <label>Longitude</label>
                <input type="number" step="any" placeholder="e.g. 77.2090" value={form.location_lng} onChange={f('location_lng')} />
              </div>
              <div className="form-group">
                <label>Allowed Radius (meters)</label>
                <input type="number" min="50" placeholder="200" value={form.location_radius_meters} onChange={f('location_radius_meters')} />
              </div>
            </div>
            <p className="field-hint">💡 Employees must be within this radius to punch in/out for this campaign. Leave lat/lng empty to skip location check.</p>

            {/* Salary Ratio */}
            <div className="form-section-title">💰 Salary Ratio</div>
            <div className="form-row">
              <div className="form-group">
                <label>Minimum Hours *</label>
                <input type="number" step="0.5" min="0.5" placeholder="5" required value={form.min_hours} onChange={f('min_hours')} />
                <span className="field-hint">Minimum hours to qualify for payment</span>
              </div>
              <div className="form-group">
                <label>Pay per Minimum Hours (₹) *</label>
                <input type="number" min="0" placeholder="500" required value={form.salary_per_min_hours} onChange={f('salary_per_min_hours')} />
                <span className="field-hint">Amount paid per {form.min_hours || 'X'} hours worked</span>
              </div>
            </div>
            <div className="salary-preview">
              <span>📊 Preview: </span>
              {form.min_hours && form.salary_per_min_hours ? (
                <>
                  <strong>{form.min_hours}h = ₹{form.salary_per_min_hours}</strong>
                  <span> · {parseFloat(form.min_hours) * 2}h = ₹{parseFloat(form.salary_per_min_hours) * 2}</span>
                  <span> · {parseFloat(form.min_hours) * 3}h = ₹{parseFloat(form.salary_per_min_hours) * 3}</span>
                </>
              ) : <span className="muted">Fill hours and pay to see preview</span>}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button type="submit" className="btn-primary">{editingId ? 'Update Campaign' : 'Create Campaign'}</button>
              <button type="button" className="btn-secondary" onClick={resetForm}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {campaigns.length === 0 && !showForm && (
        <div className="empty-card">
          <p>📋</p>
          <p>No campaigns yet. Create your first one!</p>
        </div>
      )}

      <div className="campaigns-list-full">
        {campaigns.map(c => (
          <div key={c.id} className="campaign-full-card">
            {/* Header */}
            <div className="campaign-full-header">
              <div>
                <h3>{c.name}</h3>
                {c.description && <p className="campaign-desc">{c.description}</p>}
              </div>
              <div className="campaign-full-actions">
                <button className="btn-sm" onClick={() => setAssignModal(c.id)}>+ Assign</button>
                <button className="btn-sm" onClick={() => handleEdit(c)}>✏️ Edit</button>
                <button className="btn-sm btn-danger" onClick={() => handleDelete(c.id)}>🗑️</button>
              </div>
            </div>

            {/* Info Pills */}
            <div className="campaign-pills">
              <span className="pill pill-blue">
                💰 ₹{c.salary_per_min_hours} per {c.min_hours}h
              </span>
              {c.location_lat && c.location_lng ? (
                <span className="pill pill-green">
                  📍 {parseFloat(c.location_lat).toFixed(4)}, {parseFloat(c.location_lng).toFixed(4)} · {c.location_radius_meters}m radius
                </span>
              ) : (
                <span className="pill pill-gray">📍 No location set</span>
              )}
              <span className="pill pill-purple">
                👥 {c.campaign_assignments?.length || 0} employees
              </span>
            </div>

            {/* Assigned Employees */}
            <div
              className="campaign-employees-toggle"
              onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
            >
              {expandedId === c.id ? '▲' : '▼'} Assigned Employees ({c.campaign_assignments?.length || 0})
            </div>

            {expandedId === c.id && (
              <div className="assigned-employees">
                {c.campaign_assignments?.length === 0 && (
                  <p className="muted" style={{ padding: '8px 0' }}>No employees assigned yet.</p>
                )}
                {c.campaign_assignments?.map(a => (
                  <div key={a.user_id} className="assigned-employee-row">
                    <span>👤 {a.users?.name} <span className="muted">({a.users?.email})</span></span>
                    <button className="btn-sm btn-danger" onClick={() => handleRemoveEmployee(c.id, a.user_id)}>Remove</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Assign Modal */}
      {assignModal && (
        <div className="modal-overlay" onClick={() => setAssignModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Assign Employee to Campaign</h3>
            <p className="muted" style={{ marginBottom: '12px' }}>
              {campaigns.find(c => c.id === assignModal)?.name}
            </p>
            <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
              <option value="">Select employee...</option>
              {employees.filter(e => e.role === 'employee').map(e => (
                <option key={e.id} value={e.id}>{e.name} ({e.email})</option>
              ))}
            </select>
            <div className="modal-actions">
              <button className="btn-primary" onClick={handleAssign}>Assign</button>
              <button className="btn-secondary" onClick={() => setAssignModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Campaigns;
