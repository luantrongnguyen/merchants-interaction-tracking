import React, { useMemo, useState } from 'react';
import { MerchantWithStatus } from '../types/merchant';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

interface MerchantStatsModalProps {
  merchant: MerchantWithStatus;
  onClose: () => void;
}

const COLORS = [
  '#3366CC', '#DC3912', '#FF9900', '#109618', '#990099',
  '#3B3EAC', '#0099C6', '#DD4477', '#66AA00', '#B82E2E',
  '#316395', '#994499', '#22AA99', '#AAAA11', '#6633CC',
  '#E67300', '#8B0707', '#651067', '#329262', '#5574A6'
];

const parseDate = (dateString: string): Date | null => {
  if (!dateString) return null;
  try {
    if (dateString.includes('/')) {
      const parts = dateString.split('/');
      if (parts.length === 3) {
        const [month, day, year] = parts;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }
    }
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
};

const getDayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const getMonthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
const getYearKey = (d: Date) => `${d.getFullYear()}`;
const getWeekKey = (d: Date) => {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  if (dayNum !== 1) {
    date.setUTCDate(date.getUTCDate() + (1 - dayNum));
  }
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2,'0')}`;
};

const MerchantStatsModal: React.FC<MerchantStatsModalProps> = ({ merchant, onClose }) => {
  const [range, setRange] = useState<'day' | 'week' | 'month' | 'year'>('day');

  const supportLogs = merchant.supportLogs || [];

  const { labels, counts, total } = useMemo(() => {
    const map = new Map<string, number>();
    supportLogs.forEach(log => {
      const raw = (log.category || '').trim();
      const key = raw !== '' ? raw : 'Uncategorized';
      map.set(key, (map.get(key) || 0) + 1);
    });
    const labs = Array.from(map.keys());
    const cnts = labs.map(l => map.get(l) || 0);
    const tot = cnts.reduce((a, b) => a + b, 0);
    return { labels: labs, counts: cnts, total: tot };
  }, [supportLogs]);

  const pieData = {
    labels,
    datasets: [
      {
        label: 'Số lượng theo Category',
        data: counts,
        backgroundColor: labels.map((_, i) => COLORS[i % COLORS.length]),
        borderColor: '#ffffff',
        borderWidth: 1,
      },
    ],
  };

  const pieOptions = {
    plugins: {
      legend: { position: 'right' as const },
      tooltip: {
        callbacks: {
          label: (ctx: any) => {
            const value = ctx.parsed || 0;
            const percent = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
            return `${ctx.label}: ${value} (${percent}%)`;
          },
        },
      },
    },
    maintainAspectRatio: false,
  } as const;

  const timeAgg = useMemo(() => {
    const map = new Map<string, number>();
    supportLogs.forEach(log => {
      const d = parseDate(log.date);
      if (!d) return;
      let key = '';
      switch (range) {
        case 'day': key = getDayKey(d); break;
        case 'week': key = getWeekKey(d); break;
        case 'month': key = getMonthKey(d); break;
        case 'year': key = getYearKey(d); break;
      }
      map.set(key, (map.get(key) || 0) + 1);
    });
    const keys = Array.from(map.keys()).sort();
    return { labels: keys, counts: keys.map(k => map.get(k) || 0) };
  }, [supportLogs, range]);

  const barData = {
    labels: timeAgg.labels,
    datasets: [
      {
        label: 'Interactions',
        data: timeAgg.counts,
        backgroundColor: '#10B981',
        borderColor: '#059669',
        borderWidth: 1,
      },
    ],
  };

  const barOptions = {
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) => `Interactions: ${ctx.parsed.y}`,
        },
      },
    },
    maintainAspectRatio: false,
    scales: {
      y: { beginAtZero: true }
    }
  } as const;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 980 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Stats - {merchant.name}</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="chart-wrapper" style={{ height: 320, marginBottom: 16 }}>
            {labels.length === 0 ? (
              <div className="empty-state">Không có dữ liệu category.</div>
            ) : (
              <Pie data={pieData} options={pieOptions} />
            )}
          </div>

          <div style={{ marginBottom: 8 }}>
            <select value={range} onChange={e => setRange(e.target.value as any)}>
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="year">Year</option>
            </select>
          </div>
          <div className="chart-wrapper" style={{ height: 280 }}>
            {timeAgg.labels.length === 0 ? (
              <div className="empty-state">Không có dữ liệu interactions.</div>
            ) : (
              <Bar data={barData} options={barOptions} />
            )}
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default MerchantStatsModal;


