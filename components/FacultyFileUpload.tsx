import React, { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';

interface FacultyFileUploadProps {
  onFileUpload: (file: File) => void;
}

const FacultyFileUpload: React.FC<FacultyFileUploadProps> = ({ onFileUpload }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUploadClick = () => {
    if (selectedFile) {
      onFileUpload(selectedFile);
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
    <div className="bg-accent dark:bg-gray-700/50 p-4 rounded-lg flex flex-col items-center gap-4 w-full">
        <div className="flex-grow w-full">
            <div className="flex items-center rounded-md bg-primary border border-accent dark:bg-gray-800 dark:border-gray-600">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileChange}
                    className="hidden"
                    id="faculty-file-upload"
                />
                <label
                    htmlFor="faculty-file-upload"
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
        disabled={!selectedFile}
        className="w-full bg-highlight text-primary font-bold py-2 px-4 rounded-md hover:bg-teal-300 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2 dark:bg-teal-500 dark:hover:bg-teal-400"
      >
        <Upload size={20}/>
        Upload Faculty Data
      </button>
    </div>
  );
};

export default FacultyFileUpload;
