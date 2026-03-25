'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Receipt, PieChart, Printer, Download } from 'lucide-react';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { label: '대시보드', href: '/', icon: <Home size={20} /> },
    { label: '회원 관리', href: '/members', icon: <Users size={20} /> },
    { label: '지출 내역', href: '/expenses', icon: <Receipt size={20} /> },
    { label: '통계 분석', href: '/analytics', icon: <PieChart size={20} /> },
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <aside className={`${styles.sidebar} no-print`}>
      <div className={styles.logo}>
        <div className={styles.iconWrapper}>💳</div>
        <h1>모임통장</h1>
      </div>

      <nav className={styles.nav}>
        <ul>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link href={item.href} className={`${styles.link} ${isActive ? styles.active : ''}`}>
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className={styles.bottomActions}>
        <button className={styles.actionBtn} onClick={handlePrint}>
          <Printer size={18} />
          <span>화면 인쇄</span>
        </button>
        <a href="/api/export" className={styles.actionBtn} download>
          <Download size={18} />
          <span>엑셀 다운로드</span>
        </a>
      </div>
    </aside>
  );
}
