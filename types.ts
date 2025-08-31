
export type TableRow = Record<string, string | number | null>;

export interface ColumnStat {
  type: 'numeric' | 'categorical';
  stats: Record<string, number | string>;
}

export interface ChatMessage {
    role: 'user' | 'model';
    parts: Array<{ text: string }>;
}

export interface AnalysisResult {
  fileName: string;
  cleanedData: TableRow[];
  summary: string;
  insights: string;
  chatHistory: ChatMessage[];
}
