
import React, { useState, useCallback } from 'react';
import type { AnalysisResult, TableRow } from './types';
import { parseAndCleanFile } from './services/dataService';
import { generateInsights, generateChatResponse } from './services/geminiService';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import { GithubIcon, LoaderCircle } from 'lucide-react';

const App: React.FC = () => {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>('');

  const handleFileProcess = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      setLoadingMessage('Parsing and cleaning data...');
      const { cleanedData, summary } = await parseAndCleanFile(file);

      if (cleanedData.length === 0) {
        throw new Error("No data could be extracted from the file. It might be empty or in an unsupported format.");
      }
      
      setLoadingMessage('Generating initial analysis with AI...');
      const insights = await generateInsights(summary);
      
      setAnalysisResult({
        fileName: file.name,
        cleanedData,
        summary,
        insights,
        chatHistory: [{ role: 'model', parts: [{ text: insights }] }],
      });

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, []);

  const handleReset = useCallback(() => {
    setAnalysisResult(null);
    setError(null);
  }, []);
  
  const handleChatSubmit = useCallback(async (message: string) => {
    if (!analysisResult) return;

    const updatedHistory = [
        ...analysisResult.chatHistory,
        { role: 'user' as const, parts: [{ text: message }] }
    ];

    setAnalysisResult(prev => prev ? { ...prev, chatHistory: updatedHistory } : null);
    
    try {
        const aiResponse = await generateChatResponse(analysisResult.summary, updatedHistory);
        setAnalysisResult(prev => {
            if (!prev) return null;
            const finalHistory = [...updatedHistory, { role: 'model' as const, parts: [{ text: aiResponse }] }];
            return { ...prev, chatHistory: finalHistory };
        });
    } catch (err) {
        console.error("Chat error:", err);
        setAnalysisResult(prev => {
            if (!prev) return null;
            const errorMessage = "Sorry, I couldn't get a response. Please try again.";
            const finalHistory = [...updatedHistory, { role: 'model' as const, parts: [{ text: errorMessage }] }];
            return { ...prev, chatHistory: finalHistory };
        });
    }
}, [analysisResult]);


  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 antialiased">
      <header className="bg-white border-b border-gray-200">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
                <div className="flex items-center space-x-2">
                    <svg className="h-8 w-8 text-primary-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H7v-2h4V7h2v4h4v2h-4v4h-2z"/></svg>
                    <h1 className="text-xl font-bold text-gray-800">Data Analysis AI</h1>
                </div>
                <a href="https://github.com/google/generative-ai-docs/tree/main/app-integration/building-an-app" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-800">
                  <GithubIcon className="h-6 w-6" />
                </a>
            </div>
        </nav>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <LoaderCircle className="w-12 h-12 animate-spin text-primary-600" />
            <p className="mt-4 text-lg font-semibold text-gray-700">{loadingMessage}</p>
            <p className="text-gray-500">This may take a moment...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline ml-2">{error}</span>
            <button onClick={handleReset} className="absolute top-0 bottom-0 right-0 px-4 py-3">
              <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
            </button>
          </div>
        )}

        {!isLoading && !analysisResult && !error && (
          <FileUpload onProcessFile={handleFileProcess} />
        )}

        {!isLoading && analysisResult && (
          <Dashboard 
            result={analysisResult} 
            onReset={handleReset} 
            onChatSubmit={handleChatSubmit} 
          />
        )}
      </main>
    </div>
  );
};

export default App;
