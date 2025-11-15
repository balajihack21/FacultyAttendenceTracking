import React, { useState } from 'react';
import { Settings as SettingsIcon, Wrench, Calendar, Gift, Undo2 } from 'lucide-react';
import MonthlyActions from './MonthlyActions';
import LopReversal from './LopReversal';
import GeneralSettings from './GeneralSettings';
import HolidayManagement from './HolidayManagement';

type ActiveTab = 'general' | 'holidays' | 'monthly' | 'lop';

const SettingsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('general');

    const TabButton: React.FC<{
        tabName: ActiveTab;
        children: React.ReactNode;
      }> = ({ tabName, children }) => (
        <button
          onClick={() => setActiveTab(tabName)}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === tabName
              ? 'bg-highlight text-primary dark:bg-teal-500 dark:text-gray-100'
              : 'text-text-secondary hover:bg-accent hover:text-text-primary dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200'
          }`}
        >
          {children}
        </button>
      );

    const renderContent = () => {
        switch(activeTab) {
            case 'general':
                return <GeneralSettings />;
            case 'holidays':
                return <HolidayManagement />;
            case 'monthly':
                return <MonthlyActions />;
            case 'lop':
                return <LopReversal />;
            default:
                return null;
        }
    }

    const tabTitles: { [key in ActiveTab]: string } = {
        general: 'General Settings',
        holidays: 'Holiday Management',
        monthly: 'Monthly Actions',
        lop: 'LOP Reversal Tool',
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="bg-secondary p-6 rounded-lg shadow-xl dark:bg-gray-800">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-semibold text-highlight dark:text-teal-300 flex items-center gap-2">
                           <SettingsIcon size={24} /> Application Settings
                        </h2>
                        <p className="mt-1 text-text-secondary dark:text-gray-400">
                            {tabTitles[activeTab]}
                        </p>
                    </div>
                    <nav className="w-full sm:w-auto flex flex-wrap items-center gap-2 bg-primary dark:bg-gray-900/50 p-1 rounded-lg">
                        <TabButton tabName="general"><Wrench size={16}/> General</TabButton>
                        <TabButton tabName="holidays"><Calendar size={16}/> Holidays</TabButton>
                        <TabButton tabName="monthly"><Gift size={16}/> Monthly Actions</TabButton>
                        <TabButton tabName="lop"><Undo2 size={16}/> LOP Reversal</TabButton>
                    </nav>
                </div>
                
                <div className="border-t border-accent dark:border-gray-700 pt-6">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;