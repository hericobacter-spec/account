'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';
import { UserPlus, CheckCircle, Circle, Trash2 } from 'lucide-react';

export default function MembersPage() {
  const [members, setMembers] = useState([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [loading, setLoading] = useState(true);

  // New Due State for a specific member
  const [dueAmount, setDueAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [activeMemberId, setActiveMemberId] = useState(null);

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/members');
      const data = await res.json();
      setMembers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    try {
      await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newMemberName })
      });
      setNewMemberName('');
      fetchMembers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTogglePayment = async (due) => {
    try {
      await fetch('/api/dues', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: due.id, is_paid: !due.is_paid })
      });
      fetchMembers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddDue = async (e) => {
    e.preventDefault();
    if (!activeMemberId || !dueAmount || !dueDate) return;

    try {
      await fetch('/api/dues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: activeMemberId, amount: Number(dueAmount), due_date: dueDate })
      });
      setDueAmount('');
      setDueDate('');
      setActiveMemberId(null);
      fetchMembers();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="fade-in">데이터를 불러오는 중입니다...</div>;

  return (
    <div className={`fade-in ${styles.membersPage}`}>
      <header className={styles.header}>
        <h2>회원 관리</h2>
        <p className="text-secondary">멤버를 등록하고 회비 납입 현황을 확인하세요.</p>
      </header>

      <div className={styles.topSection}>
        <div className="glass-card">
          <h3>신규 멤버 추가</h3>
          <form onSubmit={handleAddMember} className={styles.addForm}>
            <input 
              type="text" 
              placeholder="멤버 이름" 
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              className={styles.input}
              required
            />
            <button type="submit" className="btn btn-primary">
              <UserPlus size={18} /> 추가하기
            </button>
          </form>
        </div>
      </div>

      <div className={styles.listSection}>
        <h3>전체 멤버 목록 ({members.length}명)</h3>
        
        <div className={styles.memberGrid}>
          {members.map(member => (
            <div key={member.id} className={`card ${styles.memberCard}`}>
              <div className={styles.memberHeader}>
                <h4>{member.name}</h4>
                <div className={styles.statusBadge} data-unpaid={member.unpaidCount > 0}>
                  {member.unpaidCount > 0 ? `${member.unpaidCount}건 미납` : '완납'}
                </div>
              </div>
              
              <div className={styles.duesSummary}>
                <div className={styles.summaryRow}>
                  <span>청구된 총액:</span>
                  <strong>{member.totalAmount.toLocaleString()}원</strong>
                </div>
                <div className={styles.summaryRow}>
                  <span>납입 완료:</span>
                  <strong style={{ color: 'var(--success)' }}>{member.paidAmount.toLocaleString()}원</strong>
                </div>
                <div className={styles.summaryRow}>
                  <span>미납 금액:</span>
                  <strong style={{ color: 'var(--danger)' }}>{(member.totalAmount - member.paidAmount).toLocaleString()}원</strong>
                </div>
              </div>

              <div className={styles.duesList}>
                {member.dues.length === 0 && <p className={styles.emptyDues}>등록된 회비가 없습니다.</p>}
                {member.dues.map(due => (
                  <div key={due.id} className={styles.dueItem}>
                    <div className={styles.dueInfo}>
                      <span>{due.amount.toLocaleString()}원</span>
                      <small className="text-secondary">{due.due_date} 마감</small>
                    </div>
                    <button 
                      onClick={() => handleTogglePayment(due)}
                      className={`${styles.toggleBtn} ${due.is_paid ? styles.paid : styles.unpaid}`}
                    >
                      {due.is_paid ? <CheckCircle size={20} /> : <Circle size={20} />}
                      {due.is_paid ? '입금완료' : '미입금'}
                    </button>
                  </div>
                ))}
              </div>

              {activeMemberId !== member.id ? (
                <button 
                  className={`btn btn-secondary ${styles.addDueBtn}`}
                  onClick={() => setActiveMemberId(member.id)}
                >
                  + 회비 청구
                </button>
              ) : (
                <form onSubmit={handleAddDue} className={styles.dueForm}>
                  <input 
                    type="number" 
                    placeholder="금액 (원)" 
                    value={dueAmount}
                    onChange={(e) => setDueAmount(e.target.value)}
                    required 
                  />
                  <input 
                    type="date" 
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required 
                  />
                  <div className={styles.dueFormActions}>
                    <button type="button" className="btn btn-secondary" onClick={() => setActiveMemberId(null)}>취소</button>
                    <button type="submit" className="btn btn-primary">청구</button>
                  </div>
                </form>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
