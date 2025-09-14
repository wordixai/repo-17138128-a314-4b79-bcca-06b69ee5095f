import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export interface Member {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  paymentMethods: PaymentMethod[];
  preferences: {
    defaultSplit: 'equal' | 'percentage' | 'custom';
    notifications: boolean;
  };
}

export interface PaymentMethod {
  id: string;
  type: 'venmo' | 'paypal' | 'zelle' | 'bank';
  identifier: string;
  isDefault: boolean;
}

export interface ExpenseItem {
  id: string;
  name: string;
  amount: number;
  category: string;
  assignedTo: string[];
}

export interface Expense {
  id: string;
  title: string;
  description?: string;
  totalAmount: number;
  date: Date;
  paidBy: string;
  groupId: string;
  category: string;
  items: ExpenseItem[];
  splitMethod: 'equal' | 'percentage' | 'custom' | 'itemized';
  splits: ExpenseSplit[];
  tax?: number;
  tip?: number;
  receipt?: string;
  status: 'pending' | 'settled' | 'partially_settled';
  tags: string[];
  isRecurring: boolean;
  recurringConfig?: {
    frequency: 'weekly' | 'monthly' | 'yearly';
    endDate?: Date;
  };
}

export interface ExpenseSplit {
  memberId: string;
  amount: number;
  percentage?: number;
  status: 'pending' | 'paid' | 'confirmed';
  paidAt?: Date;
  paymentMethod?: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  members: string[];
  adminId: string;
  createdAt: Date;
  settings: {
    defaultSplitMethod: 'equal' | 'percentage' | 'custom';
    allowNonMemberExpenses: boolean;
    requireApproval: boolean;
    currency: string;
  };
  avatar?: string;
  totalExpenses: number;
  totalSpent: number;
}

export interface Settlement {
  id: string;
  fromMemberId: string;
  toMemberId: string;
  amount: number;
  groupId: string;
  status: 'pending' | 'sent' | 'received' | 'confirmed';
  createdAt: Date;
  settledAt?: Date;
  paymentMethod?: PaymentMethod;
  notes?: string;
  reminder?: {
    sent: boolean;
    sentAt?: Date;
  };
}

export interface Balance {
  memberId: string;
  groupId: string;
  owes: { [memberId: string]: number };
  owedBy: { [memberId: string]: number };
  netBalance: number;
}

interface BillSplitterState {
  members: Member[];
  groups: Group[];
  expenses: Expense[];
  settlements: Settlement[];
  balances: Balance[];
  currentUser: string | null;
  
  // Actions
  addMember: (member: Omit<Member, 'id'>) => void;
  updateMember: (id: string, updates: Partial<Member>) => void;
  deleteMember: (id: string) => void;
  
  addGroup: (group: Omit<Group, 'id' | 'createdAt' | 'totalExpenses' | 'totalSpent'>) => void;
  updateGroup: (id: string, updates: Partial<Group>) => void;
  deleteGroup: (id: string) => void;
  
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  
  createSettlement: (settlement: Omit<Settlement, 'id' | 'createdAt'>) => void;
  updateSettlement: (id: string, updates: Partial<Settlement>) => void;
  
  calculateBalances: (groupId: string) => void;
  optimizeSettlements: (groupId: string) => Settlement[];
  
  setCurrentUser: (userId: string) => void;
}

export const useBillSplitterStore = create<BillSplitterState>((set, get) => ({
  members: [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
      paymentMethods: [
        { id: '1', type: 'venmo', identifier: '@johndoe', isDefault: true },
        { id: '2', type: 'paypal', identifier: 'john@example.com', isDefault: false }
      ],
      preferences: { defaultSplit: 'equal', notifications: true }
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b332c2a7?w=100&h=100&fit=crop&crop=face',
      paymentMethods: [
        { id: '3', type: 'venmo', identifier: '@janesmith', isDefault: true }
      ],
      preferences: { defaultSplit: 'equal', notifications: true }
    }
  ],
  
  groups: [
    {
      id: '1',
      name: 'Roommates',
      description: 'Shared apartment expenses',
      members: ['1', '2'],
      adminId: '1',
      createdAt: new Date('2024-01-01'),
      settings: {
        defaultSplitMethod: 'equal',
        allowNonMemberExpenses: false,
        requireApproval: false,
        currency: 'USD'
      },
      totalExpenses: 5,
      totalSpent: 1250.00
    }
  ],
  
  expenses: [
    {
      id: '1',
      title: 'Grocery Shopping',
      description: 'Weekly groceries from Whole Foods',
      totalAmount: 156.78,
      date: new Date('2024-01-15'),
      paidBy: '1',
      groupId: '1',
      category: 'Food',
      items: [
        { id: '1', name: 'Vegetables', amount: 45.20, category: 'Produce', assignedTo: ['1', '2'] },
        { id: '2', name: 'Meat', amount: 67.89, category: 'Protein', assignedTo: ['1'] },
        { id: '3', name: 'Dairy', amount: 23.45, category: 'Dairy', assignedTo: ['1', '2'] }
      ],
      splitMethod: 'equal',
      splits: [
        { memberId: '1', amount: 78.39, status: 'confirmed', paidAt: new Date() },
        { memberId: '2', amount: 78.39, status: 'pending' }
      ],
      tax: 12.34,
      tip: 7.90,
      status: 'partially_settled',
      tags: ['groceries', 'weekly'],
      isRecurring: true,
      recurringConfig: { frequency: 'weekly' }
    }
  ],
  
  settlements: [],
  balances: [],
  currentUser: '1',

  addMember: (memberData) => set((state) => ({
    members: [...state.members, { ...memberData, id: uuidv4() }]
  })),

  updateMember: (id, updates) => set((state) => ({
    members: state.members.map(member => 
      member.id === id ? { ...member, ...updates } : member
    )
  })),

  deleteMember: (id) => set((state) => ({
    members: state.members.filter(member => member.id !== id)
  })),

  addGroup: (groupData) => set((state) => ({
    groups: [...state.groups, {
      ...groupData,
      id: uuidv4(),
      createdAt: new Date(),
      totalExpenses: 0,
      totalSpent: 0
    }]
  })),

  updateGroup: (id, updates) => set((state) => ({
    groups: state.groups.map(group => 
      group.id === id ? { ...group, ...updates } : group
    )
  })),

  deleteGroup: (id) => set((state) => ({
    groups: state.groups.filter(group => group.id !== id),
    expenses: state.expenses.filter(expense => expense.groupId !== id)
  })),

  addExpense: (expenseData) => set((state) => {
    const newExpense = { ...expenseData, id: uuidv4() };
    const updatedGroups = state.groups.map(group => 
      group.id === expenseData.groupId 
        ? { 
            ...group, 
            totalExpenses: group.totalExpenses + 1,
            totalSpent: group.totalSpent + expenseData.totalAmount
          }
        : group
    );
    
    return {
      expenses: [...state.expenses, newExpense],
      groups: updatedGroups
    };
  }),

  updateExpense: (id, updates) => set((state) => ({
    expenses: state.expenses.map(expense => 
      expense.id === id ? { ...expense, ...updates } : expense
    )
  })),

  deleteExpense: (id) => set((state) => {
    const expense = state.expenses.find(e => e.id === id);
    if (!expense) return state;
    
    const updatedGroups = state.groups.map(group => 
      group.id === expense.groupId 
        ? { 
            ...group, 
            totalExpenses: Math.max(0, group.totalExpenses - 1),
            totalSpent: Math.max(0, group.totalSpent - expense.totalAmount)
          }
        : group
    );
    
    return {
      expenses: state.expenses.filter(expense => expense.id !== id),
      groups: updatedGroups
    };
  }),

  createSettlement: (settlementData) => set((state) => ({
    settlements: [...state.settlements, {
      ...settlementData,
      id: uuidv4(),
      createdAt: new Date()
    }]
  })),

  updateSettlement: (id, updates) => set((state) => ({
    settlements: state.settlements.map(settlement => 
      settlement.id === id ? { ...settlement, ...updates } : settlement
    )
  })),

  calculateBalances: (groupId) => set((state) => {
    const groupExpenses = state.expenses.filter(e => e.groupId === groupId);
    const group = state.groups.find(g => g.id === groupId);
    if (!group) return state;

    const balances: { [memberId: string]: Balance } = {};
    
    // Initialize balances for all group members
    group.members.forEach(memberId => {
      balances[memberId] = {
        memberId,
        groupId,
        owes: {},
        owedBy: {},
        netBalance: 0
      };
    });

    // Calculate balances from expenses
    groupExpenses.forEach(expense => {
      expense.splits.forEach(split => {
        if (split.status !== 'confirmed' && split.memberId !== expense.paidBy) {
          // Member owes money to the person who paid
          if (!balances[split.memberId].owes[expense.paidBy]) {
            balances[split.memberId].owes[expense.paidBy] = 0;
          }
          balances[split.memberId].owes[expense.paidBy] += split.amount;
          
          // Person who paid is owed money
          if (!balances[expense.paidBy].owedBy[split.memberId]) {
            balances[expense.paidBy].owedBy[split.memberId] = 0;
          }
          balances[expense.paidBy].owedBy[split.memberId] += split.amount;
        }
      });
    });

    // Calculate net balances
    Object.values(balances).forEach(balance => {
      const totalOwed = Object.values(balance.owedBy).reduce((sum, amount) => sum + amount, 0);
      const totalOwes = Object.values(balance.owes).reduce((sum, amount) => sum + amount, 0);
      balance.netBalance = totalOwed - totalOwes;
    });

    return {
      balances: [
        ...state.balances.filter(b => b.groupId !== groupId),
        ...Object.values(balances)
      ]
    };
  }),

  optimizeSettlements: (groupId) => {
    const state = get();
    const balances = state.balances.filter(b => b.groupId === groupId);
    const settlements: Settlement[] = [];
    
    // Simple debt optimization algorithm
    const creditors = balances.filter(b => b.netBalance > 0).sort((a, b) => b.netBalance - a.netBalance);
    const debtors = balances.filter(b => b.netBalance < 0).sort((a, b) => a.netBalance - b.netBalance);
    
    let i = 0, j = 0;
    while (i < creditors.length && j < debtors.length) {
      const creditor = creditors[i];
      const debtor = debtors[j];
      
      const amount = Math.min(creditor.netBalance, Math.abs(debtor.netBalance));
      
      if (amount > 0.01) { // Avoid tiny settlements
        settlements.push({
          id: uuidv4(),
          fromMemberId: debtor.memberId,
          toMemberId: creditor.memberId,
          amount,
          groupId,
          status: 'pending',
          createdAt: new Date()
        });
      }
      
      creditor.netBalance -= amount;
      debtor.netBalance += amount;
      
      if (creditor.netBalance < 0.01) i++;
      if (Math.abs(debtor.netBalance) < 0.01) j++;
    }
    
    return settlements;
  },

  setCurrentUser: (userId) => set({ currentUser: userId })
}));