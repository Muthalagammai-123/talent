import { createContext, useContext, useState, useCallback } from 'react'
import { payments as seed } from '@/data/mockData'

const STORAGE_KEY = 'talentstage-payments'

const defaultMethods = [
  { id: 'upi-1', type: 'upi', label: 'UPI', upiId: 'freelancer@oksbi', verified: true, isDefault: true },
  { id: 'bank-1', type: 'bank', label: 'Bank account', accountName: 'Alex Rivera', accountNumber: '****4521', ifsc: 'HDFC0001234', bankName: 'HDFC Bank', isDefault: false },
  { id: 'paypal-1', type: 'paypal', label: 'PayPal', email: 'alex@email.com', isDefault: false },
]

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch {
    /* ignore */
  }
  return {
    totalEarnings: seed.totalEarnings,
    pending: seed.pending,
    available: seed.available,
    currency: 'INR',
    methods: defaultMethods,
    transactions: seed.transactions.map((t) => ({ ...t, method: 'bank' })),
    withdrawals: seed.withdrawals.map((w, i) => ({ ...w, id: `w-${i}`, method: 'bank' })),
  }
}

function persist(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

const PaymentsContext = createContext(null)

export function PaymentsProvider({ children }) {
  const [state, setState] = useState(loadState)

  const update = useCallback((updater) => {
    setState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }
      persist(next)
      return next
    })
  }, [])

  const addMethod = useCallback((method) => {
    update((prev) => ({
      ...prev,
      methods: [...prev.methods, { ...method, id: `method-${Date.now()}` }],
    }))
  }, [update])

  const setDefaultMethod = useCallback((id) => {
    update((prev) => ({
      ...prev,
      methods: prev.methods.map((m) => ({ ...m, isDefault: m.id === id })),
    }))
  }, [update])

  const removeMethod = useCallback((id) => {
    update((prev) => ({
      ...prev,
      methods: prev.methods.filter((m) => m.id !== id),
    }))
  }, [update])

  const withdraw = useCallback(({ amount, methodId }) => {
    const amt = Number(amount)
    if (!amt || amt <= 0) return { error: 'Enter a valid amount' }
    if (amt > state.available) return { error: 'Insufficient balance' }

    const method = state.methods.find((m) => m.id === methodId)
    if (!method) return { error: 'Select a payout method' }

    update((prev) => {
      const withdrawal = {
        id: `wd-${Date.now()}`,
        amount: amt,
        date: new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        status: method.type === 'upi' ? 'processing' : 'completed',
        method: method.type,
        methodLabel: formatMethodLabel(method),
      }
      const transaction = {
        id: `t-${Date.now()}`,
        desc: `Withdrawal via ${formatMethodLabel(method)}`,
        amount: -amt,
        status: 'completed',
        date: withdrawal.date,
        method: method.type,
      }
      return {
        ...prev,
        available: prev.available - amt,
        withdrawals: [withdrawal, ...prev.withdrawals],
        transactions: [transaction, ...prev.transactions],
      }
    })
    return { success: true }
  }, [state.available, update])

  const formatAmount = useCallback(
    (amount, currency = state.currency) => {
      if (currency === 'INR') {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
      }
      return `$${amount.toLocaleString()}`
    },
    [state.currency]
  )

  return (
    <PaymentsContext.Provider
      value={{
        ...state,
        addMethod,
        setDefaultMethod,
        removeMethod,
        withdraw,
        formatAmount,
        setCurrency: (currency) => update({ currency }),
      }}
    >
      {children}
    </PaymentsContext.Provider>
  )
}

export function formatMethodLabel(method) {
  if (!method) return 'Unknown'
  if (method.type === 'upi') return `UPI · ${method.upiId}`
  if (method.type === 'bank') return `Bank · ${method.accountNumber}`
  if (method.type === 'paypal') return `PayPal · ${method.email}`
  return method.label
}

export function usePayments() {
  const ctx = useContext(PaymentsContext)
  if (!ctx) throw new Error('usePayments must be used within PaymentsProvider')
  return ctx
}
