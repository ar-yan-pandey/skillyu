'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface PaymentPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (transactionId: string | null) => void;
  amount: number;
}

export default function PaymentPopup({ isOpen, onClose, onSubmit, amount }: PaymentPopupProps) {
  const [transactionId, setTransactionId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // For free masterclasses, pass null as transaction ID
      await onSubmit(amount === 0 ? null : transactionId);
    } finally {
      setIsSubmitting(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-semibold mb-4">
          {amount === 0 ? 'Free Masterclass' : 'Complete Payment'}
        </h2>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-2">
            {amount === 0 ? 'This masterclass is free!' : 'Amount to be paid:'}
          </p>
          {amount > 0 && <p className="text-2xl font-bold">₹{amount.toFixed(2)}</p>}
        </div>

        {amount > 0 ? (
          <>
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-4">
                Please complete the payment using your preferred method and enter the transaction ID below.
              </p>
              <p className="text-sm text-gray-600 mb-2">
                Payment Methods:
              </p>
              <ul className="text-sm text-gray-600 list-disc ml-5 mb-4">
                <li>UPI: payment@skillyu</li>
                <li>Bank Transfer: ACC NO - 1234567890</li>
              </ul>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="transactionId" className="block text-sm font-medium text-gray-700 mb-1">
                  Transaction ID
                </label>
                <input
                  type="text"
                  id="transactionId"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="Enter your transaction ID"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
                  disabled={isSubmitting || !transactionId}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    'Submit'
                  )}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={(e) => handleSubmit(e as any)}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center"
            >
              Register Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
