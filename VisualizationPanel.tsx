
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { TableRow } from '../types';

interface VisualizationPanelProps {
  data: TableRow[];
}

type ChartType = 'bar' | 'line' | 'histogram';

const VisualizationPanel: React.FC<VisualizationPanelProps> = ({ data }) => {
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [xAxisKey, setXAxisKey] = useState<string>('');
  const [yAxisKey, setYAxisKey] = useState<string>('');
  const [binCount, setBinCount] = useState(10);

  const { numericKeys, categoricalKeys } = useMemo(() => {
    if (data.length === 0) return { numericKeys: [], categoricalKeys: [] };
    const keys = Object.keys(data[0]);
    const numeric: string[] = [];
    const categorical: string[] = [];
    keys.forEach(key => {
      if (data.every(row => typeof row[key] === 'number')) {
        numeric.push(key);
      } else {
        categorical.push(key);
      }
    });
    return { numericKeys: numeric, categoricalKeys: categorical };
  }, [data]);

  const chartData = useMemo(() => {
    if (chartType === 'histogram' && xAxisKey) {
        const values = data.map(row => row[xAxisKey] as number).filter(v => v != null);
        if(values.length === 0) return [];
        
        const min = Math.min(...values);
        const max = Math.max(...values);
        const binWidth = (max - min) / binCount;
        
        const bins = Array.from({ length: binCount }, (_, i) => ({
            range: `${(min + i * binWidth).toFixed(2)}-${(min + (i + 1) * binWidth).toFixed(2)}`,
            count: 0
        }));

        values.forEach(value => {
            let binIndex = Math.floor((value - min) / binWidth);
            if(binIndex === binCount) binIndex--; // Include max value in the last bin
            if (bins[binIndex]) {
               bins[binIndex].count++;
            }
        });
        return bins;
    }
    return data;
  }, [data, chartType, xAxisKey, binCount]);

  const renderChart = () => {
    if (chartType === 'bar' && xAxisKey && yAxisKey) {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey={yAxisKey} fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      );
    }
    if (chartType === 'line' && xAxisKey && yAxisKey) {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey={yAxisKey} stroke="#3b82f6" activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      );
    }
     if (chartType === 'histogram' && xAxisKey) {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="range" angle={-45} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      );
    }
    return <div className="text-center text-gray-500 h-96 flex items-center justify-center">Please select columns to generate a chart.</div>;
  };

  const getSelectOptions = (keys: string[]) => keys.map(key => <option key={key} value={key}>{key}</option>);
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Visualize Data</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div>
          <label htmlFor="chartType" className="block text-sm font-medium text-gray-700">Chart Type</label>
          <select id="chartType" value={chartType} onChange={e => setChartType(e.target.value as ChartType)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md">
            <option value="bar">Bar Chart</option>
            <option value="line">Line Chart</option>
            <option value="histogram">Histogram</option>
          </select>
        </div>
        
        {chartType !== 'histogram' ? (
          <>
            <div>
              <label htmlFor="xAxisKey" className="block text-sm font-medium text-gray-700">X-Axis (Category)</label>
              <select id="xAxisKey" value={xAxisKey} onChange={e => setXAxisKey(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md">
                <option value="">Select...</option>
                {getSelectOptions(categoricalKeys)}
              </select>
            </div>
            <div>
              <label htmlFor="yAxisKey" className="block text-sm font-medium text-gray-700">Y-Axis (Value)</label>
              <select id="yAxisKey" value={yAxisKey} onChange={e => setYAxisKey(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md">
                <option value="">Select...</option>
                {getSelectOptions(numericKeys)}
              </select>
            </div>
          </>
        ) : (
          <>
            <div>
              <label htmlFor="histKey" className="block text-sm font-medium text-gray-700">Column (Numeric)</label>
              <select id="histKey" value={xAxisKey} onChange={e => setXAxisKey(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md">
                <option value="">Select...</option>
                {getSelectOptions(numericKeys)}
              </select>
            </div>
             <div>
              <label htmlFor="binCount" className="block text-sm font-medium text-gray-700">Number of Bins</label>
              <input type="range" id="binCount" min="5" max="20" value={binCount} onChange={e => setBinCount(Number(e.target.value))} className="mt-2 w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
              <span className="text-sm text-gray-500">{binCount} bins</span>
            </div>
          </>
        )}
      </div>
      <div className="mt-4">
        {renderChart()}
      </div>
    </div>
  );
};

export default VisualizationPanel;
