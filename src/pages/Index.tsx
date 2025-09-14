import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  Users, 
  Receipt, 
  DollarSign, 
  TrendingUp, 
  AlertCircle,
  Settings,
  Search,
  Filter,
  Download,
  Bell,
  CreditCard,
  PieChart,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';
import { ExpenseCard } from '@/components/ExpenseCard';
import { AddExpenseDialog } from '@/components/AddExpenseDialog';
import { useBillSplitterStore, Expense } from '@/store/billSplitterStore';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const Index = () => {
  const { 
    groups, 
    expenses, 
    members, 
    balances, 
    settlements, 
    currentUser,
    calculateBalances,
    optimizeSettlements 
  } = useBillSplitterStore();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(groups[0]?.id || '');
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  // Calculate balances for selected group
  React.useEffect(() => {
    if (selectedGroup) {
      calculateBalances(selectedGroup);
    }
  }, [selectedGroup, expenses, calculateBalances]);

  const currentGroup = groups.find(g => g.id === selectedGroup);
  const groupExpenses = expenses.filter(e => e.groupId === selectedGroup);
  const groupBalances = balances.filter(b => b.groupId === selectedGroup);
  const currentUserBalance = groupBalances.find(b => b.memberId === currentUser);
  
  const filteredExpenses = groupExpenses.filter(expense => {
    const matchesSearch = expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || expense.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const totalOwed = Object.values(currentUserBalance?.owes || {}).reduce((sum, amount) => sum + amount, 0);
  const totalOwedTo = Object.values(currentUserBalance?.owedBy || {}).reduce((sum, amount) => sum + amount, 0);

  const recentExpenses = groupExpenses.slice(0, 5);
  const pendingSettlements = settlements.filter(s => s.groupId === selectedGroup && s.status === 'pending');

  const categories = ['Food', 'Transport', 'Entertainment', 'Utilities', 'Shopping', 'Travel', 'Medical', 'Other'];

  const handleAddExpense = () => {
    setEditingExpense(undefined);
    setShowAddExpense(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setShowAddExpense(true);
  };

  const handleSettleExpense = (expense: Expense) => {
    // Implementation for settling expense
    console.log('Settle expense:', expense);
  };

  const handleOptimizeSettlements = () => {
    if (selectedGroup) {
      const optimizedSettlements = optimizeSettlements(selectedGroup);
      console.log('Optimized settlements:', optimizedSettlements);
    }
  };

  const getDashboardStats = () => {
    const totalSpent = groupExpenses.reduce((sum, e) => sum + e.totalAmount, 0);
    const pendingAmount = groupExpenses
      .filter(e => e.status !== 'settled')
      .reduce((sum, e) => sum + e.totalAmount, 0);
    const settledAmount = totalSpent - pendingAmount;
    
    return {
      totalSpent,
      pendingAmount,
      settledAmount,
      settledPercentage: totalSpent > 0 ? (settledAmount / totalSpent) * 100 : 0
    };
  };

  const stats = getDashboardStats();

  if (!currentGroup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>No Groups Found</CardTitle>
            <CardDescription>Create your first group to start splitting expenses</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button className="gradient-primary">
              <Plus className="h-4 w-4 mr-2" />
              Create Group
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 gradient-primary rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  SplitWise Pro
                </h1>
              </div>
              
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {groups.map(group => (
                    <SelectItem key={group.id} value={group.id}>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span>{group.name}</span>
                        <Badge variant="secondary">{group.members.length} members</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
              <Button onClick={handleAddExpense} className="gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <PieChart className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="expenses" className="flex items-center space-x-2">
              <Receipt className="h-4 w-4" />
              <span>Expenses</span>
            </TabsTrigger>
            <TabsTrigger value="balances" className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4" />
              <span>Balances</span>
            </TabsTrigger>
            <TabsTrigger value="settlements" className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4" />
              <span>Settlements</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Analytics</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="gradient-card shadow-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <DollarSign className="h-4 w-4 mr-2 text-primary" />
                    Total Spent
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">${stats.totalSpent.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground mt-1">This month</p>
                </CardContent>
              </Card>

              <Card className="gradient-card shadow-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <ArrowUpRight className="h-4 w-4 mr-2 text-warning" />
                    You Owe
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-warning">${totalOwed.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground mt-1">To group members</p>
                </CardContent>
              </Card>

              <Card className="gradient-card shadow-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <ArrowDownLeft className="h-4 w-4 mr-2 text-success" />
                    You're Owed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-success">${totalOwedTo.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground mt-1">From group members</p>
                </CardContent>
              </Card>

              <Card className="gradient-card shadow-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2 text-primary" />
                    Settlement Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{stats.settledPercentage.toFixed(0)}%</div>
                  <Progress value={stats.settledPercentage} className="mt-2" />
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="gradient-card shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Receipt className="h-5 w-5 mr-2" />
                    Recent Expenses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentExpenses.map(expense => {
                      const paidBy = members.find(m => m.id === expense.paidBy);
                      return (
                        <div key={expense.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={paidBy?.avatar} />
                              <AvatarFallback className="text-xs">
                                {paidBy?.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{expense.title}</p>
                              <p className="text-xs text-muted-foreground">{expense.category}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${expense.totalAmount.toFixed(2)}</p>
                            <Badge variant={expense.status === 'settled' ? 'default' : 'secondary'} className="text-xs">
                              {expense.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="gradient-card shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <AlertCircle className="h-5 w-5 mr-2" />
                      Quick Actions
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button onClick={handleAddExpense} className="w-full gradient-primary">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Expense
                  </Button>
                  <Button onClick={handleOptimizeSettlements} variant="outline" className="w-full">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Optimize Settlements
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Export Report
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Users className="h-4 w-4 mr-2" />
                    Manage Group
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search expenses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </div>

            {/* Expenses Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredExpenses.map(expense => (
                <ExpenseCard
                  key={expense.id}
                  expense={expense}
                  onEdit={handleEditExpense}
                  onSettle={handleSettleExpense}
                />
              ))}
            </div>

            {filteredExpenses.length === 0 && (
              <div className="text-center py-12">
                <Receipt className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No expenses found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || filterCategory !== 'all' 
                    ? 'Try adjusting your filters'
                    : 'Get started by adding your first expense'
                  }
                </p>
                {!searchTerm && filterCategory === 'all' && (
                  <Button onClick={handleAddExpense} className="gradient-primary">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Expense
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          {/* Other tabs would be implemented similarly */}
          <TabsContent value="balances">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">Balances View</h3>
              <p className="text-muted-foreground">Coming soon...</p>
            </div>
          </TabsContent>

          <TabsContent value="settlements">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">Settlements View</h3>
              <p className="text-muted-foreground">Coming soon...</p>
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">Analytics View</h3>
              <p className="text-muted-foreground">Coming soon...</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add/Edit Expense Dialog */}
      <AddExpenseDialog
        open={showAddExpense}
        onClose={() => setShowAddExpense(false)}
        groupId={selectedGroup}
        editingExpense={editingExpense}
      />
    </div>
  );
};

export default Index;