import React, { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';

interface FileUploadProps {
  onFileUpload: (file: File, date: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadDate, setUploadDate] = useState(new Date().toISOString().split('T')[0]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUploadClick = () => {
    if (selectedFile && uploadDate) {
      onFileUpload(selectedFile, uploadDate);
      // Clear the file input after upload for a better UX
      handleClear();
    }
  };

  const handleClear = () => {
      setSelectedFile(null);
      if(fileInputRef.current) {
          fileInputRef.current.value = "";
      }
  }

  return (
    <div className="bg-accent dark:bg-gray-700/50 p-4 rounded-lg flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
        <div className="flex flex-col gap-2 w-full sm:w-auto">
            <label htmlFor="upload-date" className="text-sm font-medium text-text-secondary dark:text-gray-400">Attendance Date</label>
            <input
                id="upload-date"
                type="date"
                value={uploadDate}
                onChange={(e) => setUploadDate(e.target.value)}
                className="bg-primary border border-accent rounded-md px-3 py-2 text-text-primary focus:ring-2 focus:ring-highlight focus:outline-none dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:focus:ring-teal-400"
            />
        </div>

      <div className="flex-grow w-full sm:w-auto">
         <label className="text-sm font-medium text-text-secondary dark:text-gray-400">Upload Excel File</label>
        <div className="mt-1 flex items-center rounded-md bg-primary border border-accent dark:bg-gray-800 dark:border-gray-600">
            <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
            />
            <label
                htmlFor="file-upload"
                className="cursor-pointer px-3 py-2 text-text-primary truncate flex-grow dark:text-gray-200"
            >
                {selectedFile ? selectedFile.name : 'Choose a file...'}
            </label>
            {selectedFile && (
                <button onClick={handleClear} className="p-2 text-text-secondary hover:text-text-primary dark:text-gray-400 dark:hover:text-gray-200">
                    <X size={18} />
                </button>
            )}
        </div>
      </div>
      
      <button
        onClick={handleUploadClick}
        disabled={!selectedFile || !uploadDate}
        className="w-full sm:w-auto mt-2 sm:mt-0 self-end bg-highlight text-primary font-bold py-2 px-4 rounded-md hover:bg-teal-300 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2 dark:bg-teal-500 dark:hover:bg-teal-400"
      >
        <Upload size={20}/>
        Process
      </button>
    </div>
  );
};

export default FileUpload;