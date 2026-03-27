import { useState, useEffect } from 'react';
import api from '../services/api';

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({ name: '', description: '' });
  const [showForm, setShowForm] = useState(false);
  const [assignModal, setAssignModal] = useState(null);
  const [selectedUser, setSelectedUser] = useState('');

  const fetchAll = async () => {
    const [c, u] = await Promise.all([api.get('/campaigns'), api.get('/users')]);
    setCampaigns(c.data);
    setEmployees(u.data);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCreate = async e => {
    e.preventDefault();
    await api.post('/campaigns', form);
    setForm({ name: '', description: '' });
    setShowForm(false);
    fetchAll();
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this campaign?')) return;
    await api.delete(`/campaigns/${id}`);
    fetchAll();
  };

  const handleAssign = async () => {
    if (!selectedUser) return;
    await api.post(`/campaigns/${assignModal}/assign`, { userId: selectedUser });
    setAssignModal(null);
    setSelectedUser('');
    fetchAll();
  };

  const handleRemoveEmployee = async (campaignId, userId) => {
    await api.delete(`/campaigns/${campaignId}/assign/${userId}`);
    fetchAll();
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Campaigns</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Campaign'}
        </button>
      </div>

      {showForm && (
        <div className="form-card">
          <form onSubmit={handleCreate}>
            <input placeholder="Campaign Name" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <button type="submit" className="btn-primary">Create</button>
          </form>
        </div>
      )}

      <div className="campaigns-grid">
        {campaigns.map(c => (
          <div key={c.id} className="campaign-card">
            <div className="campaign-header">
              <h3>{c.name}</h3>
              <div>
                <button className="btn-sm" onClick={() => setAssignModal(c.id)}>+ Assign</button>
                <button className="btn-sm btn-danger" onClick={() => handleDelete(c.id)}>Delete</button>
              </div>
            </div>
            <p>{c.description}</p>
            <div className="assigned-list">
              {c.campaign_assignments?.map(a => (
                <span key={a.user_id} className="tag">
                  {a.users?.name}
                  <button onClick={() => handleRemoveEmployee(c.id, a.user_id)}>×</button>
                </span>
              ))}
              {!c.campaign_assignments?.length && <p className="empty-state">No employees assigned</p>}
            </div>
          </div>
        ))}
      </div>

      {assignModal && (
        <div className="modal-overlay" onClick={() => setAssignModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Assign Employee</h3>
            <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
              <option value="">Select employee...</option>
              {employees.filter(e => e.role === 'employee').map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
            <div className="modal-actions">
              <button className="btn-primary" onClick={handleAssign}>Assign</button>
              <button onClick={() => setAssignModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Campaigns;
