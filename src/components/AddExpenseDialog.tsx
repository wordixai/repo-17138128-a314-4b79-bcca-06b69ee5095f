import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarIcon, Camera, Plus, Trash2, Users } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { useBillSplitterStore, Expense, ExpenseSplit, ExpenseItem } from '@/store/billSplitterStore';
import { cn } from '@/lib/utils';

interface AddExpenseDialogProps {
  open: boolean;
  onClose: () => void;
  groupId: string;
  editingExpense?: Expense;
}

export function AddExpenseDialog({ open, onClose, groupId, editingExpense }: AddExpenseDialogProps) {
  const { members, groups, addExpense, updateExpense, currentUser } = useBillSplitterStore();
  const group = groups.find(g => g.id === groupId);
  const groupMembers = members.filter(m => group?.members.includes(m.id));

  const [formData, setFormData] = useState({
    title: editingExpense?.title || '',
    description: editingExpense?.description || '',
    totalAmount: editingExpense?.totalAmount || 0,
    date: editingExpense?.date || new Date(),
    paidBy: editingExpense?.paidBy || currentUser || '',
    category: editingExpense?.category || 'Food',
    splitMethod: editingExpense?.splitMethod || 'equal' as 'equal' | 'percentage' | 'custom' | 'itemized',
    tax: editingExpense?.tax || 0,
    tip: editingExpense?.tip || 0,
    tags: editingExpense?.tags.join(', ') || '',
    isRecurring: editingExpense?.isRecurring || false
  });

  const [items, setItems] = useState<ExpenseItem[]>(
    editingExpense?.items || []
  );

  const [customSplits, setCustomSplits] = useState<{ [memberId: string]: number }>(
    editingExpense?.splits.reduce((acc, split) => ({
      ...acc,
      [split.memberId]: split.amount
    }), {}) || {}
  );

  const [selectedMembers, setSelectedMembers] = useState<string[]>(
    editingExpense?.splits.map(s => s.memberId) || groupMembers.map(m => m.id)
  );

  const categories = ['Food', 'Transport', 'Entertainment', 'Utilities', 'Shopping', 'Travel', 'Medical', 'Other'];

  const calculateSplits = (): ExpenseSplit[] => {
    const amount = formData.totalAmount + formData.tax + formData.tip;
    
    switch (formData.splitMethod) {
      case 'equal':
        const equalAmount = amount / selectedMembers.length;
        return selectedMembers.map(memberId => ({
          memberId,
          amount: equalAmount,
          status: memberId === formData.paidBy ? 'confirmed' : 'pending' as const
        }));
      
      case 'custom':
        return selectedMembers.map(memberId => ({
          memberId,
          amount: customSplits[memberId] || 0,
          status: memberId === formData.paidBy ? 'confirmed' : 'pending' as const
        }));
      
      case 'itemized':
        const itemSplits: { [memberId: string]: number } = {};
        items.forEach(item => {
          const splitAmount = item.amount / item.assignedTo.length;
          item.assignedTo.forEach(memberId => {
            itemSplits[memberId] = (itemSplits[memberId] || 0) + splitAmount;
          });
        });
        
        // Add tax and tip proportionally
        const totalItemAmount = items.reduce((sum, item) => sum + item.amount, 0);
        const taxTipTotal = formData.tax + formData.tip;
        
        return Object.entries(itemSplits).map(([memberId, itemAmount]) => {
          const proportion = itemAmount / totalItemAmount;
          const taxTipShare = taxTipTotal * proportion;
          return {
            memberId,
            amount: itemAmount + taxTipShare,
            status: memberId === formData.paidBy ? 'confirmed' : 'pending' as const
          };
        });
      
      default:
        return [];
    }
  };

  const addItem = () => {
    setItems([...items, {
      id: Date.now().toString(),
      name: '',
      amount: 0,
      category: 'Food',
      assignedTo: []
    }]);
  };

  const updateItem = (index: number, updates: Partial<ExpenseItem>) => {
    setItems(items.map((item, i) => i === index ? { ...item, ...updates } : item));
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    const splits = calculateSplits();
    const totalAmount = formData.totalAmount + formData.tax + formData.tip;
    
    const expenseData = {
      ...formData,
      totalAmount,
      groupId,
      items: formData.splitMethod === 'itemized' ? items : [],
      splits,
      status: 'pending' as const,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
    };

    if (editingExpense) {
      updateExpense(editingExpense.id, expenseData);
    } else {
      addExpense(expenseData);
    }
    
    onClose();
  };

  const totalCustomSplit = Object.values(customSplits).reduce((sum, amount) => sum + amount, 0);
  const totalExpenseAmount = formData.totalAmount + formData.tax + formData.tip;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>{editingExpense ? 'Edit' : 'Add New'} Expense</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="split">Split Details</TabsTrigger>
            <TabsTrigger value="items">Items</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Dinner at restaurant"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Optional description"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.totalAmount}
                  onChange={(e) => setFormData({...formData, totalAmount: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div>
                <Label htmlFor="tax">Tax</Label>
                <Input
                  id="tax"
                  type="number"
                  step="0.01"
                  value={formData.tax}
                  onChange={(e) => setFormData({...formData, tax: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div>
                <Label htmlFor="tip">Tip</Label>
                <Input
                  id="tip"
                  type="number"
                  step="0.01"
                  value={formData.tip}
                  onChange={(e) => setFormData({...formData, tip: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(formData.date, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.date}
                      onSelect={(date) => date && setFormData({...formData, date})}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>Paid by</Label>
                <Select value={formData.paidBy} onValueChange={(value) => setFormData({...formData, paidBy: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {groupMembers.map(member => (
                      <SelectItem key={member.id} value={member.id}>
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback className="text-xs">
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span>{member.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({...formData, tags: e.target.value})}
                placeholder="dinner, birthday, celebration"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="recurring"
                checked={formData.isRecurring}
                onCheckedChange={(checked) => setFormData({...formData, isRecurring: !!checked})}
              />
              <Label htmlFor="recurring">This is a recurring expense</Label>
            </div>
          </TabsContent>

          <TabsContent value="split" className="space-y-4">
            <div>
              <Label>Split Method</Label>
              <Select value={formData.splitMethod} onValueChange={(value: any) => setFormData({...formData, splitMethod: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equal">Equal Split</SelectItem>
                  <SelectItem value="custom">Custom Amounts</SelectItem>
                  <SelectItem value="itemized">Item by Item</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Select Members</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {groupMembers.map(member => (
                  <div key={member.id} className="flex items-center space-x-2">
                    <Checkbox
                      checked={selectedMembers.includes(member.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedMembers([...selectedMembers, member.id]);
                        } else {
                          setSelectedMembers(selectedMembers.filter(id => id !== member.id));
                        }
                      }}
                    />
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback className="text-xs">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{member.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {formData.splitMethod === 'custom' && (
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Custom Split Amounts</h4>
                      <Badge variant={Math.abs(totalCustomSplit - totalExpenseAmount) < 0.01 ? 'default' : 'destructive'}>
                        Total: ${totalCustomSplit.toFixed(2)} / ${totalExpenseAmount.toFixed(2)}
                      </Badge>
                    </div>
                    {selectedMembers.map(memberId => {
                      const member = members.find(m => m.id === memberId);
                      return (
                        <div key={memberId} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={member?.avatar} />
                              <AvatarFallback className="text-xs">
                                {member?.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{member?.name}</span>
                          </div>
                          <Input
                            type="number"
                            step="0.01"
                            className="w-24"
                            value={customSplits[memberId] || 0}
                            onChange={(e) => setCustomSplits({
                              ...customSplits,
                              [memberId]: parseFloat(e.target.value) || 0
                            })}
                          />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {formData.splitMethod === 'equal' && (
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Equal Split Preview</h4>
                    {selectedMembers.map(memberId => {
                      const member = members.find(m => m.id === memberId);
                      const amount = totalExpenseAmount / selectedMembers.length;
                      return (
                        <div key={memberId} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={member?.avatar} />
                              <AvatarFallback className="text-xs">
                                {member?.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{member?.name}</span>
                          </div>
                          <span className="font-medium">${amount.toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="items" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Expense Items</h3>
              <Button onClick={addItem} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-12 gap-4 items-start">
                      <div className="col-span-4">
                        <Label htmlFor={`item-name-${index}`}>Item Name</Label>
                        <Input
                          id={`item-name-${index}`}
                          value={item.name}
                          onChange={(e) => updateItem(index, { name: e.target.value })}
                          placeholder="Item name"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor={`item-amount-${index}`}>Amount</Label>
                        <Input
                          id={`item-amount-${index}`}
                          type="number"
                          step="0.01"
                          value={item.amount}
                          onChange={(e) => updateItem(index, { amount: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="col-span-5">
                        <Label>Assigned to</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {groupMembers.map(member => (
                            <Badge
                              key={member.id}
                              variant={item.assignedTo.includes(member.id) ? 'default' : 'outline'}
                              className="cursor-pointer"
                              onClick={() => {
                                const newAssignedTo = item.assignedTo.includes(member.id)
                                  ? item.assignedTo.filter(id => id !== member.id)
                                  : [...item.assignedTo, member.id];
                                updateItem(index, { assignedTo: newAssignedTo });
                              }}
                            >
                              {member.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {items.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No items added yet. Click "Add Item" to get started.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="gradient-primary">
            {editingExpense ? 'Update' : 'Create'} Expense
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}