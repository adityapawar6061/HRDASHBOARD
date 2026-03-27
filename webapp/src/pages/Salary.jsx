import { useState, useEffect } from 'react';
import api from '../services/api';

const Salary = () => {
  const [salaries, setSalaries] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({ userId: '', month: '', deductions: '0' });
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);

  const fetchAll = async () => {
    try {
      const [s, u] = await Promise.all([api.get('/salary'), api.get('/users')]);
      setSalaries(s.data);
      setEmployees(u.data);
    } catch (err) {
      setError(err.message || 'Failed to load data');
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleGenerate = async e => {
    e.preventDefault();
    setError('');
    setGenerating(true);
    try {
      const result = await api.post('/salary/generate', {
        userId: form.userId,
        month: form.month,
        deductions: parseFloat(form.deductions) || 0,
      });
      setShowForm(false);
      setExpandedId(result.data.id);
      fetchAll();
    } catch (err) {
      setError(err.message || 'Failed to generate payslip');
    } finally { setGenerating(false); }
  };

  // Get campaigns for selected employee (for info display)
  const selectedEmpName = employees.find(e => e.id === form.userId)?.name || '';

  return (
    <div className="page">
      <div className="page-header">
        <h1>💰 Salary & Payslips</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Generate Payslip'}
        </button>
      </div>

      {showForm && (
        <div className="form-card">
          <h3>Generate Payslip</h3>
          <p className="field-hint" style={{ marginBottom: '16px' }}>
            Salary is auto-calculated from each campaign's attendance logs and salary ratio for the selected month.
          </p>
          {error && <div className="error-msg">{error}</div>}
          <form onSubmit={handleGenerate}>
            <div className="form-group">
              <label>Employee *</label>
              <select required value={form.userId} onChange={e => setForm({ ...form, userId: e.target.value })}>
                <option value="">Select Employee</option>
                {employees.filter(e => e.role === 'employee').map(e => (
                  <option key={e.id} value={e.id}>{e.name} ({e.email})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Month *</label>
              <input type="month" required value={form.month} onChange={e => setForm({ ...form, month: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Deductions (₹)</label>
              <input type="number" min="0" placeholder="0" value={form.deductions} onChange={e => setForm({ ...form, deductions: e.target.value })} />
              <span className="field-hint">Any deductions to subtract from total earned salary</span>
            </div>
            {form.userId && (
              <div className="info-box">
                💡 Payslip for <strong>{selectedEmpName}</strong> will be calculated from all their campaign attendance logs in <strong>{form.month || 'selected month'}</strong>. Each campaign uses its own salary ratio (min hours × pay rate).
              </div>
            )}
            <button type="submit" className="btn-primary" disabled={generating}>
              {generating ? '⏳ Calculating...' : '📄 Generate Payslip'}
            </button>
          </form>
        </div>
      )}

      {/* Payslips List */}
      {salaries.length === 0 ? (
        <div className="empty-card">
          <p>💰</p>
          <p>No payslips generated yet.</p>
        </div>
      ) : (
        <div className="payslips-list">
          {salaries.map(s => (
            <div key={s.id} className="payslip-card">
              {/* Payslip Header */}
              <div className="payslip-header">
                <div className="payslip-employee">
                  <h3>👤 {s.users?.name}</h3>
                  <span className="muted">{s.users?.email}</span>
                </div>
                <div className="payslip-month-badge">{s.month}</div>
              </div>

              {/* Summary Row */}
              <div className="payslip-summary">
                <div className="payslip-stat">
                  <span>Total Days</span>
                  <strong>{s.total_days}</strong>
                </div>
                <div className="payslip-stat">
                  <span>Total Hours</span>
                  <strong>{parseFloat(s.total_hours || 0).toFixed(1)}h</strong>
                </div>
                <div className="payslip-stat">
                  <span>Deductions</span>
                  <strong className="text-danger">- ₹{s.deductions}</strong>
                </div>
                <div className="payslip-stat payslip-total">
                  <span>Net Salary</span>
                  <strong>₹{parseFloat(s.total_salary).toLocaleString('en-IN')}</strong>
                </div>
              </div>

              {/* Campaign Breakdown Toggle */}
              {s.salary_campaign_breakdowns?.length > 0 && (
                <>
                  <button
                    className="breakdown-toggle"
                    onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                  >
                    {expandedId === s.id ? '▲ Hide' : '▼ Show'} Campaign Breakdown ({s.salary_campaign_breakdowns.length} campaigns)
                  </button>

                  {expandedId === s.id && (
                    <div className="breakdown-table">
                      <table>
                        <thead>
                          <tr>
                            <th>Campaign</th>
                            <th>Days</th>
                            <th>Hours Worked</th>
                            <th>Salary Earned</th>
                          </tr>
                        </thead>
                        <tbody>
                          {s.salary_campaign_breakdowns.map((b, i) => (
                            <tr key={i}>
                              <td>
                                <span className={b.campaign_id ? 'pill pill-blue' : 'pill pill-gray'}>
                                  {b.campaign_name}
                                </span>
                              </td>
                              <td>{b.total_days}</td>
                              <td>{parseFloat(b.total_hours).toFixed(1)}h</td>
                              <td>
                                <strong className={b.salary_earned > 0 ? 'text-success' : 'muted'}>
                                  ₹{b.salary_earned}
                                </strong>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan="2"><strong>Total</strong></td>
                            <td><strong>{parseFloat(s.total_hours || 0).toFixed(1)}h</strong></td>
                            <td>
                              <strong>
                                ₹{s.salary_campaign_breakdowns.reduce((sum, b) => sum + parseFloat(b.salary_earned), 0).toLocaleString('en-IN')}
                              </strong>
                            </td>
                          </tr>
                          {parseFloat(s.deductions) > 0 && (
                            <tr>
                              <td colSpan="3" style={{ textAlign: 'right' }}>Deductions</td>
                              <td><strong className="text-danger">- ₹{s.deductions}</strong></td>
                            </tr>
                          )}
                          <tr className="net-row">
                            <td colSpan="3" style={{ textAlign: 'right' }}><strong>Net Salary</strong></td>
                            <td><strong>₹{parseFloat(s.total_salary).toLocaleString('en-IN')}</strong></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Salary;
