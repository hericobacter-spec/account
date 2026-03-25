'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.css';
import { CreditCard, AlertCircle, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState({
    totalBalance: 0,
    totalExpenses: 0,
    unpaidCount: 0,
    unpaidMembers: [],
    nextDueDate: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [membersRes, expensesRes] = await Promise.all([
          fetch('/api/members'),
          fetch('/api/expenses')
        ]);
        
        const members = await membersRes.json();
        const expenses = await expensesRes.json();

        let totalDuesPaid = 0;
        let unpaidCount = 0;
        let unpaidMembers = [];
        let earliestUnpaidDate = null;

        members.forEach(m => {
          let memberUnpaid = false;
          m.dues.forEach(d => {
            if (d.is_paid === 1) {
              totalDuesPaid += d.amount;
            } else {
              memberUnpaid = true;
              if (!earliestUnpaidDate || new Date(d.due_date) < new Date(earliestUnpaidDate)) {
                earliestUnpaidDate = d.due_date;
              }
            }
          });
          if (memberUnpaid) {
            unpaidCount++;
            unpaidMembers.push(m.name);
          }
        });

        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
        const totalBalance = totalDuesPaid - totalExpenses;

        setData({
          totalBalance,
          totalExpenses,
          unpaidCount,
          unpaidMembers,
          nextDueDate: earliestUnpaidDate
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) return <div className="fade-in">데이터를 불러오는 중입니다...</div>;

  return (
    <div className={`fade-in ${styles.dashboard}`}>
      <header className={styles.header}>
        <h2>대시보드 요약</h2>
        <p className="text-secondary">모임의 재무 현황을 한눈에 파악하세요.</p>
      </header>

      <div className={styles.grid}>
        <div className="glass-card">
          <div className={styles.cardHeader}>
            <div className={styles.iconBox} style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent-primary)' }}>
              <CreditCard size={24} />
            </div>
            <h3>총 잔액</h3>
          </div>
          <div className={styles.cardValue}>
            {data.totalBalance.toLocaleString()}<span>원</span>
          </div>
          <p className={styles.cardTrend}>
            <ArrowUpRight size={16} color="var(--success)" />
            총 지출: {data.totalExpenses.toLocaleString()}원
          </p>
        </div>

        <div className="glass-card">
          <div className={styles.cardHeader}>
            <div className={styles.iconBox} style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)' }}>
              <AlertCircle size={24} />
            </div>
            <h3>미납 인원</h3>
          </div>
          <div className={styles.cardValue}>
            {data.unpaidCount}<span>명</span>
          </div>
          <p className={styles.cardTrend}>
             미납자: {data.unpaidMembers.length > 0 ? data.unpaidMembers.join(', ') : '없음'}
          </p>
        </div>

        <div className="glass-card">
          <div className={styles.cardHeader}>
            <div className={styles.iconBox} style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)' }}>
              <Calendar size={24} />
            </div>
            <h3>가장 빠른 납부 마감일</h3>
          </div>
          <div className={styles.cardValue}>
            {data.nextDueDate ? new Date(data.nextDueDate).toLocaleDateString() : '마감일 없음'}
          </div>
          <p className={styles.cardTrend}>
            {data.nextDueDate ? '기한 내에 모두 납부해주세요.' : '모든 회비가 납부되었습니다.'}
          </p>
        </div>
      </div>

      <section className={styles.recentSection}>
        <h3>미납자 알림 관리</h3>
        <div className="card">
          {data.unpaidMembers.length > 0 ? (
            <div className={styles.unpaidList}>
              <p>아직 회비를 납부하지 않은 멤버가 있습니다. 입금 요청을 진행하세요.</p>
              <button 
                className="btn btn-primary"
                onClick={() => alert('미납자들에게 입금 요청 알림을 발송했습니다. (기능 연동 필요)')}
              >
                알림 발송하기
              </button>
            </div>
          ) : (
            <p className={styles.allPaid}>🎉 모든 멤버가 회비를 납부했습니다!</p>
          )}
        </div>
      </section>
    </div>
  );
}
