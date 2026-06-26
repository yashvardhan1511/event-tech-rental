import React from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

interface LayoutProps {
  children: React.ReactNode;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  title: string;
}

const Layout: React.FC<LayoutProps> = ({ children, currentTab, setCurrentTab, title }) => {
  return (
    <div className="flex h-screen w-screen bg-slate-50 overflow-hidden text-slate-900">
      {/* Role-aware Sidebar */}
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Primary Page Canvas */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-gradient-to-b from-indigo-50/30 to-slate-50">
        <Navbar title={title} />

        {/* Workspace Canvas scroll container */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
