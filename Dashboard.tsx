
import React, { useState } from 'react';
import type { AnalysisResult } from '../types';
import { exportDataAsCSV } from '../utils/export';
import InsightsPanel from './InsightsPanel';
import DataTable from './DataTable';
import VisualizationPanel from './VisualizationPanel';
import { Download, RotateCcw, MessageSquare, BarChart, Table } from 'lucide-react';

interface DashboardProps {
  result: AnalysisResult;
  onReset: () => void;
  onChatSubmit: (message: string) => void;
}

type ActiveTab = 'insights' | 'data' | 'visuals';

const Dashboard: React.FC<DashboardProps> = ({ result, onReset, onChatSubmit }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('insights');

  const TABS: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'insights', label: 'AI Insights & Chat', icon: <MessageSquare className="w-4 h-4 mr-2" /> },
    { id: 'data', label: 'Data Table', icon: <Table className="w-4 h-4 mr-2" /> },
    { id: 'visuals', label: 'Visualization', icon: <BarChart className="w-4 h-4 mr-2" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Analysis for <span className="text-primary-600">{result.fileName}</span></h2>
          <p className="text-sm text-gray-500 mt-1">{result.cleanedData.length} rows of cleaned data.</p>
        </div>
        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          <button onClick={() => exportDataAsCSV(result.cleanedData, result.fileName)} className="flex items-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg text-sm transition-colors">
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </button>
          <button onClick={onReset} className="flex items-center bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors">
            <RotateCcw className="w-4 h-4 mr-2" /> New Analysis
          </button>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div>
        {activeTab === 'insights' && <InsightsPanel insights={result.insights} chatHistory={result.chatHistory} onChatSubmit={onChatSubmit} />}
        {activeTab === 'data' && <DataTable data={result.cleanedData} />}
        {activeTab === 'visuals' && <VisualizationPanel data={result.cleanedData} />}
      </div>
    </div>
  );
};

export default Dashboard;
