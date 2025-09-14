import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, DollarSign, Users, Receipt, Clock, CheckCircle } from 'lucide-react';
import { Expense, useBillSplitterStore } from '@/store/billSplitterStore';
import { format } from 'date-fns';

interface ExpenseCardProps {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onSettle: (expense: Expense) => void;
}

export function ExpenseCard({ expense, onEdit, onSettle }: ExpenseCardProps) {
  const { members } = useBillSplitterStore();
  const paidByMember = members.find(m => m.id === expense.paidBy);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'settled': return 'bg-success text-success-foreground';
      case 'partially_settled': return 'bg-warning text-warning-foreground';
      default: return 'bg-secondary';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'food': return '🍽️';
      case 'transport': return '🚗';
      case 'entertainment': return '🎬';
      case 'utilities': return '⚡';
      case 'shopping': return '🛍️';
      default: return '💰';
    }
  };

  return (
    <Card className="gradient-card shadow-card hover:shadow-elevated transition-all duration-200 animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{getCategoryIcon(expense.category)}</div>
            <div>
              <CardTitle className="text-lg font-semibold">{expense.title}</CardTitle>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
                <Calendar className="h-4 w-4" />
                <span>{format(expense.date, 'MMM dd, yyyy')}</span>
                {expense.isRecurring && (
                  <Badge variant="outline" className="ml-2">
                    <Clock className="h-3 w-3 mr-1" />
                    Recurring
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Badge className={getStatusColor(expense.status)}>
            {expense.status === 'settled' && <CheckCircle className="h-3 w-3 mr-1" />}
            {expense.status.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <span className="text-2xl font-bold text-primary">
              ${expense.totalAmount.toFixed(2)}
            </span>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Paid by</p>
            <div className="flex items-center space-x-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={paidByMember?.avatar} />
                <AvatarFallback className="text-xs">
                  {paidByMember?.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">{paidByMember?.name}</span>
            </div>
          </div>
        </div>

        {expense.description && (
          <p className="text-sm text-muted-foreground">{expense.description}</p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Split {expense.splits.length} ways • {expense.splitMethod}
            </span>
          </div>
          {expense.receipt && (
            <Badge variant="outline">
              <Receipt className="h-3 w-3 mr-1" />
              Receipt
            </Badge>
          )}
        </div>

        {expense.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {expense.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Split Details</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {expense.splits.map(split => {
              const member = members.find(m => m.id === split.memberId);
              return (
                <div key={split.memberId} className="flex items-center justify-between py-1">
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={member?.avatar} />
                      <AvatarFallback className="text-xs">
                        {member?.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{member?.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">
                      ${split.amount.toFixed(2)}
                    </span>
                    <Badge 
                      variant={split.status === 'confirmed' ? 'default' : 'secondary'}
                      className={split.status === 'confirmed' ? 'bg-success text-success-foreground' : ''}
                    >
                      {split.status}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-4 border-t">
        <div className="flex space-x-2 w-full">
          <Button variant="outline" onClick={() => onEdit(expense)} className="flex-1">
            Edit
          </Button>
          {expense.status !== 'settled' && (
            <Button onClick={() => onSettle(expense)} className="flex-1 gradient-primary">
              Settle
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}