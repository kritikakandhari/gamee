import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { walletApi } from '@/lib/wallet';
import { Landmark, Send, AlertCircle } from 'lucide-react';

interface WithdrawDialogProps {
    maxAmountCents: number;
    onSuccess: () => void;
}

export function WithdrawDialog({ maxAmountCents, onSuccess }: WithdrawDialogProps) {
    const [amount, setAmount] = useState<string>('');
    const [method, setMethod] = useState<'BANK' | 'PAYPAL' | 'UPI'>('BANK');
    const [details, setDetails] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const handleWithdraw = async () => {
        const cents = Math.round(parseFloat(amount) * 100);
        if (isNaN(cents) || cents <= 0 || cents > maxAmountCents) {
            alert("Invalid amount");
            return;
        }

        try {
            setLoading(true);
            const result = await walletApi.requestWithdrawal(cents, method, details);
            if (result.success) {
                alert("Withdrawal request submitted! Processing takes 1-3 business days.");
                setOpen(false);
                onSuccess();
            } else {
                alert(result.error || "Failed to request withdrawal");
            }
        } catch (err: any) {
            alert(err.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="w-full bg-white/10 hover:bg-white/20 text-white font-bold border border-white/10">
                    <Send className="h-4 w-4 mr-2" /> WITHDRAW TO BANK
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Landmark className="h-5 w-5 text-secondary" /> Request Withdrawal
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                        Funds will be sent to your chosen payment method.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Amount to Withdraw (Available: ${(maxAmountCents / 100).toFixed(2)})</Label>
                        <Input
                            type="number"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="bg-white/5 border-white/10 text-white"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Payout Method</Label>
                        <div className="grid grid-cols-3 gap-2">
                            {['BANK', 'PAYPAL', 'UPI'].map((m) => (
                                <Button
                                    key={m}
                                    variant={method === m ? 'default' : 'outline'}
                                    onClick={() => setMethod(m as any)}
                                    className={method === m ? "bg-secondary text-dark" : "border-white/10 text-gray-400"}
                                >
                                    {m}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {method === 'BANK' && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                            <div className="space-y-1">
                                <Label className="text-[10px] uppercase">Bank Name</Label>
                                <Input placeholder="HDFC, Chase, etc." onChange={(e) => setDetails({ ...details, bank_name: e.target.value })} className="bg-white/5 border-white/10" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[10px] uppercase">Account Number / IBAN</Label>
                                <Input placeholder="Account Number" onChange={(e) => setDetails({ ...details, account_number: e.target.value })} className="bg-white/5 border-white/10" />
                            </div>
                        </div>
                    )}

                    {method === 'PAYPAL' && (
                        <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
                            <Label className="text-[10px] uppercase">PayPal Email</Label>
                            <Input placeholder="email@example.com" onChange={(e) => setDetails({ ...details, paypal_email: e.target.value })} className="bg-white/5 border-white/10" />
                        </div>
                    )}

                    {method === 'UPI' && (
                        <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
                            <Label className="text-[10px] uppercase">UPI ID</Label>
                            <Input placeholder="username@bank" onChange={(e) => setDetails({ ...details, upi_id: e.target.value })} className="bg-white/5 border-white/10" />
                        </div>
                    )}

                    <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/20 flex gap-3">
                        <AlertCircle className="h-4 w-4 text-blue-400 shrink-0" />
                        <p className="text-[10px] text-blue-200/70">
                            Withdrawals are processed manually by administrators to ensure security. Please allow up to 48 hours for the transfer to complete.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        className="w-full bg-secondary hover:bg-secondary/90 text-dark font-black"
                        onClick={handleWithdraw}
                        disabled={loading || !amount}
                    >
                        {loading ? 'Processing...' : 'CONFIRM WITHDRAWAL'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
