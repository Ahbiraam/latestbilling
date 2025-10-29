import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

export function LineItemsTable({ 
  lineItems, 
  serviceTypes, 
  onAddLineItem, 
  onRemoveLineItem, 
  onLineItemChange 
}) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Line Items</CardTitle>
        <Button onClick={onAddLineItem} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[100px]">Quantity</TableHead>
                <TableHead className="w-[120px]">Rate</TableHead>
                <TableHead className="w-[100px]">Tax Rate</TableHead>
                <TableHead className="w-[120px]">Tax Amount</TableHead>
                <TableHead className="w-[120px]">Amount</TableHead>
                <TableHead className="w-[120px]">Total</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lineItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Select
                      value={item.serviceType}
                      onValueChange={(value) => onLineItemChange(item.id, 'serviceType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select service" />
                      </SelectTrigger>
                      <SelectContent>
                        {serviceTypes.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      value={item.description}
                      onChange={(e) => onLineItemChange(item.id, 'description', e.target.value)}
                      placeholder="Description"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => onLineItemChange(item.id, 'quantity', parseInt(e.target.value) || 0)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.rate}
                      onChange={(e) => onLineItemChange(item.id, 'rate', parseFloat(e.target.value) || 0)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.taxRate}
                        onChange={(e) => onLineItemChange(item.id, 'taxRate', parseFloat(e.target.value) || 0)}
                        className="w-16"
                      />
                      <span className="ml-1">%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatCurrency(item.taxAmount)}
                  </TableCell>
                  <TableCell>
                    {formatCurrency(item.amount)}
                  </TableCell>
                  <TableCell>
                    {formatCurrency(item.total)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveLineItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </>
  );
} 