'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './page.module.css';
import { Camera, Plus, FileText, Upload, RefreshCw, XCircle } from 'lucide-react';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    purpose: '',
    vendor: '',
    items: '',
    amount: ''
  });

  const [ocrLoading, setOcrLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [showForm, setShowForm] = useState(false);

  const fetchExpenses = async () => {
    try {
      const res = await fetch('/api/expenses');
      const data = await res.json();
      if (Array.isArray(data)) {
        setExpenses(data);
      } else {
        console.error('API returns non-array:', data);
        alert('데이터를 불러올 수 없습니다: /api/setup 페이지에 먼저 접속해 DB가 생성됐는지 확인해주세요. (' + (data.error || '알 수 없는 구조') + ')');
        setExpenses([]);
      }
    } catch (err) {
      console.error(err);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOcrUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setOcrLoading(true);
    const formDataPayload = new FormData();
    formDataPayload.append('image', file);

    try {
      const res = await fetch('/api/ocr', {
        method: 'POST',
        body: formDataPayload
      });
      const data = await res.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      if (data.amount || data.vendor) {
        setFormData(prev => ({
          ...prev,
          amount: data.amount ? String(data.amount) : prev.amount,
          vendor: data.vendor ? data.vendor : prev.vendor
        }));
        alert('영수증 인식이 완료되었습니다. 금액과 사용처를 확인해주세요.');
      } else {
        alert('영수증에서 금액이나 사용처를 인식하지 못했습니다. 수동으로 입력해주세요.');
      }
    } catch (err) {
      console.error(err);
      alert('OCR 처리 중 오류가 발생했습니다: ' + err.message);
    } finally {
      setOcrLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.date || !formData.purpose || !formData.amount) return;

    try {
      await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, amount: Number(formData.amount) })
      });
      
      setFormData({
        date: new Date().toISOString().split('T')[0],
        purpose: '',
        vendor: '',
        items: '',
        amount: ''
      });
      setShowForm(false);
      fetchExpenses();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="fade-in">데이터를 불러오는 중입니다...</div>;

  return (
    <div className={`fade-in ${styles.expensesPage}`}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <h2>지출 관리</h2>
          <button 
            className="btn btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? <><XCircle size={18} /> 닫기</> : <><Plus size={18} /> 지출 등록</>}
          </button>
        </div>
        <p className="text-secondary">영수증을 촬영하거나 업로드하여 지출 내역을 간편하게 기록하세요.</p>
      </header>

      {showForm && (
        <div className={`glass-card fade-in ${styles.formContainer}`}>
          <div className={styles.ocrSection}>
            <div className={styles.ocrLabel}>
              <Camera size={20} className={styles.ocrIcon}/> 
              <span>영수증 자동 인식 (OCR)</span>
            </div>
            <p className={styles.ocrDesc}>영수증 이미지를 업로드하면 금액과 사용처가 자동으로 입력됩니다.</p>
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              onChange={handleOcrUpload} 
              style={{ display: 'none' }}
            />
            <button 
              type="button" 
              className={`btn btn-secondary ${styles.ocrBtn}`}
              onClick={() => fileInputRef.current?.click()}
              disabled={ocrLoading}
            >
              {ocrLoading ? <RefreshCw size={18} className={styles.spin} /> : <Upload size={18} />}
              {ocrLoading ? '분석 중...' : '영수증 이미지 업로드'}
            </button>
          </div>

          <form onSubmit={handleSubmit} className={styles.expenseForm}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>날짜 *</label>
                <input type="date" name="date" value={formData.date} onChange={handleInputChange} required />
              </div>
              <div className={styles.formGroup}>
                <label>지출 목적 * (예: 식대, 부대비용)</label>
                <input type="text" name="purpose" value={formData.purpose} onChange={handleInputChange} required />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>사용처 (예: 스타벅스)</label>
                <input type="text" name="vendor" value={formData.vendor} onChange={handleInputChange} />
              </div>
              <div className={styles.formGroup}>
                <label>결제 금액 *</label>
                <input type="number" name="amount" value={formData.amount} onChange={handleInputChange} required />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>상세 내역 (선택)</label>
              <textarea 
                name="items" 
                value={formData.items} 
                onChange={handleInputChange} 
                rows="2"
                placeholder="구매한 물품이나 상세 내용을 입력하세요."
              />
            </div>

            <div className={styles.formActions}>
              <button type="submit" className="btn btn-primary">저장하기</button>
            </div>
          </form>
        </div>
      )}

      <div className={styles.listSection}>
        <h3>지출 내역 목록</h3>
        
        {expenses.length === 0 ? (
          <div className={styles.emptyState}>
            <FileText size={48} color="var(--text-secondary)" />
            <p>등록된 지출 내역이 없습니다.</p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>날짜</th>
                  <th>목적</th>
                  <th>사용처 / 내역</th>
                  <th className={styles.amountCol}>금액</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(expense => (
                  <tr key={expense.id}>
                    <td>{expense.date}</td>
                    <td>
                      <span className={styles.purposeBadge}>{expense.purpose}</span>
                    </td>
                    <td>
                      <div className={styles.vendorInfo}>
                        <strong>{expense.vendor || '미지정'}</strong>
                        {expense.items && <span className={styles.expenseItems}>{expense.items}</span>}
                      </div>
                    </td>
                    <td className={styles.amountCol}>
                      <strong>{expense.amount.toLocaleString()}원</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
