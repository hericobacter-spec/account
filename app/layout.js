import './globals.css';
import Sidebar from '@/components/Sidebar';

export const metadata = {
  title: '모임통장 - Group Expense Tracker',
  description: 'Minimalist dashboard to manage group expenses and members.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        <div className="app-container">
          <Sidebar />
          <main className="main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
