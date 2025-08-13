#!/usr/bin/env node

/**
 * 监控仪表板脚本
 * 用于启动本地监控仪表板和收集性能指标
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const DASHBOARD_PORT = 3001;
const METRICS_FILE = path.join(__dirname, '../.monitoring/metrics.json');

// 确保监控目录存在
const monitoringDir = path.dirname(METRICS_FILE);
if (!fs.existsSync(monitoringDir)) {
  fs.mkdirSync(monitoringDir, { recursive: true });
}

// 初始化指标文件
if (!fs.existsSync(METRICS_FILE)) {
  const initialMetrics = {
    webVitals: {},
    i18n: {
      localeUsage: { en: 0, zh: 0 },
      translationErrors: 0,
      fallbackUsage: 0,
      averageLoadTime: 0
    },
    performance: {
      pageLoadTime: 0,
      resourceLoadTime: 0,
      userSatisfaction: 100
    },
    alerts: [],
    lastUpdated: new Date().toISOString()
  };
  
  fs.writeFileSync(METRICS_FILE, JSON.stringify(initialMetrics, null, 2));
}

console.log('🚀 Starting Monitoring Dashboard...');
console.log(`📊 Dashboard will be available at: http://localhost:${DASHBOARD_PORT}`);
console.log(`📁 Metrics file: ${METRICS_FILE}`);

// 启动简单的HTTP服务器来提供仪表板
const http = require('http');
const url = require('url');

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (pathname === '/') {
    // 提供仪表板HTML
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(getDashboardHTML());
  } else if (pathname === '/api/metrics') {
    // 提供指标数据
    res.writeHead(200, { 'Content-Type': 'application/json' });
    try {
      const metrics = fs.readFileSync(METRICS_FILE, 'utf8');
      res.end(metrics);
    } catch (error) {
      res.end(JSON.stringify({ error: 'Failed to read metrics' }));
    }
  } else if (pathname === '/api/metrics' && req.method === 'POST') {
    // 接收新的指标数据
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const newMetric = JSON.parse(body);
        updateMetrics(newMetric);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(DASHBOARD_PORT, () => {
  console.log(`✅ Monitoring Dashboard started on port ${DASHBOARD_PORT}`);
  console.log('📈 Collecting metrics...');
  
  // 启动指标收集
  startMetricsCollection();
});

function getDashboardHTML() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tucsenberg Monitoring Dashboard</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .header {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }
        .metric-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .metric-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 15px;
            color: #333;
        }
        .metric-value {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 5px;
        }
        .metric-label {
            font-size: 14px;
            color: #666;
            margin-bottom: 10px;
        }
        .good { color: #22c55e; }
        .warning { color: #f59e0b; }
        .poor { color: #ef4444; }
        .status-indicator {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            margin-right: 8px;
        }
        .refresh-btn {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
        }
        .refresh-btn:hover {
            background: #2563eb;
        }
        .last-updated {
            color: #666;
            font-size: 12px;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Tucsenberg Monitoring Dashboard</h1>
            <p>Real-time performance and i18n monitoring</p>
            <button class="refresh-btn" onclick="loadMetrics()">🔄 Refresh</button>
            <div class="last-updated" id="lastUpdated"></div>
        </div>
        
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-title">Web Vitals</div>
                <div id="webVitals">Loading...</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-title">I18n Performance</div>
                <div id="i18nMetrics">Loading...</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-title">Locale Usage</div>
                <div id="localeUsage">Loading...</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-title">Alerts</div>
                <div id="alerts">Loading...</div>
            </div>
        </div>
    </div>

    <script>
        async function loadMetrics() {
            try {
                const response = await fetch('/api/metrics');
                const metrics = await response.json();
                
                updateWebVitals(metrics.webVitals);
                updateI18nMetrics(metrics.i18n);
                updateLocaleUsage(metrics.i18n.localeUsage);
                updateAlerts(metrics.alerts);
                
                document.getElementById('lastUpdated').textContent = 
                    'Last updated: ' + new Date(metrics.lastUpdated).toLocaleString();
                    
            } catch (error) {
                console.error('Failed to load metrics:', error);
            }
        }
        
        function updateWebVitals(vitals) {
            const container = document.getElementById('webVitals');
            if (!vitals || Object.keys(vitals).length === 0) {
                container.innerHTML = '<div class="metric-label">No data available</div>';
                return;
            }
            
            let html = '';
            Object.entries(vitals).forEach(([key, data]) => {
                const className = data.rating === 'good' ? 'good' : 
                                data.rating === 'needs-improvement' ? 'warning' : 'poor';
                html += \`
                    <div class="metric-value \${className}">
                        <span class="status-indicator \${className}" style="background: currentColor;"></span>
                        \${key.toUpperCase()}: \${data.value}
                    </div>
                    <div class="metric-label">\${data.rating} (\${data.trend})</div>
                \`;
            });
            container.innerHTML = html;
        }
        
        function updateI18nMetrics(i18n) {
            const container = document.getElementById('i18nMetrics');
            container.innerHTML = \`
                <div class="metric-value">⚡ \${i18n.averageLoadTime}ms</div>
                <div class="metric-label">Average Load Time</div>
                <div class="metric-value">❌ \${i18n.translationErrors}</div>
                <div class="metric-label">Translation Errors</div>
                <div class="metric-value">🔄 \${i18n.fallbackUsage}</div>
                <div class="metric-label">Fallback Usage</div>
            \`;
        }
        
        function updateLocaleUsage(usage) {
            const container = document.getElementById('localeUsage');
            let html = '';
            Object.entries(usage).forEach(([locale, count]) => {
                html += \`
                    <div class="metric-value">\${locale.toUpperCase()}: \${count}%</div>
                \`;
            });
            container.innerHTML = html;
        }
        
        function updateAlerts(alerts) {
            const container = document.getElementById('alerts');
            if (!alerts || alerts.length === 0) {
                container.innerHTML = '<div class="metric-label good">✅ No active alerts</div>';
                return;
            }
            
            let html = '';
            alerts.slice(0, 3).forEach(alert => {
                const className = alert.severity === 'critical' ? 'poor' : 
                                alert.severity === 'high' ? 'poor' : 'warning';
                html += \`
                    <div class="metric-value \${className}">
                        \${alert.severity.toUpperCase()}: \${alert.type}
                    </div>
                    <div class="metric-label">\${alert.message}</div>
                \`;
            });
            container.innerHTML = html;
        }
        
        // 自动刷新
        setInterval(loadMetrics, 30000); // 每30秒刷新
        
        // 初始加载
        loadMetrics();
    </script>
</body>
</html>
  `;
}

function updateMetrics(newMetric) {
  try {
    const metrics = JSON.parse(fs.readFileSync(METRICS_FILE, 'utf8'));
    
    // 更新指标
    if (newMetric.type === 'web_vital') {
      metrics.webVitals[newMetric.name] = {
        value: newMetric.value,
        rating: newMetric.rating,
        trend: 'stable'
      };
    } else if (newMetric.type === 'i18n') {
      Object.assign(metrics.i18n, newMetric.data);
    }
    
    metrics.lastUpdated = new Date().toISOString();
    
    fs.writeFileSync(METRICS_FILE, JSON.stringify(metrics, null, 2));
  } catch (error) {
    console.error('Failed to update metrics:', error);
  }
}

function startMetricsCollection() {
  console.log('📊 Starting metrics collection...');
  
  // 模拟指标收集
  setInterval(() => {
    const mockMetric = {
      type: 'web_vital',
      name: 'lcp',
      value: 2000 + Math.random() * 1000,
      rating: 'good',
      timestamp: Date.now()
    };
    
    updateMetrics(mockMetric);
  }, 10000); // 每10秒更新一次模拟数据
}

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down monitoring dashboard...');
  server.close(() => {
    console.log('✅ Dashboard stopped');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down...');
  server.close(() => {
    process.exit(0);
  });
});
