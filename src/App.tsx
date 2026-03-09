import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  PieChart as PieChartIcon, 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Tag, 
  Search,
  Download,
  X,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  LayoutDashboard
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend 
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Expense {
  id: number;
  title: string;
  amount: number;
  category: string;
  date: string;
}

const CATEGORIES = ['Food', 'Travel', 'Shopping', 'Bills', 'Other'];
const CATEGORY_COLORS: Record<string, string> = {
  Food: '#6366f1',
  Travel: '#a855f7',
  Shopping: '#ec4899',
  Bills: '#f59e0b',
  Other: '#10b981',
};

export default function App() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [budgetLimit, setBudgetLimit] = useState<number>(2000);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'Food',
    date: format(new Date(), 'yyyy-MM-dd'),
  });

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const res = await fetch('/api/expenses');
      const data = await res.json();
      setExpenses(data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      amount: parseFloat(formData.amount),
    };

    try {
      if (editingExpense) {
        await fetch(`/api/expenses/${editingExpense.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch('/api/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      fetchExpenses();
      closeModal();
    } catch (error) {
      console.error('Error saving expense:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    try {
      await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      fetchExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const openModal = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        title: expense.title,
        amount: expense.amount.toString(),
        category: expense.category,
        date: expense.date,
      });
    } else {
      setEditingExpense(null);
      setFormData({
        title: '',
        amount: '',
        category: 'Food',
        date: format(new Date(), 'yyyy-MM-dd'),
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingExpense(null);
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      const matchesSearch = exp.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || exp.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [expenses, searchTerm, categoryFilter]);

  const stats = useMemo(() => {
    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const categoryTotals = expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);

    const highestCategory = (Object.entries(categoryTotals) as [string, number][]).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    
    const currentMonthExpenses = expenses.filter(exp => {
      const date = parseISO(exp.date);
      return isWithinInterval(date, {
        start: startOfMonth(new Date()),
        end: endOfMonth(new Date())
      });
    });
    const monthlyTotal = currentMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    return { total, categoryTotals, highestCategory, monthlyTotal, count: expenses.length };
  }, [expenses]);

  const chartData = useMemo(() => {
    return Object.entries(stats.categoryTotals).map(([name, value]) => ({
      name,
      value,
      color: CATEGORY_COLORS[name] || '#94a3b8'
    }));
  }, [stats.categoryTotals]);

  const exportToCSV = () => {
    const headers = ['Title', 'Amount', 'Category', 'Date'];
    const rows = expenses.map(e => [e.title, e.amount, e.category, e.date]);
    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `expenses_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.click();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <LayoutDashboard className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">SpendWise</h1>
            <p className="text-slate-400 text-sm">Track your wealth, one expense at a time.</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <button onClick={exportToCSV} className="btn-secondary flex items-center gap-2">
            <Download size={18} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
            <Plus size={20} />
            <span>Add Expense</span>
          </button>
        </motion.div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {[
          { label: 'Total Spending', value: `$${stats.total.toLocaleString()}`, icon: DollarSign, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
          { label: 'Monthly Total', value: `$${stats.monthlyTotal.toLocaleString()}`, icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-400/10', sub: `Limit: $${budgetLimit}` },
          { label: 'Top Category', value: stats.highestCategory, icon: Tag, color: 'text-pink-400', bg: 'bg-pink-400/10' },
          { label: 'Transactions', value: stats.count, icon: Calendar, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-6 relative overflow-hidden group"
          >
            <div className={cn("absolute top-0 right-0 p-8 opacity-10 transition-transform group-hover:scale-110", stat.color)}>
              <stat.icon size={64} />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className={cn("p-2 rounded-lg", stat.bg)}>
                <stat.icon size={20} className={stat.color} />
              </div>
              <span className="text-slate-400 text-sm font-medium">{stat.label}</span>
            </div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            {stat.sub && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className={cn("h-full transition-all duration-1000", stats.monthlyTotal > budgetLimit ? 'bg-red-500' : 'bg-indigo-500')} 
                    style={{ width: `${Math.min((stats.monthlyTotal / budgetLimit) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">{Math.round((stats.monthlyTotal / budgetLimit) * 100)}%</span>
              </div>
            )}
            {stat.label === 'Monthly Total' && stats.monthlyTotal > budgetLimit && (
              <div className="mt-2 flex items-center gap-1 text-red-400 text-[10px] font-bold uppercase">
                <AlertCircle size={12} />
                Budget Exceeded
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Charts Section */}
        <div className="lg:col-span-1 space-y-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <PieChartIcon size={20} className="text-indigo-400" />
                Distribution
              </h3>
            </div>
            <div className="h-[250px] w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e1e24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 text-sm italic">
                  No data to visualize
                </div>
              )}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {chartData.map(item => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-slate-400">{item.name}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <BarChart3 size={20} className="text-purple-400" />
                Spending by Category
              </h3>
            </div>
            <div className="h-[250px] w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" hide />
                    <YAxis hide />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      contentStyle={{ backgroundColor: '#1e1e24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 text-sm italic">
                  No data to visualize
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Expenses List Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text" 
                placeholder="Search expenses..." 
                className="glass-input w-full pl-12"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              className="glass-input min-w-[140px]"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map((expense) => (
                  <motion.div
                    key={expense.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="glass-card p-4 flex items-center justify-between group hover:bg-white/[0.07] transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        expense.category === 'Food' ? 'bg-indigo-500/20 text-indigo-400' :
                        expense.category === 'Travel' ? 'bg-purple-500/20 text-purple-400' :
                        expense.category === 'Shopping' ? 'bg-pink-500/20 text-pink-400' :
                        expense.category === 'Bills' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-emerald-500/20 text-emerald-400'
                      )}>
                        <Tag size={18} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">{expense.title}</h4>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {format(parseISO(expense.date), 'MMM dd, yyyy')}
                          </span>
                          <span className="w-1 h-1 bg-slate-700 rounded-full" />
                          <span>{expense.category}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-lg font-bold text-white">${expense.amount.toLocaleString()}</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest">Amount</div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openModal(expense)}
                          className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(expense.id)}
                          className="p-2 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="glass-card p-12 text-center"
                >
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="text-slate-600" size={32} />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">No expenses found</h3>
                  <p className="text-slate-500">Try adjusting your search or add a new expense to get started.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card w-full max-w-md p-8 relative z-10"
            >
              <button 
                onClick={closeModal}
                className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>

              <h2 className="text-2xl font-bold text-white mb-6">
                {editingExpense ? 'Edit Expense' : 'Add New Expense'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Expense Title</label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. Grocery Shopping"
                    className="glass-input w-full"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400">Amount ($)</label>
                    <input 
                      required
                      type="number" 
                      step="0.01"
                      placeholder="0.00"
                      className="glass-input w-full"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400">Date</label>
                    <input 
                      required
                      type="date" 
                      className="glass-input w-full"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Category</label>
                  <div className="grid grid-cols-3 gap-2">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFormData({...formData, category: cat})}
                        className={cn(
                          "py-2 px-3 rounded-xl text-xs font-medium border transition-all",
                          formData.category === cat 
                            ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
                            : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <button type="submit" className="btn-primary w-full py-3 text-lg">
                    {editingExpense ? 'Update Expense' : 'Add Expense'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Budget Settings Floating Button */}
      <div className="fixed bottom-8 right-8">
        <button 
          onClick={() => {
            const newLimit = prompt('Set Monthly Budget Limit:', budgetLimit.toString());
            if (newLimit && !isNaN(parseFloat(newLimit))) setBudgetLimit(parseFloat(newLimit));
          }}
          className="w-12 h-12 glass-card flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all shadow-xl"
          title="Set Budget Limit"
        >
          <AlertCircle size={20} />
        </button>
      </div>
    </div>
  );
}
