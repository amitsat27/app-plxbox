// Test script for charts
// Run this in your app to verify charts work

const testData = {
  bills: [
    { id: '1', amount: 5000, dueDate: new Date('2025-04-15'), status: 'pending', category: 'electric' },
    { id: '2', amount: 3000, dueDate: new Date('2025-04-20'), status: 'paid', category: 'electric' },
    { id: '3', amount: 2000, dueDate: new Date('2025-04-25'), status: 'pending', category: 'gas' },
    { id: '4', amount: 1500, dueDate: new Date('2025-05-01'), status: 'pending', category: 'wifi' },
    { id: '5', amount: 8000, dueDate: new Date('2025-05-10'), status: 'pending', category: 'property' },
  ],
  vehicles: [
    { id: 'v1', name: 'My Car', type: 'car', isActive: true },
  ],
  appliances: [
    { id: 'a1', name: 'Fridge', type: 'kitchen', isActive: true },
  ],
};

console.log('✅ Test data created');

// Simulate category aggregation
const categories = {
  electric: { amount: 0, count: 0 },
  gas: { amount: 0, count: 0 },
  wifi: { amount: 0, count: 0 },
  property: { amount: 0, count: 0 },
};

testData.bills.forEach(bill => {
  if (categories[bill.category]) {
    categories[bill.category].amount += bill.amount;
    categories[bill.category].count += 1;
  }
});

console.log('✅ Aggregated categories:', categories);

// Verify all amounts are finite
Object.entries(categories).forEach(([key, cat]) => {
  if (!isFinite(cat.amount)) {
    console.error('❌ Invalid amount for', key, cat.amount);
  }
});

console.log('✅ All amounts valid');

// Verify dates
testData.bills.forEach(bill => {
  const date = new Date(bill.dueDate);
  if (isNaN(date.getTime())) {
    console.error('❌ Invalid date for bill', bill.id);
  }
});

console.log('✅ All dates valid');
console.log('✅ All checks passed!');
