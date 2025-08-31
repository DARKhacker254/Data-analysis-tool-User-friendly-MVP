
import type { TableRow } from '../types';

export const exportDataAsCSV = (data: TableRow[], fileName: string) => {
  if (data.length === 0) {
    console.warn("No data to export.");
    return;
  }

  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')]; // Header row

  data.forEach(row => {
    const values = headers.map(header => {
      const escaped = ('' + row[header]).replace(/"/g, '""'); // Escape double quotes
      return `"${escaped}"`; // Wrap all values in quotes
    });
    csvRows.push(values.join(','));
  });

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });

  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const cleanFileName = fileName.substring(0, fileName.lastIndexOf('.'));
    link.setAttribute('download', `${cleanFileName}_cleaned.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
