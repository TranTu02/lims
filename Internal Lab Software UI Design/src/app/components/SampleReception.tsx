import React, { useState } from 'react';
import { Search, AlertCircle, FileText, Truck, Package, Plus } from 'lucide-react';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Pagination } from '@/app/components/ui/pagination';
import { ReceiptDetailModal } from '@/app/components/ReceiptDetailModal';
import { SampleDetailModal } from '@/app/components/SampleDetailModal';
import { CreateReceiptModal } from '@/app/components/CreateReceiptModal';
import { OrdersTab } from '@/app/components/OrdersTab';
import { OrderDetailModal } from '@/app/components/OrderDetailModal';

interface Analysis {
  id: string;
  parameterName: string;
  protocol: string;
  location: string;
  unit: string;
  assignedTo: string;
  deadline: string;
  status: 'pending' | 'in-progress' | 'completed' | 'approved';
  result?: string;
}

interface TestInfo {
  approved: number;
  hasResult: number;
  delivered: number;
  total: number;
}

interface Sample {
  id: string;
  code: string;
  name: string;
  status: 'pending' | 'in-progress' | 'completed';
  testInfo: TestInfo;
  sampleType: string;
  receivedCondition: string;
  storageCondition: string;
  notes: string;
  analyses: Analysis[];
}

interface OrderAnalysis {
  id: string;
  parameterId: string;
  parameterName: string;
  protocolCode?: string | null;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discountRate: number;
  feeBeforeTax: number;
  feeAfterTax: number;
  feeBeforeTaxAndDiscount: number;
  matrixId?: string;
  sampleTypeName?: string;
}

interface OrderSample {
  sampleName: string;
  sampleNote?: string;
  sampleMatrix?: string;
  analyses: OrderAnalysis[];
}

interface Order {
  orderId: string;
  quoteId?: string;
  clientId: string;
  client: {
    clientId: string;
    clientName: string;
    legalId: string;
    clientAddress: string;
    clientPhone: string;
    clientEmail: string;
    invoiceInfo?: {
      taxCode: string;
      taxName: string;
      taxEmail: string;
      taxAddress: string;
    };
  };
  contactPerson: {
    contactId?: string;
    contactName: string;
    contactPhone: string;
    contactEmail: string;
    contactAddress?: string;
  };
  salePerson?: string;
  salePersonId?: string;
  samples: OrderSample[];
  totalAmount: string;
  totalFeeBeforeTax: string;
  totalTaxValue: string;
  totalDiscountValue: string;
  orderStatus: string;
  paymentStatus?: string | null;
  createdAt: string;
  modifiedAt?: string;
  receiptId?: string; // Nếu có thì đã tạo phiếu tiếp nhận
}

interface Receipt {
  id: string;
  receiptCode: string;
  customer: string;
  receivedDate: string;
  receivedTime: string;
  receivedBy: string;
  deadline: string;
  daysLeft: number;
  status: 'new' | 'processing' | 'completed' | 'overdue';
  sampleImages: {
    id: string;
    url: string;
    caption: string;
    uploadedDate: string;
  }[];
  attachedFiles: {
    id: string;
    name: string;
    type: string;
    size: string;
    uploadedBy: string;
    uploadedDate: string;
  }[];
  samples: Sample[];
  customerType: 'company' | 'individual';
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  requestType: string;
  paymentStatus: string;
  notes: string;
  trackingNumbers?: string[];
  completedSamples?: number;
}

// Mock Orders Data
const mockOrders: Order[] = [
  {
    orderId: "DH26C0256",
    quoteId: "",
    clientId: "Cx8526562596",
    client: {
      clientId: "Cx8526562596",
      legalId: "0311711172",
      clientName: "CÔNG TY TNHH THƯƠNG MẠI NUTRI MIỀN NAM",
      clientEmail: "nutri@gmail.com",
      clientPhone: "0888545858",
      clientAddress: "H62 Dương Thị Giang, Phường Đông Hưng Thuận, TP Hồ Chí Minh, Việt Nam.",
      invoiceInfo: {
        taxCode: "0311711172",
        taxName: "CÔNG TY TNHH THƯƠNG MẠI NUTRI MIỀN NAM",
        taxEmail: "",
        taxAddress: "H62 Dương Thị Giang, Phường Đông Hưng Thuận, TP Hồ Chí Minh, Việt Nam."
      }
    },
    contactPerson: {
      contactId: "",
      contactName: "NUTRI",
      contactEmail: "nutri@gmail.com",
      contactPhone: "0888545858",
      contactAddress: ""
    },
    salePerson: "Trần Quang Tú",
    salePersonId: "IDx0dc77",
    samples: [
      {
        sampleName: "Mẫu thực phẩm bảo vệ sức khỏe",
        sampleNote: "Kiểm tra chất lượng TPBVSK",
        sampleMatrix: "Water",
        analyses: [
          {
            id: "restored-analysis-1",
            parameterId: "PM4220ca",
            parameterName: "Xơ dinh dưỡng",
            protocolCode: null,
            quantity: 1,
            unitPrice: 989999,
            taxRate: 5,
            discountRate: 0,
            feeBeforeTax: 989999,
            feeAfterTax: 1039498.95,
            feeBeforeTaxAndDiscount: 989999,
            sampleTypeName: "Thực phẩm"
          },
          {
            id: "restored-analysis-2",
            parameterId: "PM70f9b5",
            parameterName: "Xơ thô",
            protocolCode: null,
            quantity: 1,
            unitPrice: 220000,
            taxRate: 5,
            discountRate: 0,
            feeBeforeTax: 220000,
            feeAfterTax: 231000,
            feeBeforeTaxAndDiscount: 220000,
            sampleTypeName: "Thực phẩm"
          },
          {
            id: "restored-analysis-3",
            parameterId: "PM9593ae",
            parameterName: "Zeranol",
            protocolCode: null,
            quantity: 1,
            unitPrice: 660000,
            taxRate: 5,
            discountRate: 0,
            feeBeforeTax: 660000,
            feeAfterTax: 693000,
            feeBeforeTaxAndDiscount: 660000,
            sampleTypeName: "Thực phẩm"
          },
          {
            id: "restored-analysis-4",
            parameterId: "PMf241c8",
            parameterName: "Độ trong và tạp chất bằng mắt thường",
            protocolCode: null,
            quantity: 1,
            unitPrice: 33000,
            taxRate: 5,
            discountRate: 0,
            feeBeforeTax: 33000,
            feeAfterTax: 34650,
            feeBeforeTaxAndDiscount: 33000,
            sampleTypeName: "Thực phẩm"
          },
          {
            id: "temp-analysis-5",
            parameterId: "PM25ef4d",
            parameterName: "Alpha Arbutin",
            protocolCode: null,
            matrixId: "MAT3de81fa6",
            quantity: 1,
            unitPrice: 550000,
            taxRate: 5,
            discountRate: 0,
            feeBeforeTax: 550000,
            feeAfterTax: 577500,
            feeBeforeTaxAndDiscount: 550000,
            sampleTypeName: "Mặc định"
          },
          {
            id: "temp-analysis-6",
            parameterId: "PM6a87eb",
            parameterName: "Acid hypochlorous",
            protocolCode: null,
            matrixId: "MAT5e971440",
            quantity: 1,
            unitPrice: 990000,
            taxRate: 5,
            discountRate: 0,
            feeBeforeTax: 990000,
            feeAfterTax: 1039500,
            feeBeforeTaxAndDiscount: 990000,
            sampleTypeName: "Thực phẩm"
          },
          {
            id: "temp-analysis-7",
            parameterId: "PMe4e39f",
            parameterName: "Acid Sialic",
            protocolCode: null,
            matrixId: "MAT0f8e84cd",
            quantity: 1,
            unitPrice: 1870000,
            taxRate: 5,
            discountRate: 0,
            feeBeforeTax: 1870000,
            feeAfterTax: 1963500,
            feeBeforeTaxAndDiscount: 1870000,
            sampleTypeName: "Yến"
          }
        ]
      }
    ],
    totalAmount: "5578648.95",
    totalFeeBeforeTax: "5312999",
    totalTaxValue: "265649.95",
    totalDiscountValue: "0",
    orderStatus: "pending",
    paymentStatus: null,
    createdAt: "2026-01-15T04:53:28.258Z",
    modifiedAt: "2026-01-15T04:53:28.258Z"
  },
  {
    orderId: "DH26C0257",
    quoteId: "",
    clientId: "Cx1234567890",
    client: {
      clientId: "Cx1234567890",
      legalId: "0123456789",
      clientName: "CÔNG TY CP ĐẦU TƯ VÀ PHÁT TRIỂN ABC",
      clientEmail: "contact@abc.com.vn",
      clientPhone: "0281234567",
      clientAddress: "123 Đường Nguyễn Văn A, Quận 1, TP.HCM",
      invoiceInfo: {
        taxCode: "0123456789",
        taxName: "CÔNG TY CP ĐẦU TƯ VÀ PHÁT TRIỂN ABC",
        taxEmail: "invoice@abc.com.vn",
        taxAddress: "123 Đường Nguyễn Văn A, Quận 1, TP.HCM"
      }
    },
    contactPerson: {
      contactId: "CT001",
      contactName: "Nguyễn Văn A",
      contactEmail: "nguyenvana@abc.com.vn",
      contactPhone: "0901234567",
      contactAddress: ""
    },
    salePerson: "Lê Thị Mai",
    salePersonId: "IDx1234",
    samples: [
      {
        sampleName: "Nước thải công nghiệp",
        sampleNote: "Kiểm tra định kỳ",
        sampleMatrix: "Water",
        analyses: [
          {
            id: "analysis-1",
            parameterId: "PM001",
            parameterName: "pH",
            protocolCode: "TCVN 6492:2011",
            quantity: 1,
            unitPrice: 100000,
            taxRate: 10,
            discountRate: 0,
            feeBeforeTax: 100000,
            feeAfterTax: 110000,
            feeBeforeTaxAndDiscount: 100000,
            sampleTypeName: "Nước thải"
          },
          {
            id: "analysis-2",
            parameterId: "PM002",
            parameterName: "COD",
            protocolCode: "TCVN 6491:2011",
            quantity: 1,
            unitPrice: 150000,
            taxRate: 10,
            discountRate: 0,
            feeBeforeTax: 150000,
            feeAfterTax: 165000,
            feeBeforeTaxAndDiscount: 150000,
            sampleTypeName: "Nước thải"
          },
          {
            id: "analysis-3",
            parameterId: "PM003",
            parameterName: "BOD5",
            protocolCode: "TCVN 6001:2008",
            quantity: 1,
            unitPrice: 200000,
            taxRate: 10,
            discountRate: 0,
            feeBeforeTax: 200000,
            feeAfterTax: 220000,
            feeBeforeTaxAndDiscount: 200000,
            sampleTypeName: "Nước thải"
          }
        ]
      }
    ],
    totalAmount: "495000",
    totalFeeBeforeTax: "450000",
    totalTaxValue: "45000",
    totalDiscountValue: "0",
    orderStatus: "confirmed",
    paymentStatus: "paid",
    createdAt: "2026-01-14T08:30:00.000Z",
    modifiedAt: "2026-01-14T09:00:00.000Z",
    receiptId: "1" // Đã tạo phiếu tiếp nhận
  },
  {
    orderId: "DH26C0258",
    quoteId: "",
    clientId: "Cx9876543210",
    client: {
      clientId: "Cx9876543210",
      legalId: "9876543210",
      clientName: "CTY TNHH SẢN XUẤT THỰC PHẨM XYZ",
      clientEmail: "info@xyz.vn",
      clientPhone: "0289876543",
      clientAddress: "456 Đường Lê Văn Việt, Quận 9, TP.HCM",
      invoiceInfo: {
        taxCode: "9876543210",
        taxName: "CTY TNHH SẢN XUẤT THỰC PHẨM XYZ",
        taxEmail: "",
        taxAddress: "456 Đường Lê Văn Việt, Quận 9, TP.HCM"
      }
    },
    contactPerson: {
      contactId: "CT002",
      contactName: "Trần Thị B",
      contactEmail: "tranthib@xyz.vn",
      contactPhone: "0912345678",
      contactAddress: ""
    },
    salePerson: "Phạm Văn C",
    salePersonId: "IDx5678",
    samples: [
      {
        sampleName: "Sản phẩm dinh dưỡng A",
        sampleNote: "Kiểm tra trước khi xuất khẩu",
        sampleMatrix: "Food",
        analyses: [
          {
            id: "analysis-4",
            parameterId: "PM004",
            parameterName: "Protein",
            protocolCode: "AOAC 2001.11",
            quantity: 2,
            unitPrice: 300000,
            taxRate: 8,
            discountRate: 5,
            feeBeforeTax: 570000,
            feeAfterTax: 615600,
            feeBeforeTaxAndDiscount: 600000,
            sampleTypeName: "TPBVSK"
          },
          {
            id: "analysis-5",
            parameterId: "PM005",
            parameterName: "Chất béo",
            protocolCode: "TCVN 12055:2017",
            quantity: 2,
            unitPrice: 250000,
            taxRate: 8,
            discountRate: 5,
            feeBeforeTax: 475000,
            feeAfterTax: 513000,
            feeBeforeTaxAndDiscount: 500000,
            sampleTypeName: "TPBVSK"
          }
        ]
      },
      {
        sampleName: "Sản phẩm dinh dưỡng B",
        sampleNote: "Mẫu lô mới",
        sampleMatrix: "Food",
        analyses: [
          {
            id: "analysis-6",
            parameterId: "PM006",
            parameterName: "Vitamin C",
            protocolCode: "AOAC 967.21",
            quantity: 1,
            unitPrice: 400000,
            taxRate: 8,
            discountRate: 0,
            feeBeforeTax: 400000,
            feeAfterTax: 432000,
            feeBeforeTaxAndDiscount: 400000,
            sampleTypeName: "TPBVSK"
          }
        ]
      }
    ],
    totalAmount: "1560600",
    totalFeeBeforeTax: "1445000",
    totalTaxValue: "115600",
    totalDiscountValue: "55000",
    orderStatus: "pending",
    paymentStatus: null,
    createdAt: "2026-01-16T10:15:00.000Z",
    modifiedAt: "2026-01-16T10:15:00.000Z"
  }
];

const mockReceipts: Receipt[] = [
  {
    id: '1',
    receiptCode: 'TNM2501-001',
    customer: 'Công ty TNHH ABC',
    receivedDate: '15/01/2026',
    receivedTime: '09:30',
    receivedBy: 'Hoàng Văn E',
    deadline: '20/01/2026',
    daysLeft: 2,
    status: 'processing',
    sampleImages: [
      {
        id: 'img1',
        url: 'https://images.unsplash.com/photo-1582719471863-f4c7006280cd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYWJvcmF0b3J5JTIwc2FtcGxlJTIwdGVzdHxlbnwxfHx8fDE3Njg3Mjk4Mzl8MA&ixlib=rb-4.1.0&q=80&w=1080',
        caption: 'Mẫu nước thải được thu tại hiện trường',
        uploadedDate: '15/01/2026 09:35'
      },
      {
        id: 'img2',
        url: 'https://images.unsplash.com/photo-1698664434322-94a43b98b9ba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3YXRlciUyMHNhbXBsZSUyMGJvdHRsZXxlbnwxfHx8fDE3Njg3Mjk4NDF8MA&ixlib=rb-4.1.0&q=80&w=1080',
        caption: 'Chai đựng mẫu đã được niêm phong',
        uploadedDate: '15/01/2026 09:36'
      },
      {
        id: 'img3',
        url: 'https://images.unsplash.com/photo-1606206605628-0a09580d44a1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZXN0JTIwdHViZXMlMjBsYWJvcmF0b3J5fGVufDF8fHx8MTc2ODcyOTgzOXww&ixlib=rb-4.1.0&q=80&w=1080',
        caption: 'Mẫu đợc chuẩn bị trong phòng lab',
        uploadedDate: '15/01/2026 09:40'
      },
      {
        id: 'img4',
        url: 'https://images.unsplash.com/photo-1767788215225-40ccf2a747b5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzY2llbnRpZmljJTIwc2FtcGxlfGVufDF8fHx8MTc2ODcyOTgzOXww&ixlib=rb-4.1.0&q=80&w=1080',
        caption: 'Phân tích mẫu trong phòng thí nghiệm',
        uploadedDate: '15/01/2026 09:45'
      }
    ],
    attachedFiles: [
      {
        id: 'file1',
        name: 'Giấy yêu cầu thử nghiệm.pdf',
        type: 'PDF',
        size: '2.5 MB',
        uploadedBy: 'Hoàng Văn E',
        uploadedDate: '15/01/2026'
      },
      {
        id: 'file2',
        name: 'Hợp đồng dịch vụ.pdf',
        type: 'PDF',
        size: '1.8 MB',
        uploadedBy: 'Hoàng Văn E',
        uploadedDate: '15/01/2026'
      }
    ],
    samples: [
      {
        id: 's1',
        code: 'TNM2501-001-S01',
        name: 'Mẫu nước thải điểm 1',
        status: 'in-progress',
        testInfo: { approved: 1, hasResult: 2, delivered: 1, total: 3 },
        sampleType: 'Nước thải',
        receivedCondition: 'Đạt yêu cầu',
        storageCondition: 'Lạnh',
        notes: 'Mẫu được lấy từ điểm 1',
        analyses: [
          {
            id: 'a1',
            parameterName: 'pH',
            protocol: 'ISO 11888-1',
            location: 'Lab 1',
            unit: 'pH',
            assignedTo: 'Nguyễn Văn A',
            deadline: '16/01/2026',
            status: 'approved',
            result: '7.5',
          },
          {
            id: 'a2',
            parameterName: 'COD',
            protocol: 'ISO 6060',
            location: 'Lab 2',
            unit: 'mg/L',
            assignedTo: 'Nguyễn Văn B',
            deadline: '17/01/2026',
            status: 'completed',
            result: '150',
          },
          {
            id: 'a3',
            parameterName: 'BOD',
            protocol: 'ISO 5815',
            location: 'Lab 3',
            unit: 'mg/L',
            assignedTo: 'Nguyễn Văn C',
            deadline: '18/01/2026',
            status: 'in-progress',
          },
        ],
      },
      {
        id: 's2',
        code: 'TNM2501-001-S02',
        name: 'Mẫu nước thải điểm 2',
        status: 'in-progress',
        testInfo: { approved: 1, hasResult: 2, delivered: 1, total: 2 },
        sampleType: 'Nước thải',
        receivedCondition: 'Đạt yêu cầu',
        storageCondition: 'Lạnh',
        notes: 'Mẫu được lấy từ điểm 2',
        analyses: [
          {
            id: 'a4',
            parameterName: 'pH',
            protocol: 'ISO 11888-1',
            location: 'Lab 1',
            unit: 'pH',
            assignedTo: 'Nguyễn Văn A',
            deadline: '16/01/2026',
            status: 'approved',
            result: '7.5',
          },
          {
            id: 'a5',
            parameterName: 'COD',
            protocol: 'ISO 6060',
            location: 'Lab 2',
            unit: 'mg/L',
            assignedTo: 'Nguyễn Văn B',
            deadline: '17/01/2026',
            status: 'completed',
            result: '150',
          },
          {
            id: 'a6',
            parameterName: 'BOD',
            protocol: 'ISO 5815',
            location: 'Lab 3',
            unit: 'mg/L',
            assignedTo: 'Nguyễn Văn C',
            deadline: '18/01/2026',
            status: 'in-progress',
          },
        ],
      },
      {
        id: 's3',
        code: 'TNM2501-001-S03',
        name: 'Mẫu nước thải điểm 3',
        status: 'pending',
        testInfo: { approved: 0, hasResult: 0, delivered: 0, total: 2 },
        sampleType: 'Nước thải',
        receivedCondition: 'Đạt yêu cầu',
        storageCondition: 'Lạnh',
        notes: 'Mẫu được lấy từ điểm 3',
        analyses: [
          {
            id: 'a7',
            parameterName: 'pH',
            protocol: 'ISO 11888-1',
            location: 'Lab 1',
            unit: 'pH',
            assignedTo: 'Nguyễn Văn A',
            deadline: '16/01/2026',
            status: 'approved',
            result: '7.5',
          },
          {
            id: 'a8',
            parameterName: 'COD',
            protocol: 'ISO 6060',
            location: 'Lab 2',
            unit: 'mg/L',
            assignedTo: 'Nguyễn Văn B',
            deadline: '17/01/2026',
            status: 'completed',
            result: '150',
          },
          {
            id: 'a9',
            parameterName: 'BOD',
            protocol: 'ISO 5815',
            location: 'Lab 3',
            unit: 'mg/L',
            assignedTo: 'Nguyễn Văn C',
            deadline: '18/01/2026',
            status: 'in-progress',
          },
        ],
      },
    ],
    customerType: 'company',
    contactPerson: 'Nguyễn Văn D',
    phone: '0901234567',
    email: 'contact@abc.com',
    address: '123 Đường ABC, Quận 1, TP.HCM',
    requestType: 'Kiểm tra chất lượng nước thải',
    paymentStatus: 'Đã thanh toán',
    notes: 'Yêu cầu kiểm tra chất lượng nước thải từ 3 điểm khác nhau',
  },
  {
    id: '2',
    receiptCode: 'TNM2501-002',
    customer: 'Cá nhân Nguyễn Văn B',
    receivedDate: '16/01/2026',
    receivedTime: '14:15',
    receivedBy: 'Hoàng Văn E',
    deadline: '18/01/2026',
    daysLeft: -1,
    status: 'overdue',
    samples: [
      {
        id: 's4',
        code: 'TNM2501-002-S01',
        name: 'Mẫu nước sinh hoạt',
        status: 'completed',
        testInfo: { approved: 2, hasResult: 2, delivered: 2, total: 2 },
        sampleType: 'Nước sinh hoạt',
        receivedCondition: 'Đạt yêu cầu',
        storageCondition: 'Lạnh',
        notes: 'Mẫu được lấy từ nhà của khách hàng',
        analyses: [
          {
            id: 'a10',
            parameterName: 'pH',
            protocol: 'ISO 11888-1',
            location: 'Lab 1',
            unit: 'pH',
            assignedTo: 'Nguyễn Văn A',
            deadline: '16/01/2026',
            status: 'approved',
            result: '7.5',
          },
          {
            id: 'a11',
            parameterName: 'COD',
            protocol: 'ISO 6060',
            location: 'Lab 2',
            unit: 'mg/L',
            assignedTo: 'Nguyễn Văn B',
            deadline: '17/01/2026',
            status: 'completed',
            result: '150',
          },
          {
            id: 'a12',
            parameterName: 'BOD',
            protocol: 'ISO 5815',
            location: 'Lab 3',
            unit: 'mg/L',
            assignedTo: 'Nguyễn Văn C',
            deadline: '18/01/2026',
            status: 'in-progress',
          },
        ],
      },
    ],
    customerType: 'individual',
    contactPerson: 'Nguyễn Văn B',
    phone: '0902345678',
    email: 'nguyenvanb@gmail.com',
    address: '456 Đường XYZ, Quận 3, TP.HCM',
    requestType: 'Kiểm tra chất lượng nước sinh hoạt',
    paymentStatus: 'Đã thanh toán',
    notes: 'Yêu cầu kiểm tra chất lượng nước sinh hoạt từ nhà của khách hàng',
  },
  {
    id: '3',
    receiptCode: 'TNM2501-003',
    customer: 'Công ty CP XYZ',
    receivedDate: '17/01/2026',
    receivedTime: '10:00',
    receivedBy: 'Hoàng Văn E',
    deadline: '25/01/2026',
    daysLeft: 7,
    status: 'new',
    samples: [
      {
        id: 's5',
        code: 'TNM2501-003-S01',
        name: 'Mẫu đất nông nghiệp 01',
        status: 'pending',
        testInfo: { approved: 0, hasResult: 0, delivered: 0, total: 3 },
        sampleType: 'Đất nông nghiệp',
        receivedCondition: 'Đạt yêu cầu',
        storageCondition: 'Lạnh',
        notes: 'Mẫu được lấy từ khu vực nông nghiệp 01',
        analyses: [
          {
            id: 'a13',
            parameterName: 'pH',
            protocol: 'ISO 11888-1',
            location: 'Lab 1',
            unit: 'pH',
            assignedTo: 'Nguyễn Văn A',
            deadline: '16/01/2026',
            status: 'approved',
            result: '7.5',
          },
          {
            id: 'a14',
            parameterName: 'COD',
            protocol: 'ISO 6060',
            location: 'Lab 2',
            unit: 'mg/L',
            assignedTo: 'Nguyễn Văn B',
            deadline: '17/01/2026',
            status: 'completed',
            result: '150',
          },
          {
            id: 'a15',
            parameterName: 'BOD',
            protocol: 'ISO 5815',
            location: 'Lab 3',
            unit: 'mg/L',
            assignedTo: 'Nguyễn Văn C',
            deadline: '18/01/2026',
            status: 'in-progress',
          },
        ],
      },
      {
        id: 's6',
        code: 'TNM2501-003-S02',
        name: 'Mẫu đất nông nghiệp 02',
        status: 'pending',
        testInfo: { approved: 0, hasResult: 0, delivered: 0, total: 2 },
        sampleType: 'Đất nông nghiệp',
        receivedCondition: 'Đạt yêu cầu',
        storageCondition: 'Lạnh',
        notes: 'Mẫu được lấy từ khu vực nông nghiệp 02',
        analyses: [
          {
            id: 'a16',
            parameterName: 'pH',
            protocol: 'ISO 11888-1',
            location: 'Lab 1',
            unit: 'pH',
            assignedTo: 'Nguyễn Văn A',
            deadline: '16/01/2026',
            status: 'approved',
            result: '7.5',
          },
          {
            id: 'a17',
            parameterName: 'COD',
            protocol: 'ISO 6060',
            location: 'Lab 2',
            unit: 'mg/L',
            assignedTo: 'Nguyễn Văn B',
            deadline: '17/01/2026',
            status: 'completed',
            result: '150',
          },
          {
            id: 'a18',
            parameterName: 'BOD',
            protocol: 'ISO 5815',
            location: 'Lab 3',
            unit: 'mg/L',
            assignedTo: 'Nguyễn Văn C',
            deadline: '18/01/2026',
            status: 'in-progress',
          },
        ],
      },
    ],
    customerType: 'company',
    contactPerson: 'Nguyễn Văn D',
    phone: '0901234567',
    email: 'contact@abc.com',
    address: '123 Đường ABC, Quận 1, TP.HCM',
    requestType: 'Kiểm tra chất lượng đất nông nghiệp',
    paymentStatus: 'Đã thanh toán',
    notes: 'Yêu cầu kiểm tra chất lượng đất nông nghiệp từ 2 khu vực khác nhau',
  },
];

const mockReturnResults: Receipt[] = [
  {
    id: '4',
    receiptCode: 'TNM2501-004',
    customer: 'Công ty TNHH DEF',
    receivedDate: '15/01/2026',
    receivedTime: '08:30',
    receivedBy: 'Hoàng Văn E',
    deadline: '22/01/2026',
    daysLeft: 4,
    status: 'completed',
    trackingNumbers: ['VN123456789'],
    address: '123 Đường ABC, Quận 1, TP.HCM',
    phone: '0901234567',
    email: 'contact@def.com',
    samples: [
      {
        id: 's7',
        code: 'TNM2501-004-S01',
        name: 'Mẫu nước giếng',
        status: 'completed',
        testInfo: { approved: 2, hasResult: 2, delivered: 2, total: 2 },
        sampleType: 'Nước giếng',
        receivedCondition: 'Đạt yêu cầu',
        storageCondition: 'Lạnh',
        notes: 'Mẫu được lấy từ giếng nước',
        analyses: [
          {
            id: 'a19',
            parameterName: 'pH',
            protocol: 'ISO 11888-1',
            location: 'Lab 1',
            unit: 'pH',
            assignedTo: 'Nguyễn Văn A',
            deadline: '16/01/2026',
            status: 'approved',
            result: '7.5',
          },
          {
            id: 'a20',
            parameterName: 'COD',
            protocol: 'ISO 6060',
            location: 'Lab 2',
            unit: 'mg/L',
            assignedTo: 'Nguyễn Văn B',
            deadline: '17/01/2026',
            status: 'completed',
            result: '150',
          },
          {
            id: 'a21',
            parameterName: 'BOD',
            protocol: 'ISO 5815',
            location: 'Lab 3',
            unit: 'mg/L',
            assignedTo: 'Nguyễn Văn C',
            deadline: '18/01/2026',
            status: 'in-progress',
          },
        ],
      },
    ],
    completedSamples: 1,
    customerType: 'company',
    contactPerson: 'Nguyễn Văn D',
    requestType: 'Kiểm tra chất lượng nước giếng',
    paymentStatus: 'Đã thanh toán',
    notes: 'Yêu cầu kiểm tra chất lượng nước giếng',
    sampleImages: [],
    attachedFiles: [],
  },
  {
    id: '5',
    receiptCode: 'TNM2501-005',
    customer: 'Cá nhân Trần Thị C',
    receivedDate: '16/01/2026',
    receivedTime: '11:00',
    receivedBy: 'Hoàng Văn E',
    deadline: '20/01/2026',
    daysLeft: 2,
    status: 'completed',
    trackingNumbers: [],
    address: '456 Đường XYZ, Quận 3, TP.HCM',
    phone: '0902345678',
    email: 'tranthic@gmail.com',
    samples: [
      {
        id: 's8',
        code: 'TNM2501-005-S01',
        name: 'Mẫu nước máy',
        status: 'completed',
        testInfo: { approved: 2, hasResult: 2, delivered: 2, total: 2 },
        sampleType: 'Nước máy',
        receivedCondition: 'Đạt yêu cầu',
        storageCondition: 'Lạnh',
        notes: 'Mẫu được lấy từ máy nước',
        analyses: [
          {
            id: 'a22',
            parameterName: 'pH',
            protocol: 'ISO 11888-1',
            location: 'Lab 1',
            unit: 'pH',
            assignedTo: 'Nguyễn Văn A',
            deadline: '16/01/2026',
            status: 'approved',
            result: '7.5',
          },
          {
            id: 'a23',
            parameterName: 'COD',
            protocol: 'ISO 6060',
            location: 'Lab 2',
            unit: 'mg/L',
            assignedTo: 'Nguyễn Văn B',
            deadline: '17/01/2026',
            status: 'completed',
            result: '150',
          },
          {
            id: 'a24',
            parameterName: 'BOD',
            protocol: 'ISO 5815',
            location: 'Lab 3',
            unit: 'mg/L',
            assignedTo: 'Nguyễn Văn C',
            deadline: '18/01/2026',
            status: 'in-progress',
          },
        ],
      },
    ],
    completedSamples: 1,
    customerType: 'individual',
    contactPerson: 'Trần Thị C',
    requestType: 'Kiểm tra chất lượng nước máy',
    paymentStatus: 'Đã thanh toán',
    notes: 'Yêu cầu kiểm tra chất lượng nước máy',
    sampleImages: [],
    attachedFiles: [],
  },
  {
    id: '6',
    receiptCode: 'TNM2412-050',
    customer: 'Công ty TNHH GHI',
    receivedDate: '20/12/2025',
    receivedTime: '14:30',
    receivedBy: 'Hoàng Văn E',
    deadline: '28/12/2025',
    daysLeft: -21,
    status: 'completed',
    trackingNumbers: ['VN987654321', 'VN987654322'],
    address: '789 Đường DEF, Quận 5, TP.HCM',
    phone: '0903456789',
    email: 'info@ghi.com.vn',
    samples: [
      {
        id: 's9',
        code: 'TNM2412-050-S01',
        name: 'Mẫu thực phẩm',
        status: 'completed',
        testInfo: { approved: 5, hasResult: 5, delivered: 5, total: 5 },
        sampleType: 'Thực phẩm',
        receivedCondition: 'Đạt yêu cầu',
        storageCondition: 'Lạnh',
        notes: 'Mẫu được lấy từ thực phẩm',
        analyses: [
          {
            id: 'a25',
            parameterName: 'pH',
            protocol: 'ISO 11888-1',
            location: 'Lab 1',
            unit: 'pH',
            assignedTo: 'Nguyễn Văn A',
            deadline: '16/01/2026',
            status: 'approved',
            result: '7.5',
          },
          {
            id: 'a26',
            parameterName: 'COD',
            protocol: 'ISO 6060',
            location: 'Lab 2',
            unit: 'mg/L',
            assignedTo: 'Nguyễn Văn B',
            deadline: '17/01/2026',
            status: 'completed',
            result: '150',
          },
          {
            id: 'a27',
            parameterName: 'BOD',
            protocol: 'ISO 5815',
            location: 'Lab 3',
            unit: 'mg/L',
            assignedTo: 'Nguyễn Văn C',
            deadline: '18/01/2026',
            status: 'in-progress',
          },
        ],
      },
      {
        id: 's10',
        code: 'TNM2412-050-S02',
        name: 'Mẫu thực phẩm 02',
        status: 'completed',
        testInfo: { approved: 3, hasResult: 3, delivered: 3, total: 3 },
        sampleType: 'Thực phẩm',
        receivedCondition: 'Đạt yêu cầu',
        storageCondition: 'Lạnh',
        notes: 'Mẫu được lấy từ thực phẩm 02',
        analyses: [
          {
            id: 'a28',
            parameterName: 'pH',
            protocol: 'ISO 11888-1',
            location: 'Lab 1',
            unit: 'pH',
            assignedTo: 'Nguyễn Văn A',
            deadline: '16/01/2026',
            status: 'approved',
            result: '7.5',
          },
          {
            id: 'a29',
            parameterName: 'COD',
            protocol: 'ISO 6060',
            location: 'Lab 2',
            unit: 'mg/L',
            assignedTo: 'Nguyễn Văn B',
            deadline: '17/01/2026',
            status: 'completed',
            result: '150',
          },
          {
            id: 'a30',
            parameterName: 'BOD',
            protocol: 'ISO 5815',
            location: 'Lab 3',
            unit: 'mg/L',
            assignedTo: 'Nguyễn Văn C',
            deadline: '18/01/2026',
            status: 'in-progress',
          },
        ],
      },
      {
        id: 's11',
        code: 'TNM2412-050-S03',
        name: 'Mẫu thực phẩm 03',
        status: 'completed',
        testInfo: { approved: 4, hasResult: 4, delivered: 4, total: 4 },
        sampleType: 'Thực phẩm',
        receivedCondition: 'Đạt yêu cầu',
        storageCondition: 'Lạnh',
        notes: 'Mẫu được lấy từ thực phẩm 03',
        analyses: [
          {
            id: 'a31',
            parameterName: 'pH',
            protocol: 'ISO 11888-1',
            location: 'Lab 1',
            unit: 'pH',
            assignedTo: 'Nguyễn Văn A',
            deadline: '16/01/2026',
            status: 'approved',
            result: '7.5',
          },
          {
            id: 'a32',
            parameterName: 'COD',
            protocol: 'ISO 6060',
            location: 'Lab 2',
            unit: 'mg/L',
            assignedTo: 'Nguyễn Văn B',
            deadline: '17/01/2026',
            status: 'completed',
            result: '150',
          },
          {
            id: 'a33',
            parameterName: 'BOD',
            protocol: 'ISO 5815',
            location: 'Lab 3',
            unit: 'mg/L',
            assignedTo: 'Nguyễn Văn C',
            deadline: '18/01/2026',
            status: 'in-progress',
          },
        ],
      },
    ],
    completedSamples: 3,
    customerType: 'company',
    contactPerson: 'Nguyễn Văn D',
    requestType: 'Kiểm tra chất lượng thực phẩm',
    paymentStatus: 'Đã thanh toán',
    notes: 'Yêu cầu kiểm tra chất lượng thực phm từ 3 mẫu khác nhau',
    sampleImages: [],
    attachedFiles: [],
  },
];

const getStatusBadge = (status: Receipt['status']) => {
  switch (status) {
    case 'new':
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          Mới tiếp nhận
        </Badge>
      );
    case 'processing':
      return (
        <Badge variant="default" className="bg-orange-500">
          Đang xử lý
        </Badge>
      );
    case 'completed':
      return (
        <Badge variant="default" className="bg-green-500">
          Hoàn thành
        </Badge>
      );
    case 'overdue':
      return (
        <Badge variant="destructive">
          Quá hạn
        </Badge>
      );
  }
};

const getSampleStatusBadge = (status: Sample['status']) => {
  switch (status) {
    case 'pending':
      return (
        <Badge variant="outline" className="text-gray-600">
          Chờ xử lý
        </Badge>
      );
    case 'in-progress':
      return (
        <Badge variant="default" className="bg-blue-500">
          Đang thực hiện
        </Badge>
      );
    case 'completed':
      return (
        <Badge variant="default" className="bg-green-500">
          Hoàn thành
        </Badge>
      );
  }
};

export function SampleReception() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'orders' | 'processing' | 'return-results'>('orders');
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [selectedSample, setSelectedSample] = useState<Sample | null>(null);
  const [isCreateReceiptModalOpen, setIsCreateReceiptModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Helper function to find receipt by ID
  const findReceiptById = (receiptId: string) => {
    return mockReceipts.find(r => r.id === receiptId) || mockReturnResults.find(r => r.id === receiptId);
  };

  // Add receipt info to samples for navigation
  const enrichSampleWithReceiptInfo = (sample: Sample, receipt: Receipt) => {
    return {
      ...sample,
      receiptCode: receipt.receiptCode,
      receiptId: receipt.id,
      attachedFiles: [
        {
          id: 'sf1',
          name: `Kết quả phân tích ${sample.code}.pdf`,
          type: 'PDF',
          size: '1.2 MB',
          uploadedBy: 'Hệ thống',
          uploadedDate: receipt.receivedDate
        }
      ]
    };
  };

  const filteredReceipts = mockReceipts.filter((receipt) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      receipt.receiptCode.toLowerCase().includes(term) ||
      receipt.customer.toLowerCase().includes(term) ||
      receipt.samples.some(s => 
        s.code.toLowerCase().includes(term) || 
        s.name.toLowerCase().includes(term)
      )
    );
  });

  const filteredReturnResults = mockReturnResults.filter((receipt) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      receipt.receiptCode.toLowerCase().includes(term) ||
      receipt.customer.toLowerCase().includes(term) ||
      receipt.email?.toLowerCase().includes(term) ||
      receipt.trackingNumbers?.some(t => t.toLowerCase().includes(term))
    );
  });

  const totalReceipts = mockReceipts.length;
  const overdueReceipts = mockReceipts.filter((r) => r.daysLeft < 0).length;
  const pendingSamples = mockReceipts.reduce(
    (acc, r) => acc + r.samples.filter((s) => s.status === 'pending').length,
    0
  );
  const returnResultsCount = mockReturnResults.length;

  return (
    <div className="p-6 space-y-6">
      {/* Modals */}
      {selectedReceipt && (
        <ReceiptDetailModal
          receipt={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          onSampleClick={(sample) => {
            const enrichedSample = enrichSampleWithReceiptInfo(sample, selectedReceipt);
            setSelectedSample(enrichedSample as any);
            setSelectedReceipt(null);
          }}
        />
      )}

      {selectedSample && (
        <SampleDetailModal
          sample={selectedSample}
          onClose={() => setSelectedSample(null)}
          onReceiptClick={(receiptId) => {
            const receipt = findReceiptById(receiptId);
            if (receipt) {
              setSelectedReceipt(receipt);
              setSelectedSample(null);
            }
          }}
        />
      )}

      {isCreateReceiptModalOpen && (
        <CreateReceiptModal
          onClose={() => setIsCreateReceiptModalOpen(false)}
          order={selectedOrder}
        />
      )}

      {/* Header Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm text-gray-500">Tổng phiếu tháng này</div>
          <div className="text-3xl font-semibold mt-1">{totalReceipts}</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm text-gray-500">Phiếu quá hạn</div>
          <div className="text-3xl font-semibold mt-1 text-red-600">{overdueReceipts}</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm text-gray-500">Mẫu chưa gán KTV</div>
          <div className="text-3xl font-semibold mt-1 text-orange-600">{pendingSamples}</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm text-gray-500">Chờ trả kết quả</div>
          <div className="text-3xl font-semibold mt-1 text-blue-600">{returnResultsCount}</div>
        </div>
      </div>

      {/* Tab Selection & Search */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'orders' ? 'default' : 'outline'}
              onClick={() => setActiveTab('orders')}
              className="flex items-center gap-2"
            >
              <Package className="h-4 w-4" />
              Đơn hàng ({mockReceipts.length})
            </Button>
            <Button
              variant={activeTab === 'processing' ? 'default' : 'outline'}
              onClick={() => setActiveTab('processing')}
              className="flex items-center gap-2"
            >
              <Package className="h-4 w-4" />
              Đang xử lý ({mockReceipts.length})
            </Button>
            <Button
              variant={activeTab === 'return-results' ? 'default' : 'outline'}
              onClick={() => setActiveTab('return-results')}
              className="flex items-center gap-2"
            >
              <Truck className="h-4 w-4" />
              Trả kết quả ({mockReturnResults.length})
            </Button>
          </div>
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm theo mã phiếu, khách hàng, mã mẫu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="default"
              className="flex items-center gap-2"
              onClick={() => setIsCreateReceiptModalOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Tạo phiếu mới
            </Button>
          </div>
        </div>
      </div>

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <>
          {selectedOrder && !isCreateReceiptModalOpen && (
            <OrderDetailModal
              order={selectedOrder}
              onClose={() => setSelectedOrder(null)}
              onCreateReceipt={(order) => {
                setIsCreateReceiptModalOpen(true);
              }}
            />
          )}
          <OrdersTab
            orders={mockOrders}
            onCreateReceipt={(order) => {
              console.log('Creating receipt for order:', order);
              setSelectedOrder(order);
              setIsCreateReceiptModalOpen(true);
            }}
            onViewDetail={(order) => {
              setSelectedOrder(order);
            }}
            onReceiptClick={(receiptId) => {
              console.log('Opening receipt:', receiptId);
              // TODO: Open receipt detail modal
              // For now, just find the receipt and open it
              const receipt = mockReceipts.find(r => r.id === receiptId);
              if (receipt) {
                setSelectedReceipt(receipt);
              }
            }}
          />
        </>
      )}

      {/* Processing Tab */}
      {activeTab === 'processing' && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thông tin tiếp nhận
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mã mẫu
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tên mẫu
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái mẫu
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thông tin chỉ tiêu
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredReceipts.map((receipt) => (
                  <React.Fragment key={receipt.id}>
                    {receipt.samples.map((sample, sampleIndex) => (
                      <tr key={sample.id} className="hover:bg-gray-50">
                        {sampleIndex === 0 && (
                          <td
                            className="px-4 py-4 align-top border-r bg-gray-50/50"
                            rowSpan={receipt.samples.length}
                          >
                            <div className="space-y-1">
                              <button
                                onClick={() => setSelectedReceipt(receipt)}
                                className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                              >
                                {receipt.receiptCode}
                              </button>
                              <div className="text-sm text-gray-700">{receipt.customer}</div>
                              <div className="text-xs text-gray-500">
                                {receipt.receivedDate} {receipt.receivedTime} - {receipt.receivedBy}
                              </div>
                            </div>
                          </td>
                        )}
                        {sampleIndex === 0 && (
                          <td
                            className="px-4 py-4 align-top border-r bg-gray-50/50"
                            rowSpan={receipt.samples.length}
                          >
                            <div className="space-y-2">
                              {getStatusBadge(receipt.status)}
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-600">Hạn trả:</span>
                                <span className="font-medium text-gray-900">
                                  {receipt.deadline}
                                </span>
                              </div>
                              {receipt.daysLeft < 0 ? (
                                <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                                  <AlertCircle className="h-3 w-3" />
                                  Quá hạn!
                                </Badge>
                              ) : receipt.daysLeft <= 2 ? (
                                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 w-fit">
                                  Còn {receipt.daysLeft} ngày
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-gray-600 w-fit">
                                  Còn {receipt.daysLeft} ngày
                                </Badge>
                              )}
                            </div>
                          </td>
                        )}
                        <td className="px-4 py-3">
                          <span className="font-medium text-gray-900 text-sm">{sample.code}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-gray-700 text-sm">{sample.name}</span>
                        </td>
                        <td className="px-4 py-3">{getSampleStatusBadge(sample.status)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Badge variant="default" className="bg-green-600">
                              {sample.testInfo.approved}
                            </Badge>
                            <span className="text-gray-400">/</span>
                            <Badge variant="default" className="bg-blue-600">
                              {sample.testInfo.hasResult}
                            </Badge>
                            <span className="text-gray-400">/</span>
                            <Badge variant="default" className="bg-purple-600">
                              {sample.testInfo.delivered}
                            </Badge>
                            <span className="text-gray-400">/</span>
                            <Badge variant="outline">{sample.testInfo.total}</Badge>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Duyệt / KQ / Giao / Tổng
                          </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination totalPages={1} currentPage={1} onPageChange={() => {}} />
        </div>
      )}

      {/* Return Results Tab */}
      {activeTab === 'return-results' && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thông tin tiếp nhận
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Các mã vận đơn
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hạn trả
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Địa chỉ - SDT - Gmail
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái mẫu thử
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredReturnResults.map((receipt) => (
                  <tr key={receipt.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <div className="font-semibold text-gray-900">{receipt.receiptCode}</div>
                        <div className="text-sm text-gray-700">{receipt.customer}</div>
                        <div className="text-xs text-gray-500">
                          {receipt.receivedDate} {receipt.receivedTime} - {receipt.receivedBy}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {receipt.trackingNumbers && receipt.trackingNumbers.length > 0 ? (
                        <div className="space-y-1">
                          {receipt.trackingNumbers.map((tracking, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <Truck className="h-3 w-3 text-green-600" />
                              <span className="text-sm font-medium text-gray-900">{tracking}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Chưa có vận đơn</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">{receipt.deadline}</div>
                      {receipt.daysLeft < 0 ? (
                        <Badge variant="destructive" className="mt-1 flex items-center gap-1 w-fit">
                          <AlertCircle className="h-3 w-3" />
                          Quá hạn
                        </Badge>
                      ) : receipt.daysLeft <= 2 ? (
                        <Badge variant="outline" className="mt-1 bg-orange-50 text-orange-700 border-orange-200 w-fit">
                          Còn {receipt.daysLeft} ngày
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="mt-1 text-gray-600 w-fit">
                          Còn {receipt.daysLeft} ngày
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1 text-sm">
                        <div className="text-gray-700">{receipt.address}</div>
                        <div className="text-gray-600">📞 {receipt.phone}</div>
                        <div className="text-gray-600">✉️ {receipt.email}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="bg-green-600 text-base">
                          {receipt.completedSamples}
                        </Badge>
                        <span className="text-gray-400">/</span>
                        <Badge variant="outline" className="text-base">
                          {receipt.samples.length}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Hoàn thành / Tổng số
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button size="sm" variant="outline" className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          Xem
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700"
                          disabled={receipt.trackingNumbers && receipt.trackingNumbers.length > 0}
                        >
                          <Truck className="h-3 w-3" />
                          Tạo vận đơn
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination totalPages={1} currentPage={1} onPageChange={() => {}} />
        </div>
      )}
    </div>
  );
}