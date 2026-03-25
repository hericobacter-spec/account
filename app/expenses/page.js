'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './page.module.css';
import { Camera, Plus, FileText, Upload, RefreshCw, XCircle, X, Image as ImageIcon } from 'lucide-react';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    purpose: '',
    vendor: '',
    items: '',
    amount: '',
    receipt_image: null
  });

  const [ocrLoading, setOcrLoading] = useState(false);
  const ocrInputRef = useRef(null);
  const basicInputRef = useRef(null);
  const [showForm, setShowForm] = useState(false);
  const [showModal, setShowModal] = useState(null);

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

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target.result;
        img.onload = () => {
          const MAX_WIDTH = 800; // Good enough for receipt reading but small enough for text columns
          let width = img.width;
          let height = img.height;
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
      };
    });
  };

  const handleOcrUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setOcrLoading(true);
    
    // Save image locally right away using client-side compression
    const base64 = await compressImage(file);
    setFormData(prev => ({ ...prev, receipt_image: base64 }));

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
          vendor: data.vendor ? data.vendor : prev.vendor,
          receipt_image: base64
        }));
        alert('영수증 인식이 완료되었습니다. 금액과 사용처를 확인해주세요.');
      } else {
        alert('영수증에서 금액이나 사용처를 인식하지 못했습니다. 수동으로 직접 입력해주세요.');
      }
    } catch (err) {
      console.error(err);
      alert('OCR 처리 중 오류가 발생했습니다: ' + err.message);
    } finally {
      setOcrLoading(false);
      if (ocrInputRef.current) ocrInputRef.current.value = '';
    }
  };

  const handleBasicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Save image locally without OCR processing
    const base64 = await compressImage(file);
    setFormData(prev => ({ ...prev, receipt_image: base64 }));
    
    if (basicInputRef.current) basicInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.date || !formData.purpose || !formData.amount) return;

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, amount: Number(formData.amount) })
      });
      
      const resData = await res.json();
      
      if (!res.ok) {
        throw new Error(resData.error || '서버 저장 중 오류가 발생했습니다.');
      }
      
      console.log('Expense saved:', resData);
      
      setFormData({
        date: new Date().toISOString().split('T')[0],
        purpose: '',
        vendor: '',
        items: '',
        amount: '',
        receipt_image: null
      });
      setShowForm(false);
      
      // Wait a moment for consistency in case of async replication
      setTimeout(() => {
        fetchExpenses();
      }, 500);
      
      alert('성공적으로 저장되었습니다.');
    } catch (err) {
      console.error('Submit handle error:', err);
      alert('저장 실패: ' + err.message);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!confirm('이 지출 내역을 정말로 삭제하시겠습니까?')) return;

    try {
      const res = await fetch(`/api/expenses?id=${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchExpenses();
      } else {
        const errorData = await res.json();
        alert('삭제 실패: ' + (errorData.error || '알 수 없는 오류'));
      }
    } catch (err) {
      console.error(err);
      alert('삭제 도중 통신 오류가 발생했습니다.');
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
              <ImageIcon size={20} className={styles.ocrIcon}/> 
              <span>증빙 자료 첨부 방식 선택</span>
            </div>
            
            <input 
              type="file" 
              accept="image/*" 
              ref={ocrInputRef} 
              onChange={handleOcrUpload} 
              style={{ display: 'none' }}
            />
            <input 
              type="file" 
              accept="image/*" 
              ref={basicInputRef} 
              onChange={handleBasicUpload} 
              style={{ display: 'none' }}
            />

            {!formData.receipt_image ? (
              <div className={styles.uploadOptions}>
                <div 
                  className={`${styles.uploadCard} ${ocrLoading ? styles.disabled : ''}`} 
                  onClick={() => !ocrLoading && ocrInputRef.current?.click()}
                >
                  <div className={styles.uploadIcon}>
                    {ocrLoading ? <RefreshCw size={24} className={styles.spin} /> : <Camera size={24} />}
                  </div>
                  <strong>영수증 자동 인식 (OCR)</strong>
                  <p>{ocrLoading ? '이미지를 분석하는 중입니다...' : '사진을 분석하여 금액과 상호명을 자동 입력합니다.'}</p>
                </div>

                <div 
                  className={`${styles.uploadCard} ${ocrLoading ? styles.disabled : ''}`} 
                  onClick={() => !ocrLoading && basicInputRef.current?.click()}
                >
                  <div className={`${styles.uploadIcon} ${styles.basic}`}>
                    <Upload size={24} />
                  </div>
                  <strong>일반 영수증 첨부</strong>
                  <p>자동 분석을 생략하고 영수증 사진만 단순 증빙 자료로 첨부합니다.</p>
                </div>
              </div>
            ) : (
              <div className={styles.previewContainer}>
                <div style={{marginBottom: '0.75rem', fontSize:'0.875rem', color: 'var(--success)', fontWeight: '600'}}>
                  ✓ 첨부가 완료되었습니다. (하단에 상세 내역을 입력하세요)
                </div>
                <img src={formData.receipt_image} alt="Receipt Preview" className={styles.previewImage} />
                <button type="button" className={styles.removeImageBtn} onClick={() => setFormData(prev => ({...prev, receipt_image: null}))}>
                  <X size={14} />
                </button>
              </div>
            )}
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
                  <th className={styles.centerCol}>영수증</th>
                  <th className={styles.amountCol}>금액</th>
                  <th></th>
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
                    <td className={styles.centerCol}>
                      {expense.receipt_image && (
                        <button 
                          className={styles.viewReceiptBtn}
                          onClick={() => setShowModal(expense.receipt_image)}
                        >
                          <ImageIcon size={14} /> 보기
                        </button>
                      )}
                    </td>
                    <td className={styles.amountCol}>
                      <strong>{expense.amount.toLocaleString()}원</strong>
                    </td>
                    <td>
                      <div className={styles.actionCell}>
                        <button 
                          className={styles.deleteBtn}
                          onClick={() => handleDeleteExpense(expense.id)}
                          title="삭제"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(null)}>
          <button className={styles.closeModalBtn} onClick={() => setShowModal(null)}>
            <X size={24} />
          </button>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <img src={showModal} alt="Receipt Full" />
          </div>
        </div>
      )}
    </div>
  );
}
