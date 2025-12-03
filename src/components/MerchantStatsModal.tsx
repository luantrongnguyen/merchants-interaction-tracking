import React, { useMemo, useState, useEffect } from 'react';
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
import Modal from './Modal';
import './MerchantStatsModal.css';

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

interface ProcessedData {
  labels: string[];
  counts: number[];
  total: number;
  timeAgg: {
    labels: string[];
    counts: number[];
  };
}

const MerchantStatsModal: React.FC<MerchantStatsModalProps> = ({ merchant, onClose }) => {
  const [range, setRange] = useState<'day' | 'week' | 'month' | 'year'>('day');
  const [isLoading, setIsLoading] = useState(true);
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);

  const supportLogs = merchant.supportLogs || [];

  // Process data asynchronously
  useEffect(() => {
    setIsLoading(true);
    
    // Use setTimeout to make it async and not block UI
    const processData = async () => {
      // Small delay to allow UI to render loading state
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Process category data
      const categoryMap = new Map<string, number>();
      supportLogs.forEach(log => {
        const raw = (log.category || '').trim();
        const key = raw !== '' ? raw : 'Uncategorized';
        categoryMap.set(key, (categoryMap.get(key) || 0) + 1);
      });
      const categoryLabels = Array.from(categoryMap.keys());
      const categoryCounts = categoryLabels.map(l => categoryMap.get(l) || 0);
      const total = categoryCounts.reduce((a, b) => a + b, 0);

      // Process time aggregation data
      const timeMap = new Map<string, number>();
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
        timeMap.set(key, (timeMap.get(key) || 0) + 1);
      });
      const timeKeys = Array.from(timeMap.keys()).sort();
      const timeCounts = timeKeys.map(k => timeMap.get(k) || 0);

      setProcessedData({
        labels: categoryLabels,
        counts: categoryCounts,
        total,
        timeAgg: {
          labels: timeKeys,
          counts: timeCounts,
        },
      });
      
      setIsLoading(false);
    };

    processData();
  }, [supportLogs, range]);

  const { labels = [], counts = [], total = 0 } = processedData || { labels: [], counts: [], total: 0 };

  const pieData = {
    labels: labels || [],
    datasets: [
      {
        label: 'Số lượng theo Category',
        data: counts || [],
        backgroundColor: (labels || []).map((_, i) => COLORS[i % COLORS.length]),
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

  const timeAgg = processedData?.timeAgg || { labels: [], counts: [] };

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
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Stats - ${merchant.name}`}
      width="980px"
      maxWidth="96vw"
      maxHeight="90vh"
    >
      {isLoading ? (
        <div className="stats-loading-container">
          <div className="stats-loading-spinner"></div>
          <p className="stats-loading-text">Đang xử lý dữ liệu...</p>
        </div>
      ) : (
        <>
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
        </>
      )}
    </Modal>
  );
};

export default MerchantStatsModal;


