import { useState, useEffect, useRef } from 'react';
import api from '../services/api';

const Attendance = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ date: '', userId: '' });
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState(null);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  const fetchLogs = async () => {
    const params = { page, limit: 20, ...filters };
    const { data } = await api.get('/attendance', { params });
    setLogs(data.logs);
    setTotal(data.total);
  };

  useEffect(() => { fetchLogs(); }, [page, filters]);

  useEffect(() => {
    if (!mapRef.current || !window.google) return;
    if (!mapInstance.current) {
      mapInstance.current = new window.google.maps.Map(mapRef.current, {
        zoom: 12,
        center: { lat: 20.5937, lng: 78.9629 },
      });
    }
    // Clear old markers by re-creating (simple approach)
    logs.forEach(log => {
      if (log.punch_in_lat && log.punch_in_lng) {
        new window.google.maps.Marker({
          position: { lat: parseFloat(log.punch_in_lat), lng: parseFloat(log.punch_in_lng) },
          map: mapInstance.current,
          title: `${log.users?.name} - Punch In`,
          icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
        });
      }
      if (log.punch_out_lat && log.punch_out_lng) {
        new window.google.maps.Marker({
          position: { lat: parseFloat(log.punch_out_lat), lng: parseFloat(log.punch_out_lng) },
          map: mapInstance.current,
          title: `${log.users?.name} - Punch Out`,
          icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
        });
      }
    });
  }, [logs]);

  const duration = (log) => {
    if (!log.punch_out_time) return 'Active';
    const ms = new Date(log.punch_out_time) - new Date(log.punch_in_time);
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return `${h}h ${m}m`;
  };

  return (
    <div className="page">
      <h1>Attendance Logs</h1>

      <div className="filters">
        <input type="date" value={filters.date} onChange={e => setFilters({ ...filters, date: e.target.value })} />
        <input placeholder="Filter by User ID" value={filters.userId} onChange={e => setFilters({ ...filters, userId: e.target.value })} />
        <button className="btn-secondary" onClick={() => setFilters({ date: '', userId: '' })}>Clear</button>
      </div>

      <div ref={mapRef} className="map-container" />

      <div className="table-card">
        <table>
          <thead>
            <tr><th>Employee</th><th>Punch In</th><th>Punch Out</th><th>Duration</th><th>Device</th></tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id} onClick={() => setSelectedLog(log)} className="clickable">
                <td>{log.users?.name}</td>
                <td>{new Date(log.punch_in_time).toLocaleString()}</td>
                <td>{log.punch_out_time ? new Date(log.punch_out_time).toLocaleString() : <span className="badge badge-active">Active</span>}</td>
                <td>{duration(log)}</td>
                <td>{log.device_info?.deviceName || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && <p className="empty-state">No logs found.</p>}
        <div className="pagination">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span>Page {page} of {Math.ceil(total / 20) || 1}</span>
          <button disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      </div>

      {selectedLog && (
        <div className="modal-overlay" onClick={() => setSelectedLog(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Log Details</h3>
            <p><strong>Employee:</strong> {selectedLog.users?.name}</p>
            <p><strong>Punch In:</strong> {new Date(selectedLog.punch_in_time).toLocaleString()}</p>
            <p><strong>Location:</strong> {selectedLog.punch_in_lat}, {selectedLog.punch_in_lng}</p>
            {selectedLog.punch_out_time && <>
              <p><strong>Punch Out:</strong> {new Date(selectedLog.punch_out_time).toLocaleString()}</p>
              <p><strong>Location:</strong> {selectedLog.punch_out_lat}, {selectedLog.punch_out_lng}</p>
            </>}
            <p><strong>Device:</strong> {JSON.stringify(selectedLog.device_info)}</p>
            <button onClick={() => setSelectedLog(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
