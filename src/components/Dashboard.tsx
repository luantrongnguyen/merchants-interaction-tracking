import React, { useMemo, useState, useEffect } from 'react';
import { MerchantWithStatus, SupportLog } from '../types/merchant';
import { Pie, Bar, Line } from 'react-chartjs-2';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
	Chart as ChartJS,
	ArcElement,
	Tooltip,
	Legend,
	CategoryScale,
	LinearScale,
	BarElement,
	LineElement,
	PointElement
} from 'chart.js';
import './Dashboard.css';
import Modal from './Modal';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement);

interface DashboardProps {
	merchants: MerchantWithStatus[];
}

const COLORS = [
	'#3366CC', '#DC3912', '#FF9900', '#109618', '#990099',
	'#3B3EAC', '#0099C6', '#DD4477', '#66AA00', '#B82E2E',
	'#316395', '#994499', '#22AA99', '#AAAA11', '#6633CC',
	'#E67300', '#8B0707', '#651067', '#329262', '#5574A6'
];

	const Dashboard: React.FC<DashboardProps> = ({ merchants }) => {
	const navigate = useNavigate();
	const location = useLocation();
	const { isAuthenticated } = useAuth();
	const isFullscreen = location.pathname === '/views/dashboard/fullscreen' || location.pathname === '/dashboard/fullscreen';
	const isViewPage = location.pathname.startsWith('/views');
	const [range, setRange] = useState<'day' | 'week' | 'month' | 'year'>('day');
	const [terminalRange, setTerminalRange] = useState<'day' | 'week' | 'month' | 'year'>('day');
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
	const [categoryLogs, setCategoryLogs] = useState<Array<{
		merchant: string;
		storeId?: string;
		log: SupportLog;
	}>>([]);
	const [selectedMiUpdatedStatus, setSelectedMiUpdatedStatus] = useState<string | null>(null);
	const [miUpdatedMerchants, setMiUpdatedMerchants] = useState<MerchantWithStatus[]>([]);
	const [selectedTerminalDate, setSelectedTerminalDate] = useState<string | null>(null);
	const [terminalLogs, setTerminalLogs] = useState<Array<{
		merchant: string;
		storeId?: string;
		log: SupportLog;
	}>>([]);
	const [merchantFrequency, setMerchantFrequency] = useState<Map<string, {
		todayCount: number;
		last7DaysCount: number;
		last30DaysCount: number;
		trend: 'increase' | 'decrease' | 'stable';
	}>>(new Map());
	const [interactionsChartIndex, setInteractionsChartIndex] = useState(0);
	const [terminalChartIndex, setTerminalChartIndex] = useState(0);
	const MAX_VISIBLE_COLUMNS = 15;

	// Helper functions for date keys (moved before getDefaultIndexForCurrentDate)
	const getDayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
	const getMonthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
	const getYearKey = (d: Date) => `${d.getFullYear()}`;
	const getWeekKey = (d: Date) => {
		const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
		const dayNum = date.getUTCDay() || 7; // 1..7, Mon..Sun
		if (dayNum !== 1) {
			date.setUTCDate(date.getUTCDate() + (1 - dayNum));
		}
		const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
		const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
		return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2,'0')}`;
	};

	// Calculate default index to show current date
	const getDefaultIndexForCurrentDate = (labels: string[], range: 'day' | 'week' | 'month' | 'year'): number => {
		if (labels.length === 0) return 0;
		if (labels.length <= MAX_VISIBLE_COLUMNS) return 0;
		
		const now = new Date();
		let currentKey = '';
		switch (range) {
			case 'day': currentKey = getDayKey(now); break;
			case 'week': currentKey = getWeekKey(now); break;
			case 'month': currentKey = getMonthKey(now); break;
			case 'year': currentKey = getYearKey(now); break;
		}
		
		// Find index of current date (or nearest date before current)
		// Labels are sorted, so we find the last label <= currentKey
		let currentIndex = labels.length - 1;
		for (let i = labels.length - 1; i >= 0; i--) {
			if (labels[i] <= currentKey) {
				currentIndex = i;
				break;
			}
		}
		
		// Calculate index so current date appears at the end of visible columns
		// If current date is at index i, we want to show columns ending at i
		// So start index should be max(0, i - MAX_VISIBLE_COLUMNS + 1)
		const defaultIndex = Math.max(0, currentIndex - MAX_VISIBLE_COLUMNS + 1);
		return Math.min(defaultIndex, Math.max(0, labels.length - MAX_VISIBLE_COLUMNS));
	};

	// Helper function to split categories by comma and normalize
	const splitAndNormalizeCategories = (categoryString: string): string[] => {
		if (!categoryString || categoryString.trim() === '') {
			return ['Uncategorized'];
		}
		// Split by comma, trim each part, and filter out empty strings
		return categoryString
			.split(',')
			.map(cat => cat.trim())
			.filter(cat => cat !== '');
	};

	// Helper function to normalize category name (for comparison)
	const normalizeCategoryName = (category: string): string => {
		return category.trim().toLowerCase();
	};

	// Helper function to group similar categories together
	const groupCategory = (category: string): string => {
		const normalized = normalizeCategoryName(category);
		
		// Terminal - keep as is
		if (normalized === 'terminal') {
			return 'Terminal';
		}
		
		// Devices - group Printer and Devices
		if (normalized === 'printer' || normalized === 'devices' || normalized === 'device') {
			return 'Devices';
		}
		
		// Payment - group Payment, Gift card, Mango Pay
		if (normalized === 'payment' || normalized === 'gift card' || normalized === 'mango pay') {
			return 'Payment';
		}
		
		// System Operations - group System Operations, System Slow/Down, Batch, Report/Payroll, Notifications, Chain Management, Mango Manage
		if (normalized === 'system operations' || normalized === 'system slow/down' || normalized === 'system slow' || normalized === 'system down' ||
		    normalized === 'batch' || normalized === 'report/payroll' || normalized === 'report' || normalized === 'payroll' ||
		    normalized === 'notifications' || normalized === 'chain management' || normalized === 'mango manage') {
			return 'System Operations';
		}
		
		// Marketing - group Marketing, Marketing Plus, SMS/Promotion
		if (normalized === 'marketing' || normalized === 'marketing plus' || normalized === 'sms/promotion' || normalized === 'sms' || normalized === 'promotion') {
			return 'Marketing';
		}
		
		// App/Software Issues - group Check-in app, Tech portal, Mango phone app, Display Error
		if (normalized === 'check-in app' || normalized === 'check-in' || normalized === 'tech portal' || 
		    normalized === 'mango phone app' || normalized === 'mango phone' || normalized === 'display error') {
			return 'App/Software Issues';
		}
		
		// Support/Training - group Training, Take care, Merchant Services
		if (normalized === 'training' || normalized === 'take care' || normalized === 'merchant services') {
			return 'Support/Training';
		}
		
		// Feedback - group all Feedback update MI variants
		if (normalized.includes('feedback')) {
			return 'Feedback';
		}
		
		// BUG - group Bug, Bug system, BUG
		if (normalized === 'bug' || normalized === 'bug system' || normalized.includes('bug')) {
			return 'BUG';
		}
		
		// Others - keep as is, also group Book, Turn if they don't fit elsewhere
		if (normalized === 'others' || normalized === 'other' || normalized === 'book' || normalized === 'turn') {
			return 'Others';
		}
		
		// Return original category if no grouping found
		return category;
	};

	const { labels, counts, categoryMap } = useMemo(() => {
		const categoryCountMap = new Map<string, number>();
		merchants.forEach(m => {
			(m.supportLogs || []).forEach(log => {
				const raw = (log.category || '').trim();
				// Skip empty categories (Uncategorized)
				if (raw === '') {
					return; // Don't count Uncategorized
				}
				// Split categories by comma
				const categories = splitAndNormalizeCategories(raw);
				categories.forEach(cat => {
					// Group similar categories together
					const groupedCategory = groupCategory(cat);
					
					// Use normalized name as key to avoid duplicates
					const normalizedKey = normalizeCategoryName(groupedCategory);
					
					// Check if we already have this grouped category (case-insensitive)
					let existingKey = null;
					const existingKeys = Array.from(categoryCountMap.keys());
					for (let i = 0; i < existingKeys.length; i++) {
						const key = existingKeys[i];
						if (normalizeCategoryName(key) === normalizedKey) {
							existingKey = key;
							break;
						}
					}
					
					if (existingKey) {
						// Use existing key (preserve first case encountered)
						categoryCountMap.set(existingKey, (categoryCountMap.get(existingKey) || 0) + 1);
					} else {
						// New grouped category
						categoryCountMap.set(groupedCategory, (categoryCountMap.get(groupedCategory) || 0) + 1);
					}
				});
			});
		});
		const labelsArr = Array.from(categoryCountMap.keys());
		const countsArr = labelsArr.map(l => categoryCountMap.get(l) || 0);
		return { labels: labelsArr, counts: countsArr, categoryMap: categoryCountMap };
	}, [merchants]);

	const total = counts.reduce((a, b) => a + b, 0);

	// Calculate MI Updated statistics
	// Categories: Ver 11042025, Ver 11112025, Ver 11212025, z11/no card machine, not updated yet
	const miUpdatedStats = useMemo(() => {
		const ver11042025: MerchantWithStatus[] = [];
		const ver11112025: MerchantWithStatus[] = [];
		const ver11212025: MerchantWithStatus[] = [];
		const z11NoCardMachine: MerchantWithStatus[] = [];
		const notUpdatedYet: MerchantWithStatus[] = [];

		merchants.forEach(m => {
			// Parse miVersion if it's a JSON string
			let version = m.miVersion;
			if (version && version.startsWith('"') && version.endsWith('"')) {
				try {
					version = JSON.parse(version);
				} catch {
					// If parsing fails, use as is
				}
			}

			// Check if has specific version
			if (version === '11042025') {
				ver11042025.push(m);
			} else if (version === '11112025') {
				ver11112025.push(m);
			} else if (version === '11212025') {
				ver11212025.push(m);
			} else if (m.z11OrNotGoWMango === true) {
				// z11/no card machine (and no specific version)
				z11NoCardMachine.push(m);
			} else if (!m.isMiUpdated && !m.z11OrNotGoWMango) {
				// Not updated yet (no version, no z11, no isMiUpdated)
				notUpdatedYet.push(m);
			}
		});

		const total = merchants.length;
		return {
			ver11042025: ver11042025.length,
			ver11112025: ver11112025.length,
			ver11212025: ver11212025.length,
			z11NoCardMachine: z11NoCardMachine.length,
			notUpdatedYet: notUpdatedYet.length,
			total,
			categories: {
				ver11042025,
				ver11112025,
				ver11212025,
				z11NoCardMachine,
				notUpdatedYet,
			},
		};
	}, [merchants]);

	const miUpdatedData = {
		labels: [
			'Ver 11042025',
			'Ver 11112025',
			'Ver 11212025',
			'z11/no card machine',
			'not updated yet'
		],
		datasets: [
			{
				label: 'MI Updated Status',
				data: [
					miUpdatedStats.ver11042025,
					miUpdatedStats.ver11112025,
					miUpdatedStats.ver11212025,
					miUpdatedStats.z11NoCardMachine,
					miUpdatedStats.notUpdatedYet,
				],
				backgroundColor: ['#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'], // Green, Blue, Purple, Orange, Red
				borderColor: '#ffffff',
				borderWidth: 2,
			},
		],
	};

	const miUpdatedOptions = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: { 
				position: 'right' as const,
				align: 'center' as const,
				fullSize: false,
				labels: {
					padding: 12,
					font: {
						size: 11,
						weight: 500,
					},
					color: '#475569',
					boxWidth: 10,
					boxHeight: 10,
					usePointStyle: false,
					maxWidth: 200,
					textAlign: 'left' as const,
				},
				onClick: (e: any, legendItem: any, legend: any) => {
					// Extract category from legend item text
					const labelText = legendItem.text || '';
					handleMiUpdatedClick(labelText);
					return false;
				},
			},
			tooltip: {
				backgroundColor: 'rgba(30, 41, 59, 0.95)',
				padding: 12,
				titleFont: {
					size: 14,
					weight: 600,
				},
				bodyFont: {
					size: 13,
				},
				cornerRadius: 8,
				borderColor: 'rgba(255, 179, 0, 0.3)',
				borderWidth: 1,
				callbacks: {
					label: (ctx: any) => {
						const value = ctx.parsed || 0;
						const total = miUpdatedStats.total || 0;
						const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
						return `${ctx.label}: ${value} (${pct}%)`;
					}
				}
			},
		},
		onClick: (event: any, elements: any[]) => {
			if (elements && elements.length > 0) {
				const elementIndex = elements[0].index;
				const labels = ['Ver 11042025', 'Ver 11112025', 'Ver 11212025', 'z11/no card machine', 'not updated yet'];
				const category = labels[elementIndex];
				if (category) {
					handleMiUpdatedClick(category);
				}
			}
		},
		layout: {
			padding: {
				left: 0,
				right: 0,
				top: 0,
				bottom: 10,
			},
		},
	};

	const handleMiUpdatedClick = (category: string) => {
		let filtered: MerchantWithStatus[] = [];
		
		if (category === 'Ver 11042025') {
			filtered = miUpdatedStats.categories.ver11042025;
		} else if (category === 'Ver 11112025') {
			filtered = miUpdatedStats.categories.ver11112025;
		} else if (category === 'Ver 11212025') {
			filtered = miUpdatedStats.categories.ver11212025;
		} else if (category === 'z11/no card machine') {
			filtered = miUpdatedStats.categories.z11NoCardMachine;
		} else if (category === 'not updated yet') {
			filtered = miUpdatedStats.categories.notUpdatedYet;
		}
		
		setMiUpdatedMerchants(filtered);
		setSelectedMiUpdatedStatus(category as any);
	};

	const handleCategoryClick = (category: string) => {
		const logs: Array<{
			merchant: string;
			storeId?: string;
			log: SupportLog;
		}> = [];
		
		// Normalize the selected category for comparison
		const normalizedSelectedCategory = normalizeCategoryName(category);
		
		merchants.forEach(merchant => {
			(merchant.supportLogs || []).forEach(log => {
				const logCategory = (log.category || '').trim();
				if (logCategory === '') {
					// Check if selected category is "Uncategorized"
					if (normalizedSelectedCategory === 'uncategorized') {
						logs.push({
							merchant: merchant.name,
							storeId: merchant.storeId,
							log: log,
						});
					}
				} else {
					// Split log category and check if grouping matches the selected category
					const logCategories = splitAndNormalizeCategories(logCategory);
					const hasMatchingCategory = logCategories.some(cat => {
						const groupedCat = groupCategory(cat);
						return normalizeCategoryName(groupedCat) === normalizedSelectedCategory;
					});
					
					if (hasMatchingCategory) {
						logs.push({
							merchant: merchant.name,
							storeId: merchant.storeId,
							log: log,
						});
					}
				}
			});
		});
		
		// Sort by date (newest first)
		logs.sort((a, b) => {
			const dateA = a.log.date ? new Date(a.log.date).getTime() : 0;
			const dateB = b.log.date ? new Date(b.log.date).getTime() : 0;
			return dateB - dateA;
		});
		
		setCategoryLogs(logs);
		setSelectedCategory(category);
	};

	const data = {
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

	const options = {
		plugins: {
			legend: { 
				position: 'bottom' as const,
				align: 'start' as const,
				fullSize: false,
				labels: {
					padding: 6,
					font: {
						size: 12,
						weight: 500,
					},
					color: '#475569',
					boxWidth: 10,
					boxHeight: 10,
					usePointStyle: false,
					maxWidth: 150,
					textAlign: 'left' as const,
				},
				onClick: (e: any, legendItem: any, legend: any) => {
					// Extract category name from legend item text (remove percentage)
					const labelText = legendItem.text || '';
					const categoryName = labelText.split(' (')[0];
					if (categoryName) {
						handleCategoryClick(categoryName);
					}
					// Return false to prevent default toggle behavior
					return false;
				},
			},
			tooltip: {
				backgroundColor: 'rgba(30, 41, 59, 0.95)',
				padding: 12,
				titleFont: {
					size: 14,
					weight: 600,
				},
				bodyFont: {
					size: 13,
				},
				cornerRadius: 8,
				borderColor: 'rgba(255, 179, 0, 0.3)',
				borderWidth: 1,
				callbacks: {
					label: (ctx: any) => {
						const value = ctx.parsed || 0;
						const percent = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
						return `${ctx.label}: ${value} (${percent}%)`;
					},
				},
			},
		},
		onClick: (event: any, elements: any[]) => {
			if (elements && elements.length > 0) {
				const element = elements[0];
				const index = element.index;
				if (index !== undefined && labels[index]) {
					handleCategoryClick(labels[index]);
				}
			}
		},
		layout: {
			padding: {
				left: 0,
				right: 0,
				top: 0,
				bottom: 10,
			},
		},
		maintainAspectRatio: false,
	} as const;

	// ---------- Bar chart for interactions over time ----------
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

	const timeAgg = useMemo(() => {
		const map = new Map<string, number>();
		merchants.forEach(m => {
			(m.supportLogs || []).forEach(log => {
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
		});
		const keys = Array.from(map.keys()).sort();
		return { labels: keys, counts: keys.map(k => map.get(k) || 0) };
	}, [merchants, range]);

	// Set default index to show current date when data or range changes
	useEffect(() => {
		if (timeAgg.labels.length > 0) {
			const defaultIndex = getDefaultIndexForCurrentDate(timeAgg.labels, range);
			setInteractionsChartIndex(defaultIndex);
		}
	}, [timeAgg.labels, range]);

	// Slice data for Interactions chart (max 15 columns)
	const interactionsStartIndex = Math.max(0, Math.min(interactionsChartIndex, timeAgg.labels.length - MAX_VISIBLE_COLUMNS));
	const interactionsEndIndex = interactionsStartIndex + MAX_VISIBLE_COLUMNS;
	const interactionsVisibleLabels = timeAgg.labels.slice(interactionsStartIndex, interactionsEndIndex);
	const interactionsVisibleCounts = timeAgg.counts.slice(interactionsStartIndex, interactionsEndIndex);
	const canScrollInteractionsLeft = interactionsStartIndex > 0;
	const canScrollInteractionsRight = interactionsEndIndex < timeAgg.labels.length;

	const barData = {
		labels: interactionsVisibleLabels,
		datasets: [
			{
				label: 'Interactions',
				data: interactionsVisibleCounts,
				backgroundColor: 'rgba(255, 179, 0, 0.8)',
				borderColor: '#FFB300',
				borderWidth: 2,
				borderRadius: 6,
				borderSkipped: false,
			},
		],
	};

	const barOptions = {
		plugins: {
			legend: { display: false },
			tooltip: {
				backgroundColor: 'rgba(30, 41, 59, 0.95)',
				padding: 12,
				titleFont: {
					size: 14,
					weight: 600,
				},
				bodyFont: {
					size: 13,
				},
				cornerRadius: 8,
				borderColor: 'rgba(255, 179, 0, 0.3)',
				borderWidth: 1,
				callbacks: {
					label: (ctx: any) => `Interactions: ${ctx.parsed.y}`,
				},
			},
		},
		maintainAspectRatio: false,
		scales: {
			y: { 
				beginAtZero: true,
				grid: {
					color: 'rgba(0, 0, 0, 0.05)',
				},
				ticks: {
					color: '#64748b',
					font: {
						size: 12,
					},
				},
			},
			x: {
				grid: {
					display: false,
				},
				ticks: {
					color: '#64748b',
					font: {
						size: 12,
					},
				},
			},
		}
	} as const;

	// ---------- Terminal Issues Over Time ----------
	const terminalKeywords = ['terminal', 'disconnected', 'processing', 'connection', 'connectivity', 'network', 'offline', 'online', 'feedback update mi', 'update mi'];
	const isTerminalRelated = (category: string | undefined): boolean => {
		if (!category) return false;
		const lowerCategory = category.toLowerCase();
		return terminalKeywords.some(keyword => lowerCategory.includes(keyword));
	};

	const terminalTimeAgg = useMemo(() => {
		const map = new Map<string, number>();
		merchants.forEach(m => {
			(m.supportLogs || []).forEach(log => {
				if (!isTerminalRelated(log.category)) return;
				const d = parseDate(log.date);
				if (!d) return;
				let key = '';
				switch (terminalRange) {
					case 'day': key = getDayKey(d); break;
					case 'week': key = getWeekKey(d); break;
					case 'month': key = getMonthKey(d); break;
					case 'year': key = getYearKey(d); break;
				}
				map.set(key, (map.get(key) || 0) + 1);
			});
		});
		const keys = Array.from(map.keys()).sort();
		return { labels: keys, counts: keys.map(k => map.get(k) || 0) };
	}, [merchants, terminalRange]);

	// Set default index to show current date when data or range changes
	useEffect(() => {
		if (terminalTimeAgg.labels.length > 0) {
			const defaultIndex = getDefaultIndexForCurrentDate(terminalTimeAgg.labels, terminalRange);
			setTerminalChartIndex(defaultIndex);
		}
	}, [terminalTimeAgg.labels, terminalRange]);

	// Slice data for Terminal chart (max 15 columns)
	const terminalStartIndex = Math.max(0, Math.min(terminalChartIndex, terminalTimeAgg.labels.length - MAX_VISIBLE_COLUMNS));
	const terminalEndIndex = terminalStartIndex + MAX_VISIBLE_COLUMNS;
	const terminalVisibleLabels = terminalTimeAgg.labels.slice(terminalStartIndex, terminalEndIndex);
	const terminalVisibleCounts = terminalTimeAgg.counts.slice(terminalStartIndex, terminalEndIndex);
	const canScrollTerminalLeft = terminalStartIndex > 0;
	const canScrollTerminalRight = terminalEndIndex < terminalTimeAgg.labels.length;

	const terminalLineData = {
		labels: terminalVisibleLabels,
		datasets: [
			{
				label: 'Terminal Issues',
				data: terminalVisibleCounts,
				borderColor: '#EF4444',
				backgroundColor: 'rgba(239, 68, 68, 0.1)',
				borderWidth: 2,
				fill: true,
				tension: 0.4,
			},
		],
	};

	const handleTerminalDateClick = (dateKey: string) => {
		const logs: Array<{
			merchant: string;
			storeId?: string;
			log: SupportLog;
		}> = [];
		
		// Parse the selected date key to get the actual date
		let selectedDate: Date | null = null;
		if (terminalRange === 'day') {
			// dateKey format: "YYYY-MM-DD"
			const parts = dateKey.split('-');
			if (parts.length === 3) {
				selectedDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
			}
		}
		
		// Calculate frequency for each merchant
		const frequencyMap = new Map<string, {
			todayCount: number;
			last7DaysCount: number;
			last30DaysCount: number;
			trend: 'increase' | 'decrease' | 'stable';
		}>();
		
		merchants.forEach(merchant => {
			const merchantKey = merchant.storeId || merchant.name;
			let todayCount = 0;
			let last7DaysCount = 0;
			let last30DaysCount = 0;
			
			(merchant.supportLogs || []).forEach(log => {
				if (!isTerminalRelated(log.category)) return;
				
				const logDate = parseDate(log.date);
				if (!logDate) return;
				
				let logKey = '';
				switch (terminalRange) {
					case 'day': 
						logKey = getDayKey(logDate);
						break;
					case 'week': 
						logKey = getWeekKey(logDate);
						break;
					case 'month': 
						logKey = getMonthKey(logDate);
						break;
					case 'year': 
						logKey = getYearKey(logDate);
						break;
				}
				
				// Count for selected day
				if (logKey === dateKey) {
					todayCount++;
					logs.push({
						merchant: merchant.name,
						storeId: merchant.storeId,
						log: log,
					});
				}
				
				// Count for last 7 days and 30 days (only if range is 'day')
				if (terminalRange === 'day' && selectedDate) {
					const daysDiff = Math.floor((selectedDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));
					if (daysDiff >= 0 && daysDiff <= 7) {
						last7DaysCount++;
					}
					if (daysDiff >= 0 && daysDiff <= 30) {
						last30DaysCount++;
					}
				}
			});
			
			// Calculate trend
			let trend: 'increase' | 'decrease' | 'stable' = 'stable';
			if (todayCount > 0) {
				const avgLast7Days = (last7DaysCount - todayCount) / 6; // Exclude today
				if (avgLast7Days > 0) {
					if (todayCount > avgLast7Days * 1.5) {
						trend = 'increase';
					} else if (todayCount < avgLast7Days * 0.5) {
						trend = 'decrease';
					}
				} else if (last7DaysCount === 0 && todayCount > 0) {
					trend = 'increase'; // First time in 7 days
				}
			}
			
			if (todayCount > 0 || last7DaysCount > 0 || last30DaysCount > 0) {
				frequencyMap.set(merchantKey, {
					todayCount,
					last7DaysCount,
					last30DaysCount,
					trend,
				});
			}
		});
		
		// Sort by date and time (newest first)
		logs.sort((a, b) => {
			const dateA = a.log.date ? new Date(a.log.date).getTime() : 0;
			const dateB = b.log.date ? new Date(b.log.date).getTime() : 0;
			if (dateB !== dateA) return dateB - dateA;
			// If same date, sort by time
			const timeA = a.log.time || '';
			const timeB = b.log.time || '';
			return timeB.localeCompare(timeA);
		});
		
		setTerminalLogs(logs);
		setMerchantFrequency(frequencyMap);
		setSelectedTerminalDate(dateKey);
	};

	const terminalLineOptions = {
		plugins: {
			legend: { 
				display: true,
				labels: {
					padding: 15,
					font: {
						size: 12,
						weight: 500,
					},
					color: '#475569',
				},
			},
			tooltip: {
				backgroundColor: 'rgba(30, 41, 59, 0.95)',
				padding: 12,
				titleFont: {
					size: 14,
					weight: 600,
				},
				bodyFont: {
					size: 13,
				},
				cornerRadius: 8,
				borderColor: 'rgba(239, 68, 68, 0.3)',
				borderWidth: 1,
				callbacks: {
					label: (ctx: any) => `Terminal Issues: ${ctx.parsed.y}`,
				},
			},
		},
		onClick: (event: any, elements: any[]) => {
			if (elements && elements.length > 0) {
				const elementIndex = elements[0].index;
				if (elementIndex !== undefined && terminalVisibleLabels[elementIndex]) {
					handleTerminalDateClick(terminalVisibleLabels[elementIndex]);
				}
			}
		},
		maintainAspectRatio: false,
		scales: {
			y: { 
				beginAtZero: true,
				grid: {
					color: 'rgba(0, 0, 0, 0.05)',
				},
				ticks: {
					color: '#64748b',
					font: {
						size: 12,
					},
				},
			},
			x: {
				grid: {
					color: 'rgba(0, 0, 0, 0.05)',
				},
				ticks: {
					color: '#64748b',
					font: {
						size: 12,
					},
				},
			},
		}
	} as const;

	// ---------- Leaderboards: top merchants by interactions/issues ----------
	const leaderboards = useMemo(() => {
		const byMerchant = merchants.map(m => {
			const logs = m.supportLogs || [];
			const interactions = logs.length;
			const distinctCategorySet = new Set<string>();
			logs.forEach(l => {
				const raw = (l.category || '').trim();
				if (raw === '') {
					distinctCategorySet.add('Uncategorized');
				} else {
					// Split categories by comma and add each one
					const categories = splitAndNormalizeCategories(raw);
					categories.forEach(cat => {
						// Use normalized name to avoid duplicates
						const normalizedKey = normalizeCategoryName(cat);
						distinctCategorySet.add(normalizedKey);
					});
				}
			});
			const distinctCategories = distinctCategorySet.size;
			return {
				name: m.name,
				storeId: m.storeId || '',
				interactions,
				distinctCategories,
			};
		});
		const topInteractions = byMerchant.slice().sort((a, b) => b.interactions - a.interactions).slice(0, 10);
		const topIssues = byMerchant.slice().sort((a, b) => b.distinctCategories - a.distinctCategories).slice(0, 10);
		const grandTotalInteractions = byMerchant.reduce((s, m) => s + m.interactions, 0);
		const grandTotalDistinctCategories = byMerchant.reduce((s, m) => s + m.distinctCategories, 0);
		return { topInteractions, topIssues, grandTotalInteractions, grandTotalDistinctCategories };
	}, [merchants]);

	return (
		<div className="dashboard-container">
			{!isFullscreen && !isAuthenticated && (
				<div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: '1.5rem' }}>
					<button
						onClick={() => navigate(isViewPage ? '/views/dashboard/fullscreen' : '/dashboard/fullscreen')}
						style={{
							padding: '0.5rem 1rem',
							border: '1px solid #e5e7eb',
							borderRadius: '6px',
							background: '#fff',
							color: '#1e293b',
							fontSize: '0.875rem',
							fontWeight: 500,
							cursor: 'pointer',
							display: 'flex',
							alignItems: 'center',
							gap: '0.5rem',
							transition: 'all 0.2s',
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.background = '#f8fafc';
							e.currentTarget.style.borderColor = '#FFB300';
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.background = '#fff';
							e.currentTarget.style.borderColor = '#e5e7eb';
						}}
						title="Open Dashboard in Fullscreen"
					>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
						</svg>
						Open
					</button>
				</div>
			)}
			<h2>Category Distribution</h2>
			<div className="chart-wrapper chart-wrapper-pie-category">
				{labels.length === 0 ? (
					<div className="empty-state">Không có dữ liệu category.</div>
				) : (
					<Pie data={data} options={options} />
				)}
			</div>

			<h2>Interactions Over Time</h2>
			<div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
				<select value={range} onChange={e => {
					setRange(e.target.value as any);
					setInteractionsChartIndex(0); // Reset to start when range changes
				}}>
					<option value="day">Day</option>
					<option value="week">Week</option>
					<option value="month">Month</option>
					<option value="year">Year</option>
				</select>
				{timeAgg.labels.length > MAX_VISIBLE_COLUMNS && (
					<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
						<button
							onClick={() => setInteractionsChartIndex(Math.max(0, interactionsChartIndex - MAX_VISIBLE_COLUMNS))}
							disabled={!canScrollInteractionsLeft}
							style={{
								padding: '0.5rem 1rem',
								border: '1px solid #e5e7eb',
								borderRadius: '6px',
								background: canScrollInteractionsLeft ? '#fff' : '#f3f4f6',
								color: canScrollInteractionsLeft ? '#1e293b' : '#9ca3af',
								cursor: canScrollInteractionsLeft ? 'pointer' : 'not-allowed',
								fontSize: '1.25rem',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								minWidth: '40px',
							}}
							title="Previous"
						>
							←
						</button>
						<span style={{ fontSize: '0.875rem', color: '#64748b', minWidth: '120px', textAlign: 'center' }}>
							{interactionsStartIndex + 1}-{Math.min(interactionsEndIndex, timeAgg.labels.length)} / {timeAgg.labels.length}
						</span>
						<button
							onClick={() => setInteractionsChartIndex(Math.min(timeAgg.labels.length - MAX_VISIBLE_COLUMNS, interactionsChartIndex + MAX_VISIBLE_COLUMNS))}
							disabled={!canScrollInteractionsRight}
							style={{
								padding: '0.5rem 1rem',
								border: '1px solid #e5e7eb',
								borderRadius: '6px',
								background: canScrollInteractionsRight ? '#fff' : '#f3f4f6',
								color: canScrollInteractionsRight ? '#1e293b' : '#9ca3af',
								cursor: canScrollInteractionsRight ? 'pointer' : 'not-allowed',
								fontSize: '1.25rem',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								minWidth: '40px',
							}}
							title="Next"
						>
							→
						</button>
					</div>
				)}
			</div>
			<div className="chart-wrapper" style={{ height: 380, position: 'relative' }}>
				{timeAgg.labels.length === 0 ? (
					<div className="empty-state">Không có dữ liệu interactions.</div>
				) : (
					<Bar data={barData} options={barOptions} />
				)}
			</div>

			{/* MI Updated Status */}
			<h2>MI Updated Status</h2>
			<div className="chart-wrapper chart-wrapper-pie-category">
				{miUpdatedStats.total === 0 ? (
					<div className="empty-state">Không có dữ liệu merchant.</div>
				) : (
					<Pie data={miUpdatedData} options={miUpdatedOptions} />
				)}
			</div>

			{/* Terminal Issues Over Time */}
			<h2>Terminal Issues Over Time</h2>
			<div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
				<select value={terminalRange} onChange={e => {
					setTerminalRange(e.target.value as any);
					setTerminalChartIndex(0); // Reset to start when range changes
				}}>
					<option value="day">Day</option>
					<option value="week">Week</option>
					<option value="month">Month</option>
					<option value="year">Year</option>
				</select>
				{terminalTimeAgg.labels.length > MAX_VISIBLE_COLUMNS && (
					<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
						<button
							onClick={() => setTerminalChartIndex(Math.max(0, terminalChartIndex - MAX_VISIBLE_COLUMNS))}
							disabled={!canScrollTerminalLeft}
							style={{
								padding: '0.5rem 1rem',
								border: '1px solid #e5e7eb',
								borderRadius: '6px',
								background: canScrollTerminalLeft ? '#fff' : '#f3f4f6',
								color: canScrollTerminalLeft ? '#1e293b' : '#9ca3af',
								cursor: canScrollTerminalLeft ? 'pointer' : 'not-allowed',
								fontSize: '1.25rem',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								minWidth: '40px',
							}}
							title="Previous"
						>
							←
						</button>
						<span style={{ fontSize: '0.875rem', color: '#64748b', minWidth: '120px', textAlign: 'center' }}>
							{terminalStartIndex + 1}-{Math.min(terminalEndIndex, terminalTimeAgg.labels.length)} / {terminalTimeAgg.labels.length}
						</span>
						<button
							onClick={() => setTerminalChartIndex(Math.min(terminalTimeAgg.labels.length - MAX_VISIBLE_COLUMNS, terminalChartIndex + MAX_VISIBLE_COLUMNS))}
							disabled={!canScrollTerminalRight}
							style={{
								padding: '0.5rem 1rem',
								border: '1px solid #e5e7eb',
								borderRadius: '6px',
								background: canScrollTerminalRight ? '#fff' : '#f3f4f6',
								color: canScrollTerminalRight ? '#1e293b' : '#9ca3af',
								cursor: canScrollTerminalRight ? 'pointer' : 'not-allowed',
								fontSize: '1.25rem',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								minWidth: '40px',
							}}
							title="Next"
						>
							→
						</button>
					</div>
				)}
			</div>
			<div className="chart-wrapper" style={{ height: 380, position: 'relative' }}>
				{terminalTimeAgg.labels.length === 0 ? (
					<div className="empty-state">No terminal-related interactions found.</div>
				) : (
					<Line data={terminalLineData} options={terminalLineOptions} />
				)}
			</div>

			<div className="leaderboards">
				<div className="board">
					<h3>Top Merchants by Interactions</h3>
					<div style={{ height: 360, width: '100%', position: 'relative' }}>
						{leaderboards.topInteractions.length === 0 ? (
							<div className="empty-state">Không có dữ liệu.</div>
						) : (
							<Bar 
								data={{
									labels: leaderboards.topInteractions.map((m) => `${m.name}${m.storeId ? ` (${m.storeId})` : ''}`),
									datasets: [{
										label: 'Interactions',
										data: leaderboards.topInteractions.map(m => m.interactions),
										backgroundColor: leaderboards.topInteractions.map((_, i) => COLORS[i % COLORS.length]),
										borderColor: '#fff',
										borderWidth: 1,
										borderRadius: 4,
									}],
								}}
								options={{
									indexAxis: 'y',
									responsive: true,
									maintainAspectRatio: false,
									plugins: {
										legend: { 
											display: false,
										},
										tooltip: {
											backgroundColor: 'rgba(30, 41, 59, 0.95)',
											padding: 10,
											titleFont: {
												size: 13,
												weight: 600,
											},
											bodyFont: {
												size: 12,
											},
											cornerRadius: 8,
											borderColor: 'rgba(255, 179, 0, 0.3)',
											borderWidth: 1,
											callbacks: {
												label: (ctx: any) => {
													const value = ctx.parsed.x || 0;
													const totalVal = leaderboards.grandTotalInteractions || 0;
													const pct = totalVal > 0 ? ((value / totalVal) * 100).toFixed(1) : '0.0';
													return `Interactions: ${value} (${pct}%)`;
												}
											}
										}
									},
									scales: {
										x: {
											beginAtZero: true,
											grid: {
												color: 'rgba(0, 0, 0, 0.05)',
											},
											ticks: {
												color: '#64748b',
												font: {
													size: 12,
												},
											},
										},
										y: {
											grid: {
												display: false,
											},
											ticks: {
												color: '#64748b',
												font: {
													size: 11,
												},
											},
										},
									}
								}}
							/>
						)}
					</div>
				</div>
				<div className="board">
					<h3>Top Merchants by Categories</h3>
					<div style={{ height: 360, width: '100%', position: 'relative' }}>
						{leaderboards.topIssues.length === 0 ? (
							<div className="empty-state">Không có dữ liệu.</div>
						) : (
							<Bar 
								data={{
									labels: leaderboards.topIssues.map((m) => `${m.name}${m.storeId ? ` (${m.storeId})` : ''}`),
									datasets: [{
										label: 'Distinct Categories',
										data: leaderboards.topIssues.map(m => m.distinctCategories),
										backgroundColor: leaderboards.topIssues.map((_, i) => COLORS[i % COLORS.length]),
										borderColor: '#fff',
										borderWidth: 1,
										borderRadius: 4,
									}],
								}}
								options={{
									indexAxis: 'y',
									responsive: true,
									maintainAspectRatio: false,
									plugins: {
										legend: { 
											display: false,
										},
										tooltip: {
											backgroundColor: 'rgba(30, 41, 59, 0.95)',
											padding: 10,
											titleFont: {
												size: 13,
												weight: 600,
											},
											bodyFont: {
												size: 12,
											},
											cornerRadius: 8,
											borderColor: 'rgba(255, 179, 0, 0.3)',
											borderWidth: 1,
											callbacks: {
												label: (ctx: any) => {
													const value = ctx.parsed.x || 0;
													const totalVal = leaderboards.grandTotalDistinctCategories || 0;
													const pct = totalVal > 0 ? ((value / totalVal) * 100).toFixed(1) : '0.0';
													return `Issues: ${value} (${pct}%)`;
												}
											}
										}
									},
									scales: {
										x: {
											beginAtZero: true,
											grid: {
												color: 'rgba(0, 0, 0, 0.05)',
											},
											ticks: {
												color: '#64748b',
												font: {
													size: 12,
												},
											},
										},
										y: {
											grid: {
												display: false,
											},
											ticks: {
												color: '#64748b',
												font: {
													size: 11,
												},
											},
										},
									}
								}}
							/>
						)}
					</div>
				</div>
			</div>

			{/* Category Logs Modal */}
			<Modal
				isOpen={!!selectedCategory && !isFullscreen}
				onClose={() => setSelectedCategory(null)}
				title={`Support Logs - Category: ${selectedCategory || ''}`}
				width="90%"
				maxWidth="800px"
				maxHeight="80vh"
			>
				{categoryLogs.length === 0 ? (
					<div className="category-logs-empty" style={{ textAlign: 'center', color: '#64748b', padding: '2rem', fontSize: '0.9375rem' }}>Không có support logs cho category này.</div>
				) : (
					<div className="category-logs-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
						{categoryLogs.map((item, index) => (
							<div key={index} className="category-log-item" style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1rem', transition: 'all 0.2s' }}>
								<div className="category-log-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '1rem' }}>
									<div className="category-log-merchant" style={{ flex: 1, fontSize: '1rem', color: '#1e293b' }}>
										<strong style={{ fontWeight: 600 }}>{item.merchant}</strong>
										{item.storeId && <span className="category-log-storeid" style={{ color: '#64748b', fontSize: '0.875rem', marginLeft: '0.5rem' }}>({item.storeId})</span>}
									</div>
									<div className="category-log-date-time" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem', fontSize: '0.875rem', color: '#64748b' }}>
										<span className="category-log-date" style={{ fontWeight: 500 }}>{item.log.date}</span>
										{item.log.time && <span className="category-log-time" style={{ fontSize: '0.8125rem' }}>{item.log.time}</span>}
									</div>
								</div>
								<div className="category-log-details" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9375rem', color: '#475569' }}>
									{item.log.supporter && (
										<div className="category-log-supporter" style={{ display: 'flex', gap: '0.5rem' }}>
											<strong style={{ color: '#1e293b', fontWeight: 600, minWidth: '80px' }}>Supporter:</strong> {item.log.supporter}
										</div>
									)}
									{item.log.issue && (
										<div className="category-log-issue" style={{ display: 'flex', gap: '0.5rem' }}>
											<strong style={{ color: '#1e293b', fontWeight: 600, minWidth: '80px' }}>Issue:</strong> {item.log.issue}
										</div>
									)}
								</div>
							</div>
						))}
					</div>
				)}
			</Modal>

			{/* MI Updated Merchants Modal */}
			<Modal
				isOpen={selectedMiUpdatedStatus !== null && !isFullscreen}
				onClose={() => {
					setSelectedMiUpdatedStatus(null);
					setMiUpdatedMerchants([]);
				}}
				title={`Merchants - ${selectedMiUpdatedStatus || 'MI Updated Status'}`}
				width="90%"
				maxWidth="1000px"
				maxHeight="80vh"
			>
				{miUpdatedMerchants.length === 0 ? (
					<div className="category-logs-empty" style={{ textAlign: 'center', color: '#64748b', padding: '2rem', fontSize: '0.9375rem' }}>
						No merchants found for category: {selectedMiUpdatedStatus || 'Unknown'}.
					</div>
				) : (
					<div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
						<div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
							<strong style={{ color: '#1e293b' }}>Tổng số: {miUpdatedMerchants.length} merchant(s)</strong>
						</div>
						<div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
							{miUpdatedMerchants.map((merchant, index) => (
								<div 
									key={merchant.id || index} 
									style={{ 
										background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)', 
										border: '1px solid #e5e7eb', 
										borderRadius: '12px', 
										padding: '1rem',
										transition: 'all 0.2s'
									}}
								>
									<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
										<div style={{ flex: 1 }}>
											<div style={{ fontSize: '1rem', color: '#1e293b', marginBottom: '0.5rem' }}>
												<strong style={{ fontWeight: 600 }}>{merchant.name}</strong>
												{merchant.storeId && (
													<span style={{ color: '#64748b', fontSize: '0.875rem', marginLeft: '0.5rem' }}>
														({merchant.storeId})
													</span>
												)}
											</div>
											{merchant.address && (
												<div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>
													📍 {merchant.address}
												</div>
											)}
											{merchant.phone && (
												<div style={{ fontSize: '0.875rem', color: '#64748b' }}>
													📞 {merchant.phone}
												</div>
											)}
										</div>
										<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
											<div
												style={{
													padding: '0.25rem 0.75rem',
													borderRadius: '6px',
													background: (() => {
														if (selectedMiUpdatedStatus === 'not updated yet') return '#fee2e2';
														return '#dcfce7';
													})(),
													color: (() => {
														if (selectedMiUpdatedStatus === 'not updated yet') return '#991b1b';
														return '#166534';
													})(),
													fontSize: '0.75rem',
													fontWeight: 600,
												}}
											>
												{selectedMiUpdatedStatus === 'not updated yet' ? '✗ Not Updated' : '✓ Updated'}
											</div>
											{merchant.supportLogs && merchant.supportLogs.length > 0 && (
												<div style={{ fontSize: '0.75rem', color: '#64748b' }}>
													{merchant.supportLogs.length} interaction(s)
												</div>
											)}
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				)}
			</Modal>

			{/* Terminal Logs Modal */}
			<Modal
				isOpen={!!selectedTerminalDate && !isFullscreen}
				onClose={() => {
					setSelectedTerminalDate(null);
					setTerminalLogs([]);
					setMerchantFrequency(new Map());
				}}
				title={`Terminal Issues Call Logs - ${selectedTerminalDate || ''}`}
				width="90%"
				maxWidth="900px"
				maxHeight="80vh"
			>
				{terminalLogs.length === 0 ? (
					<div className="category-logs-empty" style={{ textAlign: 'center', color: '#64748b', padding: '2rem', fontSize: '0.9375rem' }}>
						No terminal issues call logs for this date.
					</div>
				) : (
					<div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
						{/* Group logs by merchant */}
						{Array.from(new Set(terminalLogs.map(item => item.storeId || item.merchant))).map(merchantKey => {
							const merchantLogs = terminalLogs.filter(item => (item.storeId || item.merchant) === merchantKey);
							const firstLog = merchantLogs[0];
							const frequency = merchantFrequency.get(merchantKey);
							
							return (
								<div key={merchantKey} style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1rem', transition: 'all 0.2s' }}>
									{/* Merchant Header with Frequency Info */}
									<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>
										<div style={{ flex: 1 }}>
											<div style={{ fontSize: '1.1rem', color: '#1e293b', marginBottom: '0.5rem' }}>
												<strong style={{ fontWeight: 600 }}>{firstLog.merchant}</strong>
												{firstLog.storeId && (
													<span style={{ color: '#64748b', fontSize: '0.875rem', marginLeft: '0.5rem' }}>
														({firstLog.storeId})
													</span>
												)}
											</div>
											{/* Frequency Statistics */}
											{terminalRange === 'day' && frequency && (
												<div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.875rem', color: '#475569' }}>
													<div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
														<span style={{ fontWeight: 600, color: '#1e293b' }}>Today:</span>
														<span style={{ 
															padding: '0.125rem 0.5rem', 
															borderRadius: '4px', 
															background: '#fee2e2', 
															color: '#991b1b',
															fontWeight: 600
														}}>
															{frequency.todayCount} times
														</span>
													</div>
													<div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
														<span style={{ fontWeight: 600, color: '#1e293b' }}>Last 7 days:</span>
														<span style={{ color: '#64748b' }}>{frequency.last7DaysCount} times</span>
													</div>
													<div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
														<span style={{ fontWeight: 600, color: '#1e293b' }}>Last 30 days:</span>
														<span style={{ color: '#64748b' }}>{frequency.last30DaysCount} times</span>
													</div>
													{/* Trend Indicator */}
													{frequency.trend !== 'stable' && (
														<div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
															<span style={{ fontWeight: 600, color: '#1e293b' }}>Trend:</span>
															<span style={{ 
																padding: '0.125rem 0.5rem', 
																borderRadius: '4px', 
																background: frequency.trend === 'increase' ? '#fee2e2' : '#dcfce7',
																color: frequency.trend === 'increase' ? '#991b1b' : '#166534',
																fontWeight: 600,
																fontSize: '0.8125rem'
															}}>
																{frequency.trend === 'increase' ? '📈 Increase' : '📉 Decrease'}
															</span>
														</div>
													)}
												</div>
											)}
										</div>
									</div>
									
									{/* Logs for this merchant */}
									<div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
										{merchantLogs.map((item, index) => (
											<div key={index} style={{ 
												background: '#ffffff', 
												border: '1px solid #e5e7eb', 
												borderRadius: '8px', 
												padding: '0.75rem',
												marginLeft: '0.5rem'
											}}>
												<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', gap: '1rem' }}>
													<div style={{ flex: 1, fontSize: '0.9375rem', color: '#1e293b' }}>
														{item.log.issue && (
															<div style={{ marginBottom: '0.25rem', fontWeight: 500 }}>
																{item.log.issue}
															</div>
														)}
													</div>
													<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem', fontSize: '0.8125rem', color: '#64748b' }}>
														<span style={{ fontWeight: 500 }}>{item.log.date}</span>
														{item.log.time && <span>{item.log.time}</span>}
													</div>
												</div>
												<div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem', color: '#475569' }}>
													{item.log.supporter && (
														<div style={{ display: 'flex', gap: '0.5rem' }}>
															<strong style={{ color: '#1e293b', fontWeight: 600, minWidth: '80px' }}>Supporter:</strong> 
															<span>{item.log.supporter}</span>
														</div>
													)}
													{item.log.category && (
														<div style={{ display: 'flex', gap: '0.5rem' }}>
															<strong style={{ color: '#1e293b', fontWeight: 600, minWidth: '80px' }}>Category:</strong> 
															<span>{item.log.category}</span>
														</div>
													)}
												</div>
											</div>
										))}
									</div>
								</div>
							);
						})}
					</div>
				)}
			</Modal>
		</div>
	);
};

export default Dashboard;
