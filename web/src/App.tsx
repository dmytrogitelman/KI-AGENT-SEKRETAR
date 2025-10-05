import React, { useState, useEffect } from 'react';
import './App.css';

interface StatusData {
  status: string;
  timestamp: string;
  uptime: number;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  version: string;
  dependencies: {
    database: string;
    redis: string;
    openai: string;
    twilio: string;
  };
}

function App() {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/health/detailed');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setStatus(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="App">
        <div className="container">
          <div className="loading">
            <div className="spinner"></div>
            <p>Lade Status...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="App">
        <div className="container">
          <div className="error">
            <h2>❌ Fehler</h2>
            <p>Fehler beim Laden des Status: {error}</p>
            <button onClick={fetchStatus} className="retry-btn">
              Erneut versuchen
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <div className="container">
        <header className="header">
          <h1>🤖 WhatsApp AI Secretary</h1>
          <p>Ihr intelligenter Assistent für WhatsApp</p>
        </header>

        <div className="status-grid">
          <div className="status-card">
            <h3>📊 System Status</h3>
            <div className="status-item">
              <span className="label">Status:</span>
              <span className={`value ${status?.status === 'ok' ? 'success' : 'error'}`}>
                {status?.status === 'ok' ? '✅ Online' : '❌ Offline'}
              </span>
            </div>
            <div className="status-item">
              <span className="label">Version:</span>
              <span className="value">{status?.version || 'N/A'}</span>
            </div>
            <div className="status-item">
              <span className="label">Laufzeit:</span>
              <span className="value">{status ? formatUptime(status.uptime) : 'N/A'}</span>
            </div>
            <div className="status-item">
              <span className="label">Letzte Aktualisierung:</span>
              <span className="value">
                {status ? new Date(status.timestamp).toLocaleString('de-DE') : 'N/A'}
              </span>
            </div>
          </div>

          <div className="status-card">
            <h3>💾 Speicher</h3>
            <div className="status-item">
              <span className="label">RSS:</span>
              <span className="value">{status ? formatBytes(status.memory.rss) : 'N/A'}</span>
            </div>
            <div className="status-item">
              <span className="label">Heap Total:</span>
              <span className="value">{status ? formatBytes(status.memory.heapTotal) : 'N/A'}</span>
            </div>
            <div className="status-item">
              <span className="label">Heap Used:</span>
              <span className="value">{status ? formatBytes(status.memory.heapUsed) : 'N/A'}</span>
            </div>
            <div className="status-item">
              <span className="label">External:</span>
              <span className="value">{status ? formatBytes(status.memory.external) : 'N/A'}</span>
            </div>
          </div>

          <div className="status-card">
            <h3>🔗 Services</h3>
            <div className="status-item">
              <span className="label">Datenbank:</span>
              <span className={`value ${status?.dependencies.database === 'healthy' ? 'success' : 'error'}`}>
                {status?.dependencies.database === 'healthy' ? '✅ Online' : '❌ Offline'}
              </span>
            </div>
            <div className="status-item">
              <span className="label">Redis:</span>
              <span className={`value ${status?.dependencies.redis === 'healthy' ? 'success' : 'error'}`}>
                {status?.dependencies.redis === 'healthy' ? '✅ Online' : '❌ Offline'}
              </span>
            </div>
            <div className="status-item">
              <span className="label">OpenAI:</span>
              <span className={`value ${status?.dependencies.openai === 'healthy' ? 'success' : 'error'}`}>
                {status?.dependencies.openai === 'healthy' ? '✅ Online' : '❌ Offline'}
              </span>
            </div>
            <div className="status-item">
              <span className="label">Twilio:</span>
              <span className={`value ${status?.dependencies.twilio === 'healthy' ? 'success' : 'error'}`}>
                {status?.dependencies.twilio === 'healthy' ? '✅ Online' : '❌ Offline'}
              </span>
            </div>
          </div>
        </div>

        <div className="info-section">
          <h3>📱 Funktionen</h3>
          <div className="features">
            <div className="feature">
              <span className="icon">📅</span>
              <div>
                <h4>Kalender</h4>
                <p>Termine planen, überprüfen und verwalten</p>
              </div>
            </div>
            <div className="feature">
              <span className="icon">📧</span>
              <div>
                <h4>E-Mail</h4>
                <p>E-Mails lesen, zusammenfassen und verfassen</p>
              </div>
            </div>
            <div className="feature">
              <span className="icon">✅</span>
              <div>
                <h4>Aufgaben</h4>
                <p>Aufgaben erstellen, aktualisieren und verfolgen</p>
              </div>
            </div>
            <div className="feature">
              <span className="icon">📝</span>
              <div>
                <h4>Notizen</h4>
                <p>Notizen erstellen, organisieren und suchen</p>
              </div>
            </div>
            <div className="feature">
              <span className="icon">👥</span>
              <div>
                <h4>Kontakte</h4>
                <p>Kontakte suchen, speichern und verwalten</p>
              </div>
            </div>
            <div className="feature">
              <span className="icon">🔔</span>
              <div>
                <h4>Erinnerungen</h4>
                <p>Benachrichtigungen für wichtige Termine</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;





