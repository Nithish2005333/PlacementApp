import React from 'react';

interface EmailSpamPopupProps {
  show: boolean;
  onClose: () => void;
  type?: 'otp' | 'approval' | 'general';
}

const EmailSpamPopup: React.FC<EmailSpamPopupProps> = ({ show, onClose, type = 'general' }) => {
  if (!show) return null;

  const getMessage = () => {
    switch (type) {
      case 'otp':
        return 'OTP sent! Please check your spam/junk folder if you don\'t receive it within 2 minutes.';
      case 'approval':
        return 'Email sent! Please check your spam/junk folder for approval notifications.';
      default:
        return 'Email sent! Please check your spam/junk folder if you don\'t receive it.';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-[#1f1f1f] border border-neutral-800 rounded-lg p-6 max-w-md mx-4 shadow-xl">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-lg font-medium text-white mb-2">
              📧 Email Sent Successfully
            </h3>
            <p className="text-sm text-neutral-300 mb-4">
              {getMessage()}
            </p>
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-md p-3 mb-4">
              <p className="text-sm text-yellow-300">
                <strong>⚠️ Important:</strong> If you don't receive emails, please check your <strong>spam/junk folder</strong> and mark emails as "Not Spam".
              </p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailSpamPopup;
