
import React, { useCallback, useState } from 'react';
import { UploadCloud, FileCheck, AlertTriangle } from 'lucide-react';

interface FileUploadProps {
  onProcessFile: (file: File) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onProcessFile }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = useCallback((files: FileList | null) => {
    setError(null);
    if (files && files.length > 0) {
      const file = files[0];
      const allowedTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      if (allowedTypes.includes(file.type) || file.name.endsWith('.csv') || file.name.endsWith('.xls') || file.name.endsWith('.xlsx')) {
        setSelectedFile(file);
      } else {
        setError('Invalid file type. Please upload a CSV or Excel file.');
        setSelectedFile(null);
      }
    }
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFileChange(e.dataTransfer.files);
  }, [handleFileChange]);

  const handleSubmit = useCallback(() => {
    if (selectedFile) {
      onProcessFile(selectedFile);
    }
  }, [selectedFile, onProcessFile]);

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-md border border-gray-200">
      <div className="text-center">
        <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
        <h2 className="mt-2 text-2xl font-semibold text-gray-900">Upload your dataset</h2>
        <p className="mt-1 text-sm text-gray-500">Supports CSV and Excel files. We'll automatically clean and analyze it for you.</p>
      </div>

      <div 
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`mt-6 border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300'}`}
      >
        <input 
          type="file" 
          id="file-upload" 
          className="hidden" 
          accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
          onChange={(e) => handleFileChange(e.target.files)}
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <p className="text-gray-700">
            <span className="font-semibold text-primary-600">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-500 mt-1">Max file size: 10MB</p>
        </label>
      </div>

      {error && (
        <div className="mt-4 flex items-center text-sm text-red-600">
          <AlertTriangle className="h-4 w-4 mr-2" />
          {error}
        </div>
      )}

      {selectedFile && !error && (
        <div className="mt-4 flex items-center justify-between bg-green-50 border border-green-200 p-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <FileCheck className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-gray-700">{selectedFile.name}</span>
          </div>
          <button onClick={() => setSelectedFile(null)} className="text-sm text-gray-500 hover:text-gray-700">&times;</button>
        </div>
      )}

      <div className="mt-8">
        <button
          onClick={handleSubmit}
          disabled={!selectedFile || !!error}
          className="w-full bg-primary-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Analyze Data
        </button>
      </div>
    </div>
  );
};

export default FileUpload;
