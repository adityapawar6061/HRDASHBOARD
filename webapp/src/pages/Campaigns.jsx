import { useState, useEffect } from 'react';
import api from '../services/api';
import LocationPicker from '../components/LocationPicker';

const EMPTY_FORM = {
  name: '', description: '', company_id: '',
  location_lat: '', location_lng: '', location_radius_meters: '200',
  min_hours: '5', salary_per_min_hours: '500'
};

const Campaigns = () => {
  const [campaigns, setCampaigns]   = useState([]);
  const [employees, setEmployees]   = useState([]);
  const [companies, setCompanies]   = useState([]);
  const [showForm, setShowForm]     = useState(false);
  const [editingId, setEditingId]   = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [error, setError]           = useState('');
  const [assignModal, setAssignModal] = useState(null); // campaign id
  const [selectedUser, setSelectedUser] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const fetchAll = async () => {
    try {
      const [c, u, co] = await Promise.all([
        api.get('/campaigns'),
        api.get('/users'),
        api.get('/companies'),
      ]);
      setCampaigns(c.data);
      setEmployees(u.data);
      setCompanies(co.data);
    } catch (err) {
      setError(err.message || 'Failed to load data');
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const resetForm = () => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(false); setError(''); };

  const handleEdit = (c) => {
    setForm({
      name: c.name || '',
      description: c.description || '',
      company_id: c.company_id || '',
      location_lat: c.location_lat || '',
      location_lng: c.location_lng || '',
      location_radius_meters: c.location_radius_meters || '200',
      min_hours: c.min_hours || '5',
      salary_per_min_hours: c.salary_per_min_hours || '500',
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
      company_id: form.company_id || null,
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
    } catch (err) { setError(err.message || 'Failed to save campaign'); }
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

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  // Employees filtered by the campaign's company
  const assignablEmployees = (campaignId) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    const companyId = campaign?.company_id;
    const allEmp = employees.filter(e => e.role === 'employee');
    if (!companyId) return allEmp; // no company set → show all
    return allEmp.filter(e => e.company_id === companyId);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>📋 Campaigns</h1>
        <button className="btn-primary" onClick={() => { resetForm(); setShowForm(!showForm); }}>
          {showForm ? 'Cancel' : '+ New Campaign'}
        </button>
      </div>

      {showForm && (
        <div className="form-card form-card-wide">
          <h3>{editingId ? '✏️ Edit Campaign' : '➕ New Campaign'}</h3>
          {error && <div className="error-msg">{error}</div>}
          <form onSubmit={handleSubmit}>

            {/* ── Basic Info ── */}
            <div className="form-section-title">Basic Info</div>
            <div className="form-row">
              <div className="form-group">
                <label>Campaign Name *</label>
                <input placeholder="e.g. Summer Drive 2024" required value={form.name} onChange={f('name')} />
              </div>
              <div className="form-group">
                <label>Company</label>
                <select value={form.company_id} onChange={f('company_id')}>
                  <option value="">— No Company —</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {companies.length === 0 && (
                  <span className="field-hint">No companies yet. <a href="/companies">Add one first →</a></span>
                )}
                {form.company_id && (
                  <span className="field-hint">✅ Only employees from this company can be assigned</span>
                )}
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea placeholder="What is this campaign about?" value={form.description} onChange={f('description')} />
            </div>

            {/* ── Location ── */}
            <div className="form-section-title">📍 Campaign Location</div>
            <LocationPicker
              lat={form.location_lat}
              lng={form.location_lng}
              radius={form.location_radius_meters}
              onChange={({ lat, lng }) => setForm(p => ({ ...p, location_lat: lat, location_lng: lng }))}
            />
            <div className="form-row" style={{ marginTop: '12px' }}>
              <div className="form-group">
                <label>Allowed Radius (meters)</label>
                <input type="number" min="50" placeholder="200" value={form.location_radius_meters} onChange={f('location_radius_meters')} />
                <span className="field-hint">Purple circle on map shows this radius</span>
              </div>
              <div className="form-group">
                <label>Latitude</label>
                <input type="number" step="any" placeholder="Auto-filled from map" value={form.location_lat}
                  onChange={e => setForm(p => ({ ...p, location_lat: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Longitude</label>
                <input type="number" step="any" placeholder="Auto-filled from map" value={form.location_lng}
                  onChange={e => setForm(p => ({ ...p, location_lng: e.target.value }))} />
              </div>
            </div>

            {/* ── Salary Ratio ── */}
            <div className="form-section-title">💰 Salary Ratio</div>
            <div className="form-row">
              <div className="form-group">
                <label>Minimum Hours *</label>
                <input type="number" step="0.5" min="0.5" placeholder="5" required value={form.min_hours} onChange={f('min_hours')} />
                <span className="field-hint">Min hours to qualify for payment</span>
              </div>
              <div className="form-group">
                <label>Pay per Minimum Hours (₹) *</label>
                <input type="number" min="0" placeholder="500" required value={form.salary_per_min_hours} onChange={f('salary_per_min_hours')} />
                <span className="field-hint">Amount paid per {form.min_hours || 'X'} hours</span>
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

            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button type="submit" className="btn-primary">{editingId ? 'Update Campaign' : 'Create Campaign'}</button>
              <button type="button" className="btn-secondary" onClick={resetForm}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {campaigns.length === 0 && !showForm && (
        <div className="empty-card"><p>📋</p><p>No campaigns yet.</p></div>
      )}

      <div className="campaigns-list-full">
        {campaigns.map(c => (
          <div key={c.id} className="campaign-full-card">
            <div className="campaign-full-header">
              <div>
                <h3>{c.name}</h3>
                {c.description && <p className="campaign-desc">{c.description}</p>}
              </div>
              <div className="campaign-full-actions">
                <button className="btn-sm" onClick={() => { setAssignModal(c.id); setSelectedUser(''); }}>+ Assign</button>
                <button className="btn-sm" onClick={() => handleEdit(c)}>✏️ Edit</button>
                <button className="btn-sm btn-danger" onClick={() => handleDelete(c.id)}>🗑️</button>
              </div>
            </div>

            <div className="campaign-pills">
              {c.companies?.name && (
                <span className="pill pill-orange">🏢 {c.companies.name}</span>
              )}
              <span className="pill pill-blue">💰 ₹{c.salary_per_min_hours} per {c.min_hours}h</span>
              {c.location_lat && c.location_lng ? (
                <span className="pill pill-green">
                  📍 {parseFloat(c.location_lat).toFixed(4)}, {parseFloat(c.location_lng).toFixed(4)} · {c.location_radius_meters}m
                </span>
              ) : (
                <span className="pill pill-gray">📍 No location</span>
              )}
              <span className="pill pill-purple">👥 {c.campaign_assignments?.length || 0} employees</span>
            </div>

            <div className="campaign-employees-toggle" onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}>
              {expandedId === c.id ? '▲' : '▼'} Assigned Employees ({c.campaign_assignments?.length || 0})
            </div>

            {expandedId === c.id && (
              <div className="assigned-employees">
                {!c.campaign_assignments?.length && <p className="muted" style={{ padding: '8px 0' }}>No employees assigned yet.</p>}
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
      {assignModal && (() => {
        const campaign = campaigns.find(c => c.id === assignModal);
        const filtered = assignablEmployees(assignModal);
        return (
          <div className="modal-overlay" onClick={() => setAssignModal(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>Assign Employee</h3>
              <p className="muted" style={{ marginBottom: '4px' }}>{campaign?.name}</p>
              {campaign?.companies?.name && (
                <p className="field-hint" style={{ marginBottom: '12px' }}>
                  🏢 Showing employees from <strong>{campaign.companies.name}</strong> only
                </p>
              )}
              {filtered.length === 0 ? (
                <div className="error-msg">
                  No employees found{campaign?.company_id ? ` for company "${campaign?.companies?.name}"` : ''}. 
                  {campaign?.company_id ? ' Add employees to this company first.' : ''}
                </div>
              ) : (
                <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
                  <option value="">Select employee...</option>
                  {filtered.map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.email})</option>
                  ))}
                </select>
              )}
              <div className="modal-actions">
                <button className="btn-primary" onClick={handleAssign} disabled={!selectedUser}>Assign</button>
                <button className="btn-secondary" onClick={() => setAssignModal(null)}>Cancel</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Campaigns;
