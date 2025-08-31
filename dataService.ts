
import type { TableRow } from '../types';

declare const Papa: any;
declare const XLSX: any;

// Parses the uploaded file (CSV or Excel) into an array of objects.
const parseFile = (file: File): Promise<TableRow[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event: ProgressEvent<FileReader>) => {
      if (!event.target?.result) {
        return reject(new Error("Failed to read file."));
      }
      
      const data = event.target.result;
      let jsonData: TableRow[] = [];

      if (file.name.endsWith('.csv')) {
        Papa.parse(data as string, {
          header: true,
          skipEmptyLines: true,
          complete: (results: { data: TableRow[] }) => {
            jsonData = results.data;
            resolve(jsonData);
          },
          error: (err: Error) => reject(err),
        });
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        jsonData = XLSX.utils.sheet_to_json(worksheet);
        resolve(jsonData);
      } else {
        reject(new Error("Unsupported file type. Please upload a CSV or Excel file."));
      }
    };
    reader.onerror = () => reject(new Error("Error reading file."));

    if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
    } else {
        reader.readAsBinaryString(file);
    }
  });
};

// Cleans the data: removes duplicates, handles missing values, and normalizes headers.
const cleanData = (data: TableRow[]): TableRow[] => {
  if (!data || data.length === 0) return [];

  // 1. Normalize headers (trim whitespace, convert to consistent case)
  const normalizedData = data.map(row => {
    const newRow: TableRow = {};
    for (const key in row) {
      const newKey = key.trim();
      newRow[newKey] = row[key];
    }
    return newRow;
  });

  // 2. Remove duplicate rows
  const uniqueRows = new Map<string, TableRow>();
  normalizedData.forEach(row => {
    const rowString = JSON.stringify(Object.values(row).sort());
    if (!uniqueRows.has(rowString)) {
      uniqueRows.set(rowString, row);
    }
  });
  
  let cleaned = Array.from(uniqueRows.values());

  // 3. Handle missing or empty values (remove rows with any empty cell)
  const headers = Object.keys(cleaned[0] || {});
  cleaned = cleaned.filter(row => {
    return headers.every(header => {
      const value = row[header];
      return value !== null && value !== undefined && String(value).trim() !== '';
    });
  });

  // 4. Attempt to convert numeric strings to numbers
  return cleaned.map(row => {
      const newRow: TableRow = {};
      for(const key in row) {
          const value = row[key];
          if (typeof value === 'string' && !isNaN(Number(value)) && value.trim() !== '') {
              newRow[key] = Number(value);
          } else {
              newRow[key] = value;
          }
      }
      return newRow;
  });
};

// Generates a statistical and structural summary of the data.
const generateSummary = (data: TableRow[]): string => {
  if (data.length === 0) return "The dataset is empty after cleaning.";
  
  const rowCount = data.length;
  const headers = Object.keys(data[0]);
  const columnCount = headers.length;

  let summary = `Dataset Overview:\n- Total Rows: ${rowCount}\n- Total Columns: ${columnCount}\n- Column Names: ${headers.join(', ')}\n\nColumn Analysis:\n`;

  headers.forEach(header => {
    const values = data.map(row => row[header]).filter(v => v !== null && v !== undefined);
    const isNumeric = values.every(v => typeof v === 'number');

    if (isNumeric) {
      const numericValues = values as number[];
      const sum = numericValues.reduce((a, b) => a + b, 0);
      const mean = sum / numericValues.length;
      const sorted = [...numericValues].sort((a, b) => a - b);
      const min = sorted[0];
      const max = sorted[sorted.length - 1];
      const median = sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)];

      summary += `- Column "${header}" (Numeric):\n`;
      summary += `  - Mean: ${mean.toFixed(2)}\n`;
      summary += `  - Median: ${median.toFixed(2)}\n`;
      summary += `  - Min: ${min}\n`;
      summary += `  - Max: ${max}\n`;

    } else {
      const valueCounts: Record<string, number> = {};
      values.forEach(v => {
        const key = String(v);
        valueCounts[key] = (valueCounts[key] || 0) + 1;
      });
      const uniqueValues = Object.keys(valueCounts).length;

      summary += `- Column "${header}" (Categorical):\n`;
      summary += `  - Unique Values: ${uniqueValues}\n`;
      
      const top5 = Object.entries(valueCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([value, count]) => `${value} (${count} times)`);
      
      summary += `  - Top Values: ${top5.join(', ')}\n`;
    }
  });

  return summary;
};

export const parseAndCleanFile = async (file: File) => {
  const rawData = await parseFile(file);
  const cleanedData = cleanData(rawData);
  const summary = generateSummary(cleanedData);
  return { cleanedData, summary };
};
