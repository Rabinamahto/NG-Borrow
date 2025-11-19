// Test data for chat functionality
const testBorrowRequests = [
  {
    id: 'req_001',
    itemName: 'MacBook Pro',
    requesterId: 'user_123',
    requesterName: 'Jane Smith',
    requesterEmail: 'jane@example.com',
    ownerId: 'eN82lLbx2idcNI2beA0eadNLIXW2',
    ownerName: 'Demo User',
    ownerEmail: 'demo@example.com',
    status: 'approved',
    requestDate: new Date().toISOString(),
    approvalDate: new Date().toISOString()
  },
  {
    id: 'req_002', 
    itemName: 'Gaming Console',
    requesterId: 'eN82lLbx2idcNI2beA0eadNLIXW2',
    requesterName: 'Demo User',
    requesterEmail: 'demo@example.com',
    ownerId: 'user_456',
    ownerName: 'John Doe',
    ownerEmail: 'john@example.com',
    status: 'approved',
    requestDate: new Date().toISOString(),
    approvalDate: new Date().toISOString()
  },
  {
    id: 'req_003',
    itemName: 'Camera',
    requesterId: 'user_789',
    requesterName: 'Alice Johnson', 
    requesterEmail: 'alice@example.com',
    ownerId: 'eN82lLbx2idcNI2beA0eadNLIXW2',
    ownerName: 'Demo User',
    ownerEmail: 'demo@example.com',
    status: 'approved',
    requestDate: new Date().toISOString(),
    approvalDate: new Date().toISOString()
  }
];

// Add to localStorage
localStorage.setItem('borrowRequests', JSON.stringify(testBorrowRequests));
console.log('Test borrow requests added to localStorage:', testBorrowRequests);
console.log('Total requests added:', testBorrowRequests.length);
