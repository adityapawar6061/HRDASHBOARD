import { useState, useEffect } from 'react';
import api from '../services/api';

const Salary = () => {
  const [salaries, setSalaries] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({ userId: '', month: '', per_day_pay: '', deductions: '0' });
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  const fetchAll = async () => {
    const [s, u] = await Promise.all([api.get('/salary'), api.get('/users')]);
    setSalaries(s.data);
    setEmployees(u.data);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleGenerate = async e => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/salary/generate', {
        ...form,
        per_day_pay: parseFloat(form.per_day_pay),
        deductions: parseFloat(form.deductions),
      });
      setShowForm(false);
      fetchAll();
    } catch (err) {
      setError(err.error || 'Failed to generate payslip');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Salary & Payslips</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Generate Payslip'}
        </button>
      </div>

      {showForm && (
        <div className="form-card">
          <h3>Generate Payslip</h3>
          {error && <div className="error-msg">{error}</div>}
          <form onSubmit={handleGenerate}>
            <select required value={form.userId} onChange={e => setForm({ ...form, userId: e.target.value })}>
              <option value="">Select Employee</option>
              {employees.filter(e => e.role === 'employee').map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
            <input type="month" required value={form.month} onChange={e => setForm({ ...form, month: e.target.value })} />
            <input type="number" placeholder="Per Day Pay (₹)" required min="0" value={form.per_day_pay} onChange={e => setForm({ ...form, per_day_pay: e.target.value })} />
            <input type="number" placeholder="Deductions (₹)" min="0" value={form.deductions} onChange={e => setForm({ ...form, deductions: e.target.value })} />
            <button type="submit" className="btn-primary">Generate</button>
          </form>
        </div>
      )}

      <div className="table-card">
        <table>
          <thead>
            <tr><th>Employee</th><th>Month</th><th>Days Worked</th><th>Per Day</th><th>Deductions</th><th>Total Salary</th></tr>
          </thead>
          <tbody>
            {salaries.map(s => (
              <tr key={s.id}>
                <td>{s.users?.name}</td>
                <td>{s.month}</td>
                <td>{s.total_days}</td>
                <td>₹{s.per_day_pay}</td>
                <td>₹{s.deductions}</td>
                <td><strong>₹{s.total_salary}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
        {salaries.length === 0 && <p className="empty-state">No payslips generated yet.</p>}
      </div>
    </div>
  );
};

export default Salary;
