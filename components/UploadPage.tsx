
import React from 'react';
import FileUpload from './FileUpload';
import { useAttendanceData } from '../hooks/useAttendanceData';
import { FileUp } from 'lucide-react';

type UploadPageProps = Pick<
  ReturnType<typeof useAttendanceData>,
  'handleFileUpload' | 'loading' | 'uploadStatus' | 'clearUploadStatus'
>;

const UploadPage: React.FC<UploadPageProps> = ({
  handleFileUpload,
  loading,
  uploadStatus,
  clearUploadStatus,
}) => {
  const statusStyles = {
    error: 'bg-red-100 border-red-400 text-red-700 dark:bg-red-900/50 dark:border-red-700 dark:text-red-300',
    success: 'bg-green-100 border-green-400 text-green-700 dark:bg-green-900/50 dark:border-green-700 dark:text-green-300',
    warning: 'bg-yellow-100 border-yellow-400 text-yellow-700 dark:bg-yellow-900/50 dark:border-yellow-700 dark:text-yellow-300',
  };

  const statusHeaders = {
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-secondary p-8 rounded-lg shadow-xl relative dark:bg-gray-800">
        {loading && (
          <div className="absolute inset-0 bg-primary/80 dark:bg-gray-900/80 flex items-center justify-center z-50 rounded-lg">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-highlight dark:border-teal-300"></div>
              <p className="text-text-secondary text-lg dark:text-gray-400">Processing File...</p>
            </div>
          </div>
        )}
        <div className="text-center mb-8">
            <FileUp className="mx-auto h-12 w-12 text-highlight dark:text-teal-300" />
            <h2 className="mt-4 text-2xl font-semibold text-text-primary dark:text-gray-100">Upload Attendance Data</h2>
            <p className="mt-2 text-text-secondary dark:text-gray-400">
                Select the attendance date and the corresponding Excel file (.xlsx, .xls) to process and save the data.
            </p>
        </div>

        {uploadStatus && (
            <div className={`mb-6 border ${statusStyles[uploadStatus.type]} px-4 py-3 rounded-lg relative flex items-start`} role="alert">
                <div className="flex-grow">
                    <strong className="font-bold mr-2">{statusHeaders[uploadStatus.type]}:</strong>
                    <span className="block sm:inline">{uploadStatus.message}</span>
                </div>
                <button onClick={clearUploadStatus} className="absolute top-0 bottom-0 right-0 px-4 py-3">
                    <span className="text-2xl">&times;</span>
                </button>
            </div>
        )}
        
        <div className="flex justify-center">
            <FileUpload onFileUpload={handleFileUpload} />
        </div>

      </div>
    </div>
  );
};

export default UploadPage;