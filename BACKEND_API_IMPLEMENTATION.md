# Backend API Implementation for Expense Module

Since this repository appears to be frontend-only, here are the required backend API endpoints that need to be implemented in your Express.js server to support the Expense and Profit & Loss features.

## Required API Endpoints

### Expenses API

#### GET /api/expenses
Get all expenses with optional filtering and pagination.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Number of items per page (default: 10)
- `type`: Expense type filter
- `minAmount`: Minimum amount filter
- `maxAmount`: Maximum amount filter
- `startDate`: Start date filter (YYYY-MM-DD)
- `endDate`: End date filter (YYYY-MM-DD)
- `search`: Search term in description/notes

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "type": "purchases",
      "amount": 150.00,
      "date": "2024-01-15",
      "description": "Office supplies",
      "notes": "Monthly office supplies",
      "attachment": "https://example.com/receipt.jpg",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "createdBy": "user-id"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 10,
  "totalPages": 5
}
```

#### GET /api/expenses/:id
Get a single expense by ID.

#### POST /api/expenses
Create a new expense.

**Request Body:**
```json
{
  "type": "purchases",
  "amount": 150.00,
  "date": "2024-01-15",
  "description": "Office supplies",
  "notes": "Monthly office supplies",
  "attachment": "https://example.com/receipt.jpg"
}
```

#### PUT /api/expenses/:id
Update an existing expense.

#### DELETE /api/expenses/:id
Delete an expense.

#### POST /api/expenses/upload
Upload expense attachment (multipart/form-data).

#### GET /api/expenses/summary
Get expense summary statistics.

**Response:**
```json
{
  "data": {
    "totalExpenses": 5000.00,
    "averageExpense": 125.00,
    "expenseCount": 40,
    "expensesByType": [
      {
        "type": "purchases",
        "amount": 2000.00,
        "count": 15
      }
    ]
  }
}
```

#### GET /api/expenses/export
Export expenses data.

**Query Parameters:**
- `format`: Export format (csv, excel, pdf)
- All filter parameters from GET /api/expenses

### Profit & Loss API

#### GET /api/reports/profit-loss
Generate profit & loss report.

**Query Parameters:**
- `startDate`: Start date (YYYY-MM-DD)
- `endDate`: End date (YYYY-MM-DD)
- `groupBy`: Grouping (daily, weekly, monthly, yearly)

**Response:**
```json
{
  "data": {
    "totalSales": 25000.00,
    "totalExpenses": 18000.00,
    "profitOrLoss": 7000.00,
    "profitMargin": 28.0,
    "expensesByType": [
      {
        "type": "purchases",
        "amount": 5000.00,
        "percentage": 27.8
      }
    ],
    "monthlyData": [
      {
        "month": "Jan",
        "sales": 12000.00,
        "expenses": 8000.00,
        "profitOrLoss": 4000.00
      }
    ]
  }
}
```

#### GET /api/reports/profit-loss/export
Export profit & loss report.

**Query Parameters:**
- `format`: Export format (csv, excel, pdf)
- All parameters from GET /api/reports/profit-loss

## Database Schema

### Expenses Table

```sql
CREATE TABLE expenses (
  id VARCHAR(36) PRIMARY KEY,
  type ENUM('purchases', 'staff_salary', 'maintenance', 'utilities', 'rent', 'marketing', 'insurance', 'taxes', 'supplies', 'equipment', 'delivery', 'other') NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  notes TEXT,
  attachment VARCHAR(500),
  created_by VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_date (date),
  INDEX idx_type (type),
  INDEX idx_amount (amount)
);
```

## Implementation Notes

1. **Authentication**: All endpoints should require JWT authentication
2. **Authorization**: Check user permissions for create/edit/delete operations
3. **File Upload**: Use multer middleware for file uploads
4. **Validation**: Use joi or express-validator for request validation
5. **Error Handling**: Implement consistent error responses
6. **Pagination**: Implement pagination for large datasets
7. **Export**: Use appropriate libraries (csv-writer, exceljs, puppeteer)

## Example Express.js Implementation

```javascript
const express = require('express');
const multer = require('multer');
const router = express.Router();

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// GET /api/expenses
router.get('/expenses', async (req, res) => {
  try {
    const { page = 1, limit = 10, type, minAmount, maxAmount, startDate, endDate, search } = req.query;
    
    // Build filter conditions
    const where = {};
    if (type) where.type = type;
    if (minAmount) where.amount = { ...where.amount, $gte: parseFloat(minAmount) };
    if (maxAmount) where.amount = { ...where.amount, $lte: parseFloat(maxAmount) };
    if (startDate || endDate) where.date = {};
    if (startDate) where.date.$gte = startDate;
    if (endDate) where.date.$lte = endDate;
    if (search) {
      where.$or = [
        { description: { $like: `%${search}%` } },
        { notes: { $like: `%${search}%` } }
      ];
    }
    
    const expenses = await Expense.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [['date', 'DESC']]
    });
    
    res.json({
      data: expenses.rows,
      total: expenses.count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(expenses.count / limit)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/expenses
router.post('/expenses', async (req, res) => {
  try {
    const expense = await Expense.create({
      ...req.body,
      createdBy: req.user.id
    });
    res.json({ data: expense });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/expenses/upload
router.post('/expenses/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Upload file to cloud storage or local storage
    const fileUrl = `/uploads/${req.file.filename}`;
    
    res.json({ data: { url: fileUrl } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

This implementation provides all the necessary backend endpoints to support the frontend Expense and Profit & Loss functionality.