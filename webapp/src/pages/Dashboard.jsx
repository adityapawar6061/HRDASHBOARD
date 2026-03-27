import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';

const StatCard = ({ label, value, icon }) => (
  <div className="stat-card">
    <span className="stat-icon">{icon}</span>
    <div>
      <p className="stat-label">{label}</p>
      <h3 className="stat-value">{value}</h3>
    </div>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState({ employees: 0, todayAttendance: 0, campaigns: 0 });
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [users, attendance, campaigns] = await Promise.all([
          api.get('/users'),
          api.get('/attendance', { params: { date: new Date().toISOString().split('T')[0] } }),
          api.get('/campaigns'),
        ]);
        setStats({
          employees: users.data.length,
          todayAttendance: attendance.data.total,
          campaigns: campaigns.data.length,
        });

        const days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return d.toISOString().split('T')[0];
        });
        const chartResults = await Promise.all(
          days.map(date => api.get('/attendance', { params: { date } }).then(r => ({ date: date.slice(5), count: r.data.total })))
        );
        setChartData(chartResults);
      } catch (err) {
        console.error('Dashboard load error:', err.message);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="page">
      <h1>Dashboard</h1>
      <div className="stats-grid">
        <StatCard label="Total Employees" value={stats.employees} icon="👥" />
        <StatCard label="Today's Attendance" value={stats.todayAttendance} icon="✅" />
        <StatCard label="Active Campaigns" value={stats.campaigns} icon="📋" />
      </div>
      <div className="chart-card">
        <h2>Attendance - Last 7 Days</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Dashboard;
