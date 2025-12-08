'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Smartphone, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Copy,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

interface PaymentData {
  paymentId: string;
  amount: number;
  currency: string;
  status: string;
  mentorshipId: string;
}

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const paymentId = params.paymentId as string;
  
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [error, setError] = useState('');

  // Account numbers for receiving payments
  const accountNumbers = {
    bkash: '01712345678',
    nagad: '01712345678'
  };

  useEffect(() => {
    if (paymentId) {
      // In a real app, you'd fetch payment data from API
      // For now, we'll simulate it
      setPaymentData({
        paymentId,
        amount: 1000,
        currency: 'BDT',
        status: 'pending',
        mentorshipId: 'temp-id'
      });
      setLoading(false);
    }
  }, [paymentId]);

  const handleCopyAccountNumber = (method: string) => {
    const accountNumber = accountNumbers[method as keyof typeof accountNumbers];
    navigator.clipboard.writeText(accountNumber);
    toast.success(`${method.toUpperCase()} account number copied!`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!paymentMethod || !transactionId || !accountNumber) {
      setError('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/payment', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId,
          paymentMethod,
          transactionId,
          accountNumber
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Payment submitted successfully!');
        // Redirect to success page or dashboard
        router.push('/mentorship/success');
      } else {
        setError(result.error || 'Payment submission failed');
      }
    } catch (error) {
      console.error('Error submitting payment:', error);
      setError('Failed to submit payment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-emerald-50">
        <Navigation />
        <div className="pt-24 pb-16">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!paymentData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-emerald-50">
        <Navigation />
        <div className="pt-24 pb-16">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Not Found</h1>
              <p className="text-gray-600 mb-6">The payment link you&apos;re looking for doesn&apos;t exist or has expired.</p>
              <Button onClick={() => router.push('/mentorship')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Mentorship
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-emerald-50">
      <Navigation />
      
      <div className="pt-24 pb-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Complete Your Payment
            </h1>
            <p className="text-gray-600">
              Secure payment for your mentorship session
            </p>
          </div>

          {/* Payment Summary */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Payment Summary</span>
                <Badge variant="outline">Pending</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Mentorship Session</span>
                  <span className="font-medium">Study Abroad Expert</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-medium">30 minutes</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Amount</span>
                  <span className="text-primary">৳{paymentData.amount} BDT</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Payment Method Selection */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Choose Payment Method</Label>
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="bkash" id="bkash" />
                      <Label htmlFor="bkash" className="flex items-center space-x-2 cursor-pointer">
                        <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center">
                          <Smartphone className="w-4 h-4 text-white" />
                        </div>
                        <span>bKash</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="nagad" id="nagad" />
                      <Label htmlFor="nagad" className="flex items-center space-x-2 cursor-pointer">
                        <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                          <CreditCard className="w-4 h-4 text-white" />
                        </div>
                        <span>Nagad</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Account Number Display */}
                {paymentMethod && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Send money to this {paymentMethod.toUpperCase()} account:
                    </Label>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-lg font-bold">
                          {accountNumbers[paymentMethod as keyof typeof accountNumbers]}
                        </span>
                        <Badge variant="secondary">Personal</Badge>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyAccountNumber(paymentMethod)}
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Account holder: EduLens Support
                    </p>
                  </div>
                )}

                {/* Payment Details Form */}
                {paymentMethod && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="amount">Amount (BDT)</Label>
                      <Input
                        id="amount"
                        type="number"
                        value={paymentData.amount}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>

                    <div>
                      <Label htmlFor="transactionId">Transaction ID *</Label>
                      <Input
                        id="transactionId"
                        type="text"
                        placeholder="Enter transaction ID from your payment app"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        required
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        You&apos;ll receive this after completing the payment
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="accountNumber">Your {paymentMethod.toUpperCase()} Number *</Label>
                      <Input
                        id="accountNumber"
                        type="text"
                        placeholder={`Enter your ${paymentMethod.toUpperCase()} number`}
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-700">{error}</span>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!paymentMethod || !transactionId || !accountNumber || submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting Payment...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Submit Payment
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="mt-6">
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3">How to pay:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                <li>Open your {paymentMethod.toUpperCase()} app</li>
                <li>Send ৳{paymentData.amount} to the account number above</li>
                <li>Copy the transaction ID from the confirmation message</li>
                <li>Paste the transaction ID in the form above</li>
                <li>Enter your {paymentMethod.toUpperCase()} number</li>
                <li>Click &quot;Submit Payment&quot;</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
} 