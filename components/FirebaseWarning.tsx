import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { firebaseConfig } from '../firebase/config';

const FirebaseWarning: React.FC = () => {
  const isConfigured = firebaseConfig.apiKey !== 'YOUR_API_KEY' && firebaseConfig.projectId !== 'YOUR_PROJECT_ID';

  if (isConfigured) {
    return null;
  }

  return (
    <div className="bg-yellow-100 border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg relative flex items-start mb-6 dark:bg-yellow-900/50 dark:border-yellow-700 dark:text-yellow-300" role="alert">
      <AlertTriangle className="h-5 w-5 mr-3 mt-1 flex-shrink-0" />
      <div>
        <strong className="font-bold">Firebase Not Configured</strong>
        <p className="mt-1">
          The application cannot connect to the database. Please update your Firebase project configuration in the file: <code className="bg-yellow-200 text-yellow-900 text-sm p-1 rounded mx-1 dark:bg-yellow-800/50 dark:text-yellow-200">firebase/config.ts</code>
        </p>
      </div>
    </div>
  );
};

export default FirebaseWarning;