import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import LocationPicker from '../components/LocationPicker';

const TIMEZONES = [
  'Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Asia/Tokyo',
  'Europe/London', 'Europe/Paris', 'America/New_York', 'America/Los_Angeles',
  'Australia/Sydney', 'UTC'
];

const EMPTY_FORM = {
  name: '', description: '', company_id: '',
  start_datetime: '', end_datetime: '', timezone: 'Asia/Kolkata',
  location_lat: '', location_lng: '', location_radius_meters: '200',
  min_hours: '5', salary_per_min_hours: '500'
};

const getCampaignStatus = (c) => {
  const now = new Date();
  if (!c.start_datetime && !c.end_datetime) return { label: 'Active', cls: 'status-active' };
  if (c.start_datetime && new Date(c.start_datetime) > now) return { label: 'Upcoming', cls: 'status-upcoming' };
  if (c.end_datetime && new Date(c.end_datetime) < now) return { label: 'Ended', cls: 'status-ended' };
  return { label: 'Live', cls: 'status-live' };
};

const formatDT = (iso, tz) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', { timeZone: tz || 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });
};

// Convert local datetime-local input value to ISO with timezone offset
const toISO = (localDT) => localDT ? new Date(localDT).toISOString() : null;
// Convert ISO to datetime-local input format
const toLocalDT = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const LiveDot = ({ active }) => (
  <span className={`live-dot ${active ? 'live-dot-on' : 'live-dot-off'}`} title={active ? 'Punched In' : 'Not Punched In'} />
);

const PunchTimer = ({ punchInTime }) => {
  const [elapsed, setElapsed] = useState('');
  useEffect(() => {
    const calc = () => {
      const ms = Date.now() - new Date(punchInTime).getTime();
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setElapsed(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [punchInTime]);
  return <span className="punch-timer">{elapsed}</span>;
};

const Campaigns = () => {
  const [campaigns, setCampaigns]     = useState([]);
  const [employees, setEmployees]     = useState([]);
  const [companies, setCompanies]     = useState([]);
  const [showForm, setShowForm]       = useState(false);
  const [editingId, setEditingId]     = useState(null);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [error, setError]             = useState('');
  const [assignModal, setAssignModal] = useState(null);
  const [selectedUser, setSelectedUser] = useState('');
  const [expandedId, setExpandedId]   = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      const [c, u, co] = await Promise.all([
        api.get('/campaigns'), api.get('/users'), api.get('/companies')
      ]);
      setCampaigns(c.data);
      setEmployees(u.data);
      setCompanies(co.data);
    } catch (err) { setError(err.message || 'Failed to load data'); }
  }, []);

  useEffect(() => {
    fetchAll();
    // Auto-refresh every 30s for live punch status
    const t = setInterval(fetchAll, 30000);
    return () => clearInterval(t);
  }, [fetchAll]);

  const resetForm = () => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(false); setError(''); };

  const handleEdit = (c) => {
    setForm({
      name: c.name || '', description: c.description || '',
      company_id: c.company_id || '',
      start_datetime: toLocalDT(c.start_datetime),
      end_datetime: toLocalDT(c.end_datetime),
      timezone: c.timezone || 'Asia/Kolkata',
      location_lat: c.location_lat || '', location_lng: c.location_lng || '',
      location_radius_meters: c.location_radius_meters || '200',
      min_hours: c.min_hours || '5', salary_per_min_hours: c.salary_per_min_hours || '500',
    });
    setEditingId(c.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (form.start_datetime && form.end_datetime && new Date(form.end_datetime) <= new Date(form.start_datetime)) {
      setError('End date/time must be after start date/time');
      return;
    }
    const payload = {
      ...form,
      company_id: form.company_id || null,
      start_datetime: toISO(form.start_datetime),
      end_datetime: toISO(form.end_datetime),
      location_lat: form.location_lat ? parseFloat(form.location_lat) : null,
      location_lng: form.location_lng ? parseFloat(form.location_lng) : null,
      location_radius_meters: parseInt(form.location_radius_meters),
      min_hours: parseFloat(form.min_hours),
      salary_per_min_hours: parseFloat(form.salary_per_min_hours),
    };
    try {
      if (editingId) await api.put(`/campaigns/${editingId}`, payload);
      else await api.post('/campaigns', payload);
      resetForm(); fetchAll();
    } catch (err) { setError(err.message || 'Failed to save campaign'); }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this campaign?')) return;
    await api.delete(`/campaigns/${id}`); fetchAll();
  };

  const handleAssign = async () => {
    if (!selectedUser) return;
    await api.post(`/campaigns/${assignModal}/assign`, { userId: selectedUser });
    setAssignModal(null); setSelectedUser(''); fetchAll();
  };

  const handleRemoveEmployee = async (cId, uId) => {
    await api.delete(`/campaigns/${cId}/assign/${uId}`); fetchAll();
  };

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const assignableEmployees = (campaignId) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    const all = employees.filter(e => e.role === 'employee');
    if (!campaign?.company_id) return all;
    return all.filter(e => e.company_id === campaign.company_id);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>📋 Campaigns</h1>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className="field-hint">🔄 Live status refreshes every 30s</span>
          <button className="btn-secondary" onClick={fetchAll}>↻ Refresh</button>
          <button className="btn-primary" onClick={() => { resetForm(); setShowForm(!showForm); }}>
            {showForm ? 'Cancel' : '+ New Campaign'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="form-card form-card-wide">
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
              <div className="form-group">
                <label>Company</label>
                <select value={form.company_id} onChange={f('company_id')}>
                  <option value="">— No Company —</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {form.company_id && <span className="field-hint">✅ Only this company's employees can be assigned</span>}
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea placeholder="What is this campaign about?" value={form.description} onChange={f('description')} />
            </div>

            {/* Schedule */}
            <div className="form-section-title">🗓️ Campaign Schedule</div>
            <div className="form-group" style={{ maxWidth: '240px' }}>
              <label>Timezone</label>
              <select value={form.timezone} onChange={f('timezone')}>
                {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Start Date & Time</label>
                <input type="datetime-local" value={form.start_datetime} onChange={f('start_datetime')} />
                <span className="field-hint">Campaign opens for punch-in from this time</span>
              </div>
              <div className="form-group">
                <label>End Date & Time</label>
                <input type="datetime-local" value={form.end_datetime} onChange={f('end_datetime')}
                  min={form.start_datetime || ''} />
                <span className="field-hint">Campaign closes — no punch-in allowed after this</span>
              </div>
            </div>
            {form.start_datetime && form.end_datetime && (
              <div className="schedule-preview">
                📅 <strong>{new Date(form.start_datetime).toLocaleString()}</strong>
                <span> → </span>
                <strong>{new Date(form.end_datetime).toLocaleString()}</strong>
                <span className="muted"> ({form.timezone})</span>
              </div>
            )}

            {/* Location */}
            <div className="form-section-title">📍 Campaign Location</div>
            <LocationPicker
              lat={form.location_lat} lng={form.location_lng} radius={form.location_radius_meters}
              onChange={({ lat, lng }) => setForm(p => ({ ...p, location_lat: lat, location_lng: lng }))}
            />
            <div className="form-row" style={{ marginTop: '12px' }}>
              <div className="form-group">
                <label>Allowed Radius (meters)</label>
                <input type="number" min="50" placeholder="200" value={form.location_radius_meters} onChange={f('location_radius_meters')} />
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

            {/* Salary */}
            <div className="form-section-title">💰 Salary Ratio</div>
            <div className="form-row">
              <div className="form-group">
                <label>Minimum Hours *</label>
                <input type="number" step="0.5" min="0.5" placeholder="5" required value={form.min_hours} onChange={f('min_hours')} />
              </div>
              <div className="form-group">
                <label>Pay per Minimum Hours (₹) *</label>
                <input type="number" min="0" placeholder="500" required value={form.salary_per_min_hours} onChange={f('salary_per_min_hours')} />
              </div>
            </div>
            <div className="salary-preview">
              📊 {form.min_hours && form.salary_per_min_hours ? (
                <>
                  <strong>{form.min_hours}h = ₹{form.salary_per_min_hours}</strong>
                  <span> · {parseFloat(form.min_hours)*2}h = ₹{parseFloat(form.salary_per_min_hours)*2}</span>
                  <span> · {parseFloat(form.min_hours)*3}h = ₹{parseFloat(form.salary_per_min_hours)*3}</span>
                </>
              ) : <span className="muted">Fill hours and pay to preview</span>}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button type="submit" className="btn-primary">{editingId ? 'Update' : 'Create Campaign'}</button>
              <button type="button" className="btn-secondary" onClick={resetForm}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {campaigns.length === 0 && !showForm && (
        <div className="empty-card"><p>📋</p><p>No campaigns yet.</p></div>
      )}

      <div className="campaigns-list-full">
        {campaigns.map(c => {
          const status = getCampaignStatus(c);
          const punchedInCount = c.campaign_assignments?.filter(a => a.is_punched_in).length || 0;
          return (
            <div key={c.id} className="campaign-full-card">
              <div className="campaign-full-header">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h3>{c.name}</h3>
                    <span className={`campaign-status ${status.cls}`}>{status.label}</span>
                    {punchedInCount > 0 && (
                      <span className="live-count">🟢 {punchedInCount} live</span>
                    )}
                  </div>
                  {c.description && <p className="campaign-desc">{c.description}</p>}
                </div>
                <div className="campaign-full-actions">
                  <button className="btn-sm" onClick={() => { setAssignModal(c.id); setSelectedUser(''); }}>+ Assign</button>
                  <button className="btn-sm" onClick={() => handleEdit(c)}>✏️ Edit</button>
                  <button className="btn-sm btn-danger" onClick={() => handleDelete(c.id)}>🗑️</button>
                </div>
              </div>

              <div className="campaign-pills">
                {c.companies?.name && <span className="pill pill-orange">🏢 {c.companies.name}</span>}
                <span className="pill pill-blue">💰 ₹{c.salary_per_min_hours} per {c.min_hours}h</span>
                {c.start_datetime && <span className="pill pill-gray">▶ {formatDT(c.start_datetime, c.timezone)}</span>}
                {c.end_datetime && <span className="pill pill-gray">⏹ {formatDT(c.end_datetime, c.timezone)}</span>}
                {c.location_lat && c.location_lng
                  ? <span className="pill pill-green">📍 {parseFloat(c.location_lat).toFixed(4)}, {parseFloat(c.location_lng).toFixed(4)} · {c.location_radius_meters}m</span>
                  : <span className="pill pill-gray">📍 No location</span>}
                <span className="pill pill-purple">👥 {c.campaign_assignments?.length || 0} assigned</span>
              </div>

              <div className="campaign-employees-toggle" onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}>
                {expandedId === c.id ? '▲' : '▼'} Employees ({c.campaign_assignments?.length || 0})
                {punchedInCount > 0 && <span style={{ marginLeft: '8px', color: '#16a34a' }}>· {punchedInCount} punched in</span>}
              </div>

              {expandedId === c.id && (
                <div className="assigned-employees">
                  {!c.campaign_assignments?.length && <p className="muted" style={{ padding: '8px 0' }}>No employees assigned.</p>}
                  {c.campaign_assignments?.map(a => (
                    <div key={a.user_id} className="assigned-employee-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <LiveDot active={a.is_punched_in} />
                        <div>
                          <span>👤 {a.users?.name}</span>
                          <span className="muted"> ({a.users?.email})</span>
                          {a.is_punched_in && a.punch_in_time && (
                            <div style={{ fontSize: '12px', color: '#16a34a', marginTop: '2px' }}>
                              ✅ Punched in · <PunchTimer punchInTime={a.punch_in_time} />
                            </div>
                          )}
                          {!a.is_punched_in && (
                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>⭕ Not punched in</div>
                          )}
                        </div>
                      </div>
                      <button className="btn-sm btn-danger" onClick={() => handleRemoveEmployee(c.id, a.user_id)}>Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {assignModal && (() => {
        const campaign = campaigns.find(c => c.id === assignModal);
        const filtered = assignableEmployees(assignModal);
        return (
          <div className="modal-overlay" onClick={() => setAssignModal(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>Assign Employee</h3>
              <p className="muted" style={{ marginBottom: '4px' }}>{campaign?.name}</p>
              {campaign?.companies?.name && (
                <p className="field-hint" style={{ marginBottom: '12px' }}>
                  🏢 Showing <strong>{campaign.companies.name}</strong> employees only
                </p>
              )}
              {filtered.length === 0 ? (
                <div className="error-msg">No employees found. Add employees to this company first.</div>
              ) : (
                <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
                  <option value="">Select employee...</option>
                  {filtered.map(e => <option key={e.id} value={e.id}>{e.name} ({e.email})</option>)}
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
