// Mock customers data
export const mockCustomers = [
  {
    id: "cust1",
    name: "Acme Corporation",
    email: "accounts@acme.com",
    phone: "+91 9876543210",
    address: "123 Business Park, Mumbai, 400001",
    gstNumber: "27AABCA1234A1Z5",
    active: true,
  },
  {
    id: "cust2",
    name: "TechSolutions Ltd",
    email: "finance@techsolutions.com",
    phone: "+91 9876543211",
    address: "456 Tech Hub, Bangalore, 560001",
    gstNumber: "29AABCT5678B1Z3",
    active: false,

  },
  {
    id: "cust3",
    name: "Global Traders",
    email: "accounts@globaltraders.com",
    phone: "+91 9876543212",
    address: "789 Trade Center, Delhi, 110001",
    gstNumber: "07AAACG9012C1Z1",
    active: true,

  }
];
//  Mock companies data
export const mockCompanies = [
  {
    id: "comp1",
    name: "Luminar Tech Pvt Ltd",
    address: "Infopark, Kochi, Kerala",
    gstNumber: "32AABCL1234L1Z5",
    prefix:"LUM"
  },
  {
    id: "comp2",
    name: "Qhance Technology Solutions",
    address: "SmartCity, Kakkanad, Kerala",
    gstNumber: "32AAACQ2345Q1Z9",
    prefix:"QHN"

  },
  {
    id: "comp3",
    name: "SoftX Labs Pvt Ltd",
    address: "Technopark, Trivandrum, Kerala",
    gstNumber: "32AAACS5678S1Z4",
    prefix:"SXL"

  }
];


// Mock service types data
export const mockServiceTypes = [
  {
    id: "serv1",
    name: "Consulting Services",
    description: "Professional consulting and advisory services",
    taxRate: 18
  },
  {
    id: "serv2",
    name: "Software Development",
    description: "Custom software development services",
    taxRate: 18
  },
  {
    id: "serv3",
    name: "Training",
    description: "Professional training and skill development",
    taxRate: 12
  },
  {
    id: "serv4",
    name: "Maintenance",
    description: "Regular maintenance and support services",
    taxRate: 18
  }
];

// Mock invoices data
export const mockInvoices = [
  {
    id: "inv1",
    invoiceNumber: "INV-2023-001",
    invoiceDate: "2023-05-15",
    customer: "Acme Corporation",
    amount: 25000,
    status: "Paid",
    dueDate: "2023-06-15"
  },
  {
    id: "inv2",
    invoiceNumber: "INV-2023-002",
    invoiceDate: "2023-06-01",
    customer: "TechSolutions Ltd",
    amount: 35000,
    status: "Pending",
    dueDate: "2023-07-01"
  },
  {
    id: "inv3",
    invoiceNumber: "INV-2023-003",
    invoiceDate: "2023-06-15",
    customer: "Global Traders",
    amount: 18000,
    status: "Overdue",
    dueDate: "2023-07-15"
  }
];

// Add this to the mock-data.ts file
export const mockReceipts = [
  {
    id: "rct1",
    receiptId: "RCT-2023-001",
    receiptDate: "2023-05-20",
    customer: "Acme Corporation",
    paymentMethod: "Bank Transfer",
    amount: 25000,
    status: "Completed",
    invoices: ["INV-2023-001"]
  },
  {
    id: "rct2",
    receiptId: "RCT-2023-002",
    receiptDate: "2023-06-05",
    customer: "TechSolutions Ltd",
    paymentMethod: "Cheque",
    amount: 35000,
    status: "Completed",
    invoices: ["INV-2023-002"]
  },
  {
    id: "rct3",
    receiptId: "RCT-2023-003",
    receiptDate: "2023-06-18",
    customer: "Global Traders",
    paymentMethod: "UPI",
    amount: 18000,
    status: "Completed",
    invoices: ["INV-2023-003"]
  }
];

// Add this to the mock-data.ts file
export const mockCreditNotes = [
  {
    id: "cn1",
    creditNoteId: "CN-2023-001",
    creditNoteDate: "2023-05-25",
    customer: "Acme Corporation",
    invoiceReference: "INV-2023-001",
    reason: "Discount",
    amount: 2500,
    gstAmount: 450,
    totalCredit: 2950,
    status: "Issued"
  },
  {
    id: "cn2",
    creditNoteId: "CN-2023-002",
    creditNoteDate: "2023-06-10",
    customer: "TechSolutions Ltd",
    invoiceReference: "INV-2023-002",
    reason: "Return of Goods",
    amount: 5000,
    gstAmount: 600,
    totalCredit: 5600,
    status: "Issued"
  },
  {
    id: "cn3",
    creditNoteId: "CN-2023-003",
    creditNoteDate: "2023-06-20",
    customer: "Global Traders",
    invoiceReference: "INV-2023-003",
    reason: "Invoice Correction",
    amount: 1800,
    gstAmount: 90,
    totalCredit: 1890,
    status: "Issued"
  }
]; 