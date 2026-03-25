'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PieChart as PieIcon, BarChart3, TrendingUp } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e'];

export default function AnalyticsPage() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchExpenses() {
      try {
        const res = await fetch('/api/expenses');
        const data = await res.json();
        if (Array.isArray(data)) {
          setExpenses(data);
        } else {
          console.error('API returns non-array:', data);
          setExpenses([]);
        }
      } catch (err) {
        console.error(err);
        setExpenses([]);
      } finally {
        setLoading(false);
      }
    }
    fetchExpenses();
  }, []);

  if (loading) return <div className="fade-in">데이터를 불러오는 중입니다...</div>;

  // Process data for charts
  const purposeMap = {};
  const dateMap = {};

  expenses.forEach(e => {
    purposeMap[e.purpose] = (purposeMap[e.purpose] || 0) + e.amount;
    
    // Group by month-year for date chart (e.g. "2023-10")
    if (e.expense_date) {
      const month = e.expense_date.substring(0, 7);
      dateMap[month] = (dateMap[month] || 0) + e.amount;
    }
  });

  const purposeData = Object.keys(purposeMap)
    .map(key => ({ name: key, value: purposeMap[key] }))
    .sort((a, b) => b.value - a.value);

  const dateData = Object.keys(dateMap)
    .map(key => ({ date: key, amount: dateMap[key] }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className={`fade-in ${styles.analyticsPage}`}>
      <header className={styles.header}>
        <h2>통계 분석</h2>
        <p className="text-secondary">모임의 재무 데이터를 차트와 그래프로 시각화하여 파악하세요.</p>
      </header>

      {expenses.length === 0 ? (
        <div className={styles.emptyState}>
          <TrendingUp size={48} color="var(--text-secondary)" />
          <p>분석할 지출 데이터가 없습니다. 먼저 지출 내역을 등록해주세요.</p>
        </div>
      ) : (
        <div className={styles.chartsGrid}>
          <div className={`glass-card ${styles.chartCard}`}>
            <div className={styles.chartHeader}>
              <PieIcon size={20} className="text-secondary" />
              <h3>목적별 지출 분포</h3>
            </div>
            <div className={styles.chartWrapper}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={purposeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {purposeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value.toLocaleString()}원`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={`glass-card ${styles.chartCard}`}>
            <div className={styles.chartHeader}>
              <BarChart3 size={20} className="text-secondary" />
              <h3>월별 지출 추이</h3>
            </div>
            <div className={styles.chartWrapper}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dateData}>
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={(val) => `${val / 10000}만`} />
                  <Tooltip cursor={{fill: 'var(--bg-color)'}} formatter={(value) => [`${value.toLocaleString()}원`, '지출']} />
                  <Bar dataKey="amount" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
