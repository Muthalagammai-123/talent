import { useState } from 'react'
import {
  DollarSign, Clock, Wallet, ArrowDownToLine, Smartphone, Building2, CreditCard,
  Plus, Check, Shield, IndianRupee, QrCode,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input, Label } from '@/components/ui/input'
import { GlassCard } from '@/components/shared/GlassCard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { usePayments, formatMethodLabel } from '@/contexts/PaymentsContext'
import { cn } from '@/lib/utils'

const methodIcons = { upi: Smartphone, bank: Building2, paypal: CreditCard }

export function PaymentDashboardPage() {
  const {
    totalEarnings, pending, available, currency, methods, transactions, withdrawals,
    formatAmount, withdraw, addMethod, setDefaultMethod, setCurrency,
  } = usePayments()

  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [selectedMethod, setSelectedMethod] = useState(methods.find((m) => m.isDefault)?.id || methods[0]?.id)
  const [withdrawMsg, setWithdrawMsg] = useState('')
  const [addUpiOpen, setAddUpiOpen] = useState(false)
  const [newUpi, setNewUpi] = useState({ upiId: '', label: 'Personal UPI' })

  const handleWithdraw = () => {
    const result = withdraw({ amount: withdrawAmount, methodId: selectedMethod })
    if (result.error) {
      setWithdrawMsg(result.error)
      return
    }
    setWithdrawMsg('Withdrawal initiated successfully!')
    setWithdrawAmount('')
    setTimeout(() => {
      setWithdrawOpen(false)
      setWithdrawMsg('')
    }, 1500)
  }

  const handleAddUpi = () => {
    if (!newUpi.upiId.includes('@')) {
      setWithdrawMsg('Enter a valid UPI ID (e.g. name@oksbi)')
      return
    }
    addMethod({
      type: 'upi',
      label: newUpi.label,
      upiId: newUpi.upiId,
      verified: false,
      isDefault: methods.length === 0,
    })
    setNewUpi({ upiId: '', label: 'Personal UPI' })
    setAddUpiOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Freelancer Payments</h1>
          <p className="text-[hsl(var(--muted-foreground))]">Withdraw via UPI, bank, or international methods</p>
        </div>
        <div className="flex gap-2">
          <Select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            <option value="INR">INR ₹</option>
            <option value="USD">USD $</option>
          </Select>
          <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-btn">
                <ArrowDownToLine className="h-4 w-4" /> Withdraw
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Withdraw funds</DialogTitle>
              </DialogHeader>
              <div className="mt-4 space-y-4">
                <div>
                  <Label>Amount ({currency})</Label>
                  <Input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder={`Max ${formatAmount(available)}`}
                    className="mt-1"
                  />
                  <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                    Available: {formatAmount(available)}
                  </p>
                </div>
                <div>
                  <Label>Payout method</Label>
                  <div className="mt-2 space-y-2">
                    {methods.map((m) => {
                      const Icon = methodIcons[m.type] || Wallet
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setSelectedMethod(m.id)}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors',
                            selectedMethod === m.id ? 'border-purple-500 bg-purple-500/15' : 'border-white/10 hover:bg-white/5'
                          )}
                        >
                          <Icon className="h-4 w-4 text-purple-400" />
                          <span className="flex-1">{formatMethodLabel(m)}</span>
                          {m.verified && <Badge variant="success">Verified</Badge>}
                        </button>
                      )
                    })}
                  </div>
                </div>
                {withdrawMsg && (
                  <p className={cn('text-sm', withdrawMsg.includes('success') ? 'text-emerald-400' : 'text-red-400')}>
                    {withdrawMsg}
                  </p>
                )}
                <Button className="w-full gradient-btn" onClick={handleWithdraw}>
                  Confirm withdrawal
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Total earnings', value: formatAmount(totalEarnings), icon: DollarSign },
          { label: 'Pending', value: formatAmount(pending), icon: Clock },
          { label: 'Available', value: formatAmount(available), icon: Wallet },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="rounded-2xl bg-purple-500/20 p-3">
                <s.icon className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="methods">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="methods">Payout methods</TabsTrigger>
          <TabsTrigger value="upi">UPI & QR</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="methods" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {methods.map((m) => {
              const Icon = methodIcons[m.type] || Wallet
              return (
                <GlassCard key={m.id}>
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3">
                      <div className="rounded-xl bg-purple-500/20 p-3">
                        <Icon className="h-5 w-5 text-purple-400" />
                      </div>
                      <div>
                        <p className="font-semibold">{m.label || m.type.toUpperCase()}</p>
                        <p className="text-sm text-[hsl(var(--muted-foreground))]">{formatMethodLabel(m)}</p>
                        {m.type === 'bank' && (
                          <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{m.bankName} · IFSC {m.ifsc}</p>
                        )}
                      </div>
                    </div>
                    {m.isDefault && <Badge>Default</Badge>}
                  </div>
                  <div className="mt-4 flex gap-2">
                    {!m.isDefault && (
                      <Button variant="outline" size="sm" onClick={() => setDefaultMethod(m.id)}>Set default</Button>
                    )}
                    {m.type === 'upi' && !m.verified && (
                      <Button variant="outline" size="sm"><Shield className="h-3 w-3" /> Verify</Button>
                    )}
                  </div>
                </GlassCard>
              )
            })}
            <GlassCard className="flex flex-col items-center justify-center border-dashed min-h-[140px]">
              <Dialog open={addUpiOpen} onOpenChange={setAddUpiOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline"><Plus className="h-4 w-4" /> Add UPI ID</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add UPI payment</DialogTitle></DialogHeader>
                  <div className="mt-4 space-y-3">
                    <div>
                      <Label>Display name</Label>
                      <Input value={newUpi.label} onChange={(e) => setNewUpi({ ...newUpi, label: e.target.value })} className="mt-1" />
                    </div>
                    <div>
                      <Label>UPI ID</Label>
                      <Input
                        value={newUpi.upiId}
                        onChange={(e) => setNewUpi({ ...newUpi, upiId: e.target.value })}
                        placeholder="yourname@oksbi"
                        className="mt-1"
                      />
                    </div>
                    <Button className="w-full gradient-btn" onClick={handleAddUpi}>Save UPI</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </GlassCard>
          </div>
        </TabsContent>

        <TabsContent value="upi" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <GlassCard>
              <h3 className="flex items-center gap-2 font-semibold">
                <IndianRupee className="h-5 w-5 text-purple-400" /> Instant UPI withdrawal
              </h3>
              <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                Withdraw to any UPI app — Google Pay, PhonePe, Paytm, BHIM. Typically settles in minutes.
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> Zero fee on first ₹50,000/month</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> 24/7 processing</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> Auto-verify supported handles</li>
              </ul>
              <Button className="mt-4 gradient-btn" onClick={() => setWithdrawOpen(true)}>
                Withdraw via UPI
              </Button>
            </GlassCard>
            <GlassCard className="flex flex-col items-center text-center">
              <div className="flex h-40 w-40 items-center justify-center rounded-2xl border-2 border-dashed border-purple-500/40 bg-purple-500/5">
                <QrCode className="h-20 w-20 text-purple-400/60" />
              </div>
              <p className="mt-4 font-medium">Receive payments via QR</p>
              <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                Default UPI: {methods.find((m) => m.type === 'upi' && m.isDefault)?.upiId || 'Add UPI to generate QR'}
              </p>
              <Button variant="outline" className="mt-3" size="sm">Download QR code</Button>
            </GlassCard>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Recent transactions</CardTitle></CardHeader>
              <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                {transactions.map((t) => (
                  <div key={t.id} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">{t.desc}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">{t.date} · {t.method?.toUpperCase()}</p>
                    </div>
                    <div className="text-right">
                      <p className={cn('font-semibold', t.amount > 0 ? 'text-emerald-400' : '')}>
                        {t.amount > 0 ? '+' : ''}{formatAmount(Math.abs(t.amount))}
                      </p>
                      <Badge variant={t.status === 'completed' ? 'success' : 'warning'}>{t.status}</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Withdrawal history</CardTitle></CardHeader>
              <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                {withdrawals.map((w) => (
                  <div key={w.id} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3 text-sm">
                    <div>
                      <p className="font-medium">{formatAmount(w.amount)}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))">{w.methodLabel || w.method}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">{w.date}</p>
                      <Badge variant={w.status === 'completed' ? 'success' : 'warning'}>{w.status}</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
