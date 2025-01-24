import { useState } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  masterclassTitle: string;
  onSubmit: (transactionId: string | null) => void;
}

export default function PaymentModal({ 
  isOpen, 
  onClose, 
  amount, 
  masterclassTitle,
  onSubmit 
}: PaymentModalProps) {
  const [transactionId, setTransactionId] = useState('');
  const [showAlternateQR, setShowAlternateQR] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await onSubmit(amount === 0 ? null : transactionId);
    setSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] p-0 max-h-[90vh] overflow-hidden flex flex-col bg-white">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle className="text-center text-xl">
            {amount === 0 ? 'Free Masterclass' : 'Complete Payment'}
          </DialogTitle>
          <div className="text-center space-y-1">
            <p className="text-lg font-medium text-gray-900">
              {amount === 0 ? 'This masterclass is free!' : `Amount: ₹${amount}`}
            </p>
            {amount > 0 && <p className="text-sm text-gray-500">Scan QR code to pay</p>}
          </div>
        </DialogHeader>

        <div className="px-6 py-4 space-y-6 overflow-y-auto bg-white">
          {amount > 0 ? (
            <>
              <div className="relative w-full aspect-square max-w-[280px] mx-auto bg-gray-50 rounded-lg p-4">
                <Image
                  src={showAlternateQR ? '/skillyu-payment-2.jpg' : '/skillyu-payment-1.jpg'}
                  alt="Payment QR Code"
                  fill
                  className="object-contain p-2"
                />
              </div>

              <button
                onClick={() => setShowAlternateQR(!showAlternateQR)}
                className="text-sm text-[#4FCDC4] hover:underline w-full text-center"
              >
                QR not working? Click here
              </button>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="transactionId" className="text-sm font-medium text-gray-700">
                    Transaction ID
                  </label>
                  <Input
                    id="transactionId"
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="Enter your transaction ID"
                    required
                    className="w-full"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#4FCDC4] hover:bg-[#4FCDC4]/90 text-white"
                  disabled={submitting || !transactionId}
                >
                  {submitting ? 'Submitting...' : 'Submit Payment'}
                </Button>
              </form>

              <div className="rounded-lg bg-blue-50 p-4">
                <p className="text-sm text-blue-700">
                  After submitting, your payment will be verified and registration will be confirmed for <span className="font-medium">{masterclassTitle}</span>.
                </p>
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-gray-600">
                  Click the button below to register for this masterclass.
                </p>
              </div>

              <Button
                onClick={(e) => handleSubmit(e as any)}
                className="w-full bg-[#4FCDC4] hover:bg-[#4FCDC4]/90 text-white"
                disabled={submitting}
              >
                {submitting ? 'Registering...' : 'Register Now'}
              </Button>

              <div className="rounded-lg bg-blue-50 p-4">
                <p className="text-sm text-blue-700">
                  You will be registered immediately for <span className="font-medium">{masterclassTitle}</span>.
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
