// =========================
// ✅ Mock Customers Data
// =========================
export const mockCustomers = [
  {
    id: "cust1",
    name: "Acme Corporation",
    email: "accounts@acme.com",
    phone: "+91 9876543210",
    address: "123 Business Park, Mumbai, 400001",
    gstNumber: "27AABCA1234A1Z5",
    active: true,
    companyId: "comp1",
  },
  {
    id: "cust2",
    name: "TechSolutions Ltd",
    email: "finance@techsolutions.com",
    phone: "+91 9876543211",
    address: "456 Tech Hub, Bangalore, 560001",
    gstNumber: "29AABCT5678B1Z3",
    active: false,
    companyId: "comp2",
  },
  {
    id: "cust3",
    name: "Global Traders",
    email: "accounts@globaltraders.com",
    phone: "+91 9876543212",
    address: "789 Trade Center, Delhi, 110001",
    gstNumber: "07AAACG9012C1Z1",
    active: true,
    companyId: "comp3",
  },
  {
    id: "cust4",
    name: "Bright Future Pvt Ltd",
    email: "finance@brightfuture.com",
    phone: "+91 9812345678",
    address: "Green Valley, Hyderabad, 500001",
    gstNumber: "36AAACB1234F1Z5",
    active: true,
    companyId: "comp4",
  },
  {
    id: "cust5",
    name: "NextGen Retailers",
    email: "accounts@nextgenretail.com",
    phone: "+91 9822334455",
    address: "Koramangala, Bangalore, 560034",
    gstNumber: "29AABCN8765G1Z8",
    active: true,
    companyId: "comp2",
  },
  {
    id: "cust6",
    name: "Visionary Industries",
    email: "info@visionaryind.com",
    phone: "+91 9876541234",
    address: "Technopark, Trivandrum, Kerala",
    gstNumber: "32AAACV6543N1Z1",
    active: true,
    companyId: "comp3",
  },
];

// =========================
// ✅ Mock Companies Data
// =========================
export const mockCompanies = [
  {
    id: "comp1",
    name: "Luminar Tech Pvt Ltd",
    address: "Infopark, Kochi, Kerala",
    gstNumber: "32AABCL1234L1Z5",
    prefix: "LUM",
  },
  {
    id: "comp2",
    name: "Qhance Technology Solutions",
    address: "SmartCity, Kakkanad, Kerala",
    gstNumber: "32AAACQ2345Q1Z9",
    prefix: "QHN",
  },
  {
    id: "comp3",
    name: "SoftX Labs Pvt Ltd",
    address: "Technopark, Trivandrum, Kerala",
    gstNumber: "32AAACS5678S1Z4",
    prefix: "SXL",
  },
  {
    id: "comp4",
    name: "Bright Innovations Pvt Ltd",
    address: "Hi-Tech City, Hyderabad, Telangana",
    gstNumber: "36AAACB8765M1Z2",
    prefix: "BRT",
  },
  {
    id: "comp5",
    name: "CloudZen Systems",
    address: "CyberPark, Calicut, Kerala",
    gstNumber: "32AAACC2345C1Z9",
    prefix: "CZ",
  },
];

// =========================
// ✅ Mock Service Types
// =========================
export const mockServiceTypes = [
  {
    id: "serv1",
    name: "Consulting Services",
    description: "Professional consulting and advisory services",
    taxRate: 18,
  },
  {
    id: "serv2",
    name: "Software Development",
    description: "Custom software development services",
    taxRate: 18,
  },
  {
    id: "serv3",
    name: "Training",
    description: "Professional training and skill development",
    taxRate: 12,
  },
  {
    id: "serv4",
    name: "Maintenance",
    description: "Regular maintenance and support services",
    taxRate: 18,
  },
  {
    id: "serv5",
    name: "Cloud Hosting",
    description: "Managed cloud services with monitoring",
    taxRate: 18,
  },
];

// =========================
// ✅ Mock Invoices
// =========================
export const mockInvoices = [
  {
    id: "inv1",
    invoiceNumber: "LUM-001",
    invoiceDate: "2023-05-15",
    customer: "Acme Corporation",
    company: "Luminar Tech Pvt Ltd",
    companyId: "comp1",
    amount: 25000,
    status: "Paid",
    dueDate: "2023-06-15",
  },
  {
    id: "inv2",
    invoiceNumber: "QHN-002",
    invoiceDate: "2023-06-01",
    customer: "TechSolutions Ltd",
    company: "Qhance Technology Solutions",
    companyId: "comp2",
    amount: 35000,
    status: "Pending",
    dueDate: "2023-07-01",
  },
  {
    id: "inv3",
    invoiceNumber: "SXL-003",
    invoiceDate: "2023-06-15",
    customer: "Global Traders",
    company: "SoftX Labs Pvt Ltd",
    companyId: "comp3",
    amount: 18000,
    status: "Overdue",
    dueDate: "2023-07-15",
  },
  {
    id: "inv4",
    invoiceNumber: "LUM-004",
    invoiceDate: "2023-07-10",
    customer: "Acme Corporation",
    company: "Luminar Tech Pvt Ltd",
    companyId: "comp1",
    amount: 22000,
    status: "Pending",
    dueDate: "2023-08-10",
  },
  {
    id: "inv5",
    invoiceNumber: "QHN-005",
    invoiceDate: "2023-07-12",
    customer: "NextGen Retailers",
    company: "Qhance Technology Solutions",
    companyId: "comp2",
    amount: 15000,
    status: "Pending",
    dueDate: "2023-08-12",
  },
  {
    id: "inv6",
    invoiceNumber: "SXL-006",
    invoiceDate: "2023-08-05",
    customer: "Visionary Industries",
    company: "SoftX Labs Pvt Ltd",
    companyId: "comp3",
    amount: 17500,
    status: "Pending",
    dueDate: "2023-09-05",
  },
  {
    id: "inv7",
    invoiceNumber: "BRT-007",
    invoiceDate: "2023-08-20",
    customer: "Bright Future Pvt Ltd",
    company: "Bright Innovations Pvt Ltd",
    companyId: "comp4",
    amount: 21000,
    status: "Pending",
    dueDate: "2023-09-20",
  },
];

// =========================
// ✅ Mock Receipts
// =========================
export const mockReceipts = [
  {
    id: "rct1",
    receiptId: "RCT-2023-001",
    receiptDate: "2023-05-20",
    customer: "Acme Corporation",
    paymentMethod: "Bank Transfer",
    amount: 25000,
    status: "Completed",
    invoices: ["LUM-001"],
  },
  {
    id: "rct2",
    receiptId: "RCT-2023-002",
    receiptDate: "2023-06-05",
    customer: "TechSolutions Ltd",
    paymentMethod: "Cheque",
    amount: 35000,
    status: "Completed",
    invoices: ["QHN-002"],
  },
];

// =========================
// ✅ Mock Credit Notes
// =========================
export const mockCreditNotes = [
  {
    id: "cn1",
    creditNoteId: "CN-2023-001",
    creditNoteDate: "2023-05-25",
    customer: "Acme Corporation",
    invoiceReference: "LUM-001",
    reason: "Discount",
    amount: 2500,
    gstAmount: 450,
    totalCredit: 2950,
    status: "Issued",
  },
  {
    id: "cn2",
    creditNoteId: "CN-2023-002",
    creditNoteDate: "2023-06-10",
    customer: "TechSolutions Ltd",
    invoiceReference: "QHN-002",
    reason: "Return of Goods",
    amount: 5000,
    gstAmount: 600,
    totalCredit: 5600,
    status: "Issued",
  },
];
