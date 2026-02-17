// =====================================================
// LOCAL STORAGE DATA FETCHER WITH CRUD OPERATIONS
// =====================================================

// CSS Styles for the Data Table and CRUD Interface
// HTML Structure for the Data Table is now in invoices.html

// Main Manager Class
class FetchBillManager {
  constructor() {
    this.records = [];
    this.filteredRecords = [];
    this.currentPage = 1;
    this.recordsPerPage = 10;
    this.sortField = 'date';
    this.sortDirection = 'desc';
    this.editingRecord = null;

    this.init();
  }

  async init() {
    // Inject HTML via AJAX
    await this.injectHTML();

    // Setup event listeners
    this.setupEventListeners();

    // Load initial data
    this.loadData();
  }

  async injectHTML() {
    // Add the main container to the invoices page area
    const invoicesPage = document.getElementById('page-invoices');
    if (!invoicesPage) return;

    try {
      const response = await fetch('invoices.html');
      if (!response.ok) throw new Error('Failed to load invoices UI');
      const html = await response.text();
      invoicesPage.innerHTML = html;

      // Make sure it's visible if we are on that page
      const container = document.getElementById('fetch-bill-container');
      if (container) container.style.display = 'block';
    } catch (error) {
      console.error('Error loading invoices page:', error);
      invoicesPage.innerHTML = `<div class="fetch-bill-empty"><h3>Error</h3><p>${error.message}</p></div>`;
    }
  }

  setupEventListeners() {
    // Form submission
    const form = document.getElementById('fetch-bill-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveRecord();
      });
    }

    // Close modal on outside click
    const modal = document.getElementById('fetch-bill-modal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeModal();
        }
      });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeModal();
      }
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        this.addNewRecord();
      }
      if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        this.refreshData();
      }
    });
  }

  // Data Management Methods
  loadData() {
    try {
      this.records = this.getLocalStorageData();
      this.filteredRecords = [...this.records];
      this.sortData();
      this.renderTable();
      this.renderPagination();

      if (this.records.length === 0) {
        this.showEmptyState();
      }
    } catch (error) {
      console.error('Error loading data:', error);
      this.showError('Failed to load data from local storage');
    }
  }

  getLocalStorageData() {
    const data = [];

    // Try to get data from different localStorage keys, starting with the main one
    const possibleKeys = [
      'ayush_invoices',  // Real invoice data from the invoice system
      'invoices',
      'bills',
      'invoiceData',
      'billData',
      'localStorageData'
    ];

    for (const key of possibleKeys) {
      try {
        const item = localStorage.getItem(key);
        if (item) {
          const parsed = JSON.parse(item);
          if (Array.isArray(parsed)) {
            // If we found data in ayush_invoices, use only that
            if (key === 'ayush_invoices') {
              return parsed; // Return directly as this is the real data
            }
            data.push(...parsed);
          } else if (parsed && typeof parsed === 'object') {
            data.push(parsed);
          }
        }
      } catch (e) {
        console.warn(`Could not parse data from localStorage key: ${key} `, e);
      }
    }

    // If no data found, create some sample data
    if (data.length === 0) {
      this.createSampleInvoices(); // Create sample invoices that match real data structure
      return this.getLocalStorageData(); // Re-fetch after creating samples
    }

    // Normalize the data structure to handle both old and new formats
    return data.map((item, index) => {
      // Handle the real invoice data structure from ayush_invoices
      const normalizedItem = {
        id: item.id || index + 1,
        invoiceNumber: item.invoiceNumber || item.invoice_no || item.number || `INV${Date.now()}${index} `,
        customerName: item.customerName || item.customer_name || item.name || 'Unknown Customer',
        customerAddress: item.customerAddress || item.address || '',
        customerMobile: item.customerMobile || item.mobile || '',
        customerGSTIN: item.customerGSTIN || item.gstin || '',
        products: item.products || item.items || [],
        date: item.date || new Date().toISOString().split('T')[0],
        status: item.status || 'generated',
        createdAt: item.createdAt || new Date().toISOString()
      };

      // Handle total amount from different possible structures
      if (item.totals && typeof item.totals === 'object') {
        normalizedItem.totalAmount = item.totals.total || 0;
        normalizedItem.subtotal = item.totals.subtotal || 0;
        normalizedItem.tax = item.totals.tax || 0;
      } else {
        normalizedItem.totalAmount = item.totalAmount || item.total || 0;
      }

      // Ensure products have proper structure
      if (normalizedItem.products && Array.isArray(normalizedItem.products)) {
        normalizedItem.products = normalizedItem.products.map(product => ({
          name: product.name || '',
          model: product.model || '',
          serial: product.serial || '',
          warranty: product.warranty || '',
          quantity: product.quantity || 1,
          price: product.price || 0
        }));
      }

      return normalizedItem;
    });
  }

  createSampleInvoices() {
    try {
      const sampleInvoices = [
        {
          id: Date.now() - 86400000, // 1 day ago
          invoiceNumber: 'INV241218001',
          customerName: 'Rajesh Kumar Sharma',
          customerAddress: '123 Main Street, Mumbai, Maharashtra - 400001',
          customerMobile: '9876543210',
          customerGSTIN: '27ABCDE1234F1Z5',
          products: [
            {
              name: 'KODAK LED TV 43 inch',
              model: 'SUNTEK C98',
              serial: 'SN2024180001',
              warranty: '2 Years',
              quantity: 1,
              price: 28999
            },
            {
              name: 'LG Home Theater',
              model: 'LHT-316',
              serial: 'SN2024180002',
              warranty: '1 Year',
              quantity: 1,
              price: 15999
            }
          ],
          totals: {
            subtotal: 44998,
            tax: 8099.64,
            total: 53097.64
          },
          date: '2024-12-17',
          status: 'paid',
          createdAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: Date.now() - 172800000, // 2 days ago
          invoiceNumber: 'INV241217002',
          customerName: 'Priya Singh Patel',
          customerAddress: '456 Garden View, Delhi - 110001',
          customerMobile: '9876501234',
          customerGSTIN: '07XYZAB5678C1Z1',
          products: [
            {
              name: 'Samsung Refrigerator',
              model: 'RT34T4532S8',
              serial: 'SN2024170003',
              warranty: '5 Years',
              quantity: 1,
              price: 35000
            }
          ],
          totals: {
            subtotal: 35000,
            tax: 6300,
            total: 41300
          },
          date: '2024-12-16',
          status: 'pending',
          createdAt: new Date(Date.now() - 172800000).toISOString()
        },
        {
          id: Date.now() - 259200000, // 3 days ago
          invoiceNumber: 'INV241216003',
          customerName: 'Amit Verma',
          customerAddress: '789 Sector 15, Gurgaon, Haryana - 122001',
          customerMobile: '9876598765',
          customerGSTIN: '06PQRST9012D1Z2',
          products: [
            {
              name: 'Whirlpool Washing Machine',
              model: 'ACE 7.0',
              serial: 'SN2024160004',
              warranty: '3 Years',
              quantity: 1,
              price: 22000
            },
            {
              name: 'Microwave Oven',
              model: 'MW 25BC',
              serial: 'SN2024160005',
              warranty: '2 Years',
              quantity: 1,
              price: 8500
            }
          ],
          totals: {
            subtotal: 30500,
            tax: 5490,
            total: 35990
          },
          date: '2024-12-15',
          status: 'generated',
          createdAt: new Date(Date.now() - 259200000).toISOString()
        }
      ];

      localStorage.setItem('ayush_invoices', JSON.stringify(sampleInvoices));
      console.log('Sample invoices created successfully');
    } catch (error) {
      console.error('Error creating sample invoices:', error);
    }
  }

  saveLocalStorageData() {
    try {
      localStorage.setItem('ayush_invoices', JSON.stringify(this.records));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      this.showToast('Failed to save data', 'error');
    }
  }

  // CRUD Operations
  addNewRecord() {
    this.editingRecord = null;
    this.openModal();
  }

  deleteRecord(id) {
    if (confirm('Are you sure you want to delete this record?')) {
      this.records = this.records.filter(r => String(r.id) !== String(id));
      this.saveLocalStorageData();
      this.loadData();
      this.showToast('Record deleted successfully', 'success');
    }
  }

  // Modal Management
  openModal(record = null) {
    const modal = document.getElementById('fetch-bill-modal');
    const title = document.getElementById('fetch-bill-modal-title');
    const form = document.getElementById('fetch-bill-form');

    if (record) {
      title.textContent = 'Edit Invoice Record';
      this.populateForm(record);
    } else {
      title.textContent = 'Add New Invoice Record';
      this.generateInvoiceNumber();
      this.clearForm();
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  closeModal() {
    const modal = document.getElementById('fetch-bill-modal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    this.editingRecord = null;
    this.clearForm();
  }

  populateForm(record) {
    document.getElementById('bill-customer-name').value = record.customerName || '';
    document.getElementById('bill-invoice-number').value = record.invoiceNumber || '';
    document.getElementById('bill-mobile').value = record.customerMobile || '';
    document.getElementById('bill-gstin').value = record.customerGSTIN || '';
    document.getElementById('bill-address').value = record.customerAddress || '';
    const totalAmount = this.calculateRecordTotal(record);
    document.getElementById('bill-total-amount').value = totalAmount;
    document.getElementById('bill-status').value = record.status || 'generated';
    document.getElementById('bill-products').value = JSON.stringify(record.products || [], null, 2);
  }

  clearForm() {
    const form = document.getElementById('fetch-bill-form');
    form.reset();
    this.generateInvoiceNumber();
  }

  generateInvoiceNumber() {
    const invoiceNumber = `INV${Date.now()} `;
    document.getElementById('bill-invoice-number').value = invoiceNumber;
  }

  saveRecord() {
    const formData = new FormData(document.getElementById('fetch-bill-form'));

    const record = {
      customerName: formData.get('customer-name') || document.getElementById('bill-customer-name').value,
      invoiceNumber: formData.get('invoice-number') || document.getElementById('bill-invoice-number').value,
      customerMobile: formData.get('mobile') || document.getElementById('bill-mobile').value,
      customerGSTIN: formData.get('gstin') || document.getElementById('bill-gstin').value,
      customerAddress: formData.get('address') || document.getElementById('bill-address').value,
      totalAmount: parseFloat(formData.get('total-amount') || document.getElementById('bill-total-amount').value) || 0,
      status: formData.get('status') || document.getElementById('bill-status').value,
      products: JSON.parse(formData.get('products') || document.getElementById('bill-products').value || '[]')
    };

    try {
      // Calculate total from products to ensure accuracy
      const calculatedTotal = this.calculateRecordTotal(record);

      if (this.editingRecord) {
        // Update existing record
        const index = this.records.findIndex(r => r.id === this.editingRecord.id);
        if (index !== -1) {
          const updatedRecord = {
            ...this.editingRecord,
            ...record,
            totalAmount: calculatedTotal // Use calculated total
          };
          this.records[index] = updatedRecord;
        }
        this.showToast('Record updated successfully', 'success');
      } else {
        // Add new record
        const newRecord = {
          id: Date.now(),
          ...record,
          totalAmount: calculatedTotal, // Use calculated total
          date: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString()
        };
        this.records.push(newRecord);
        this.showToast('Record added successfully', 'success');
      }

      this.saveLocalStorageData();
      this.loadData();
      this.closeModal();
    } catch (error) {
      console.error('Error saving record:', error);
      this.showToast('Failed to save record. Please check your data.', 'error');
    }
  }

  renderTable() {
    const container = document.getElementById('fetch-bill-table-container');
    if (!container) return;

    if (this.filteredRecords.length === 0) {
      this.showEmptyState();
      return;
    }

    const startIndex = (this.currentPage - 1) * this.recordsPerPage;
    const endIndex = startIndex + this.recordsPerPage;
    const pageRecords = this.filteredRecords.slice(startIndex, endIndex);

    const getSortIndicator = (field) => {
      const active = this.sortField === field;
      const icon = !active ? 'fa-sort' : (this.sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down');
      return `<div class="sort-indicator"><i class="fas ${icon}"></i></div>`;
    };

    let tableHTML = `
      <table>
        <thead>
          <tr>
            <th class="sortable" onclick="fetchBillManager.sort('invoiceNumber')">
              Invoice Number ${getSortIndicator('invoiceNumber')}
            </th>
            <th class="sortable" onclick="fetchBillManager.sort('customerName')">
              Customer Name ${getSortIndicator('customerName')}
            </th>
            <th class="sortable" onclick="fetchBillManager.sort('date')">
              Date ${getSortIndicator('date')}
            </th>
            <th class="sortable" onclick="fetchBillManager.sort('totalAmount')">
              Amount ${getSortIndicator('totalAmount')}
            </th>
            <th>Status</th>
            <th>Products</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
    `;

    pageRecords.forEach(record => {
      const statusBadge = this.getStatusBadge(record.status);
      const productsSummary = record.products ? record.products.length : 0;

      tableHTML += `
        <tr>
          <td><strong>${this.escapeHtml(record.invoiceNumber)}</strong></td>
          <td>
            <div style="font-weight: 500;">${this.escapeHtml(record.customerName)}</div>
            <small style="color: #64748b; font-size: 11px;">${this.escapeHtml(record.customerMobile || 'N/A')}</small>
          </td>
          <td>${this.formatDate(record.date)}</td>
          <td><strong>₹${this.formatNumber(this.calculateRecordTotal(record))}</strong></td>
          <td>${statusBadge}</td>
          <td style="color: #64748b;">${productsSummary} item(s)</td>
          <td>
            <div class="action-btns">
              <button class="btn-action btn-view" onclick="fetchBillManager.viewRecord('${record.id}')" title="View">
                <i class="fas fa-eye"></i>
              </button>
              <button class="btn-action btn-edit" onclick="fetchBillManager.editRecord('${record.id}')" title="Edit">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn-action btn-duplicate" onclick="fetchBillManager.duplicateRecord('${record.id}')" title="Copy">
                <i class="fas fa-copy"></i>
              </button>
              <button class="btn-action btn-delete" onclick="fetchBillManager.deleteRecord('${record.id}')" title="Delete">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    tableHTML += `
        </tbody>
      </table>
    `;

    container.innerHTML = tableHTML;
  }

  renderPagination() {
    const container = document.getElementById('fetch-bill-pagination');
    if (!container) return;

    const totalPages = Math.ceil(this.filteredRecords.length / this.recordsPerPage);

    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    let paginationHTML = '';

    // Previous button
    paginationHTML += `<button class="fetch-bill-page-btn" onclick="fetchBillManager.changePage(${this.currentPage - 1})" ${this.currentPage === 1 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i> Previous</button>`;

    // Page numbers
    const startPage = Math.max(1, this.currentPage - 2);
    const endPage = Math.min(totalPages, this.currentPage + 2);

    if (startPage > 1) {
      paginationHTML += `<button class="fetch-bill-page-btn" onclick="fetchBillManager.changePage(1)">1</button>`;
      if (startPage > 2) {
        paginationHTML += `<span class="fetch-bill-page-dots">...</span>`;
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      paginationHTML += `<button class="fetch-bill-page-btn ${i === this.currentPage ? 'active' : ''}" onclick="fetchBillManager.changePage(${i})">${i}</button>`;
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        paginationHTML += `<span class="fetch-bill-page-dots">...</span>`;
      }
      paginationHTML += `<button class="fetch-bill-page-btn" onclick="fetchBillManager.changePage(${totalPages})">${totalPages}</button>`;
    }

    // Next button
    paginationHTML += `<button class="fetch-bill-page-btn" onclick="fetchBillManager.changePage(${this.currentPage + 1})" ${this.currentPage === totalPages ? 'disabled' : ''}>Next <i class="fas fa-chevron-right"></i></button>`;

    container.innerHTML = paginationHTML;
  }

  // Utility Methods
  showEmptyState() {
    const container = document.getElementById('fetch-bill-table-container');
    if (container) {
      container.innerHTML = `
  < div class="fetch-bill-empty" >
          <div class="fetch-bill-empty-icon">📄</div>
          <h3>No Invoice Records Found</h3>
          <p>Start by adding your first invoice record or check your local storage data.</p>
          <button class="fetch-bill-btn fetch-bill-btn-success" onclick="fetchBillManager.addNewRecord()">
            <i class="fas fa-plus" aria-hidden="true"></i> Add First Record
          </button>
        </div >
  `;
    }
  }

  showError(message) {
    const container = document.getElementById('fetch-bill-table-container');
    if (container) {
      container.innerHTML = `
  < div class="fetch-bill-empty" >
          <div class="fetch-bill-empty-icon">⚠️</div>
          <h3>Error Loading Data</h3>
          <p>${message}</p>
          <button class="fetch-bill-btn fetch-bill-btn-warning" onclick="fetchBillManager.loadData()">
            <i class="fas fa-refresh" aria-hidden="true"></i> Try Again
          </button>
        </div >
  `;
    }
  }

  getStatusBadge(status) {
    const statusMap = {
      'generated': { class: 'status-badge generated', text: 'Generated' },
      'paid': { class: 'status-badge paid', text: 'Paid' },
      'completed': { class: 'status-badge completed', text: 'Completed' },
      'pending': { class: 'status-badge pending', text: 'Pending' },
      'overdue': { class: 'status-badge overdue', text: 'Overdue' }
    };

    const statusInfo = statusMap[status] || { class: 'status-badge generated', text: status };
    return `<span class="${statusInfo.class}">${statusInfo.text}</span>`;
  }

  sort(field) {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }

    this.sortData();
    this.renderTable();
  }

  sortData() {
    this.filteredRecords.sort((a, b) => {
      let aVal = a[this.sortField];
      let bVal = b[this.sortField];

      // Handle different data types
      if (this.sortField === 'totalAmount') {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      } else if (this.sortField === 'date') {
        // Use createdAt for better precision if available, otherwise date
        aVal = a.createdAt || a.date;
        bVal = b.createdAt || b.date;
      } else {
        aVal = String(aVal || '').toLowerCase();
        bVal = String(bVal || '').toLowerCase();
      }

      if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  filterData() {
    const searchTerm = document.getElementById('fetch-bill-search').value.toLowerCase();
    const statusFilter = document.getElementById('fetch-bill-status-filter').value;
    const dateFilter = document.getElementById('fetch-bill-date-filter').value;

    this.filteredRecords = this.records.filter(record => {
      // Search filter
      const matchesSearch = !searchTerm ||
        record.customerName.toLowerCase().includes(searchTerm) ||
        record.invoiceNumber.toLowerCase().includes(searchTerm) ||
        (record.products && record.products.some(p =>
          p.name && p.name.toLowerCase().includes(searchTerm)
        ));

      // Status filter
      const matchesStatus = !statusFilter || record.status === statusFilter;

      // Date filter
      let matchesDate = true;
      if (dateFilter) {
        const recordDate = new Date(record.date);
        const today = new Date();
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const startOfWeek = new Date(startOfToday.getTime() - (7 * 24 * 60 * 60 * 1000));
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        switch (dateFilter) {
          case 'today':
            matchesDate = recordDate >= startOfToday;
            break;
          case 'week':
            matchesDate = recordDate >= startOfWeek;
            break;
          case 'month':
            matchesDate = recordDate >= startOfMonth;
            break;
        }
      }

      return matchesSearch && matchesStatus && matchesDate;
    });

    this.currentPage = 1;
    this.sortData();
    this.renderTable();
    this.renderPagination();
  }

  changePage(page) {
    const totalPages = Math.ceil(this.filteredRecords.length / this.recordsPerPage);
    if (page >= 1 && page <= totalPages) {
      this.currentPage = page;
      this.renderTable();
      this.renderPagination();
    }
  }

  calculateRecordTotal(record) {
    // If totalAmount exists and is valid, use it
    if (record.totalAmount && record.totalAmount > 0) {
      return record.totalAmount;
    }

    // Otherwise calculate from products
    if (record.products && Array.isArray(record.products)) {
      const total = record.products.reduce((sum, product) => {
        const price = parseFloat(product.price) || 0;
        const quantity = parseInt(product.quantity) || 1;
        return sum + (price * quantity);
      }, 0);
      return total;
    }

    return 0;
  }

  viewRecord(id) {
    const record = this.records.find(r => String(r.id) === String(id));

    if (record) {
      if (typeof generatePrintableInvoice === 'function') {
        const modal = document.getElementById('view-bill-modal');
        const content = document.getElementById('view-bill-content');

        if (modal && content) {
          // Generate the invoice HTML from the record data
          const invoiceHTML = generatePrintableInvoice(record);
          content.innerHTML = invoiceHTML;

          // Show the modal
          modal.classList.add('active');
          document.body.style.overflow = 'hidden';

          this.showToast('Showing invoice details', 'info');
        } else {
          // Fallback to old behavior if modal elements are missing
          if (confirm('Load this invoice into the generator for viewing/printing?')) {
            this.loadToInvoiceGenerator(record);
          }
        }
      } else {
        // Fallback to old behavior
        if (confirm('Load this invoice into the generator for viewing/printing?')) {
          this.loadToInvoiceGenerator(record);
        }
      }
    } else {
      console.warn(`Record with ID ${id} not found`);
      this.showToast('Error: Invoice record not found', 'error');
    }
  }

  closeViewModal() {
    const modal = document.getElementById('view-bill-modal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  printViewModal() {
    const content = document.getElementById('view-bill-content');
    const printableInvoiceEl = document.getElementById('svdt-printable-invoice');

    if (content && printableInvoiceEl) {
      // Copy content to the official printable area
      printableInvoiceEl.innerHTML = content.innerHTML;

      // Add watermark back
      const watermarkDiv = document.createElement('div');
      watermarkDiv.className = 'svdt-watermark';
      watermarkDiv.textContent = 'AYUSH ENTERPRISES';
      printableInvoiceEl.appendChild(watermarkDiv);

      printableInvoiceEl.style.display = 'block';

      this.closeViewModal();

      setTimeout(() => {
        window.print();
        setTimeout(() => {
          printableInvoiceEl.style.display = 'none';
        }, 100);
      }, 300);
    }
  }

  editRecord(id) {
    const record = this.records.find(r => String(r.id) === String(id));
    if (record) {
      if (confirm('Load this invoice into the generator for editing?')) {
        this.loadToInvoiceGenerator(record);
      }
    }
  }

  duplicateRecord(id) {
    const record = this.records.find(r => String(r.id) === String(id));
    if (record) {
      if (confirm('Load this invoice into the generator as a NEW invoice (Duplicate)?')) {
        // Clone record but remove ID and date to treat as new
        const newRecord = { ...record };
        newRecord.invoiceNumber = ''; // Will generate new one
        this.loadToInvoiceGenerator(newRecord);
      }
    }
  }

  loadToInvoiceGenerator(record) {
    // Check if we have access to the invoice generator functions
    if (typeof updateInvoice !== 'function' || typeof renderProducts !== 'function') {
      this.showToast('Error: Invoice generator not found!', 'error');
      return;
    }

    try {
      // Switch to dashboard
      if (typeof navigateToPage === 'function') {
        navigateToPage('dashboard');
      }

      // Populate Customer Details
      const customerNameEl = document.getElementById('svdt-customerName');
      const customerAddressEl = document.getElementById('svdt-customerAddress');
      const customerMobileEl = document.getElementById('svdt-customerMobile');
      const customerGSTINEl = document.getElementById('svdt-customerGSTIN');
      const invoiceNumberEl = document.getElementById('bill-invoice-number'); // Note: This might not be editable in main UI

      if (customerNameEl) customerNameEl.value = record.customerName || '';
      if (customerAddressEl) customerAddressEl.value = record.customerAddress || '';
      if (customerMobileEl) customerMobileEl.value = record.customerMobile || '';
      if (customerGSTINEl) customerGSTINEl.value = record.customerGSTIN || '';

      // Update global invoice number if variable exists
      if (typeof window.setInvoiceNumber === 'function') {
        // use existing if provided, else generate new if function exists, else keep current
        if (record.invoiceNumber) {
          window.setInvoiceNumber(record.invoiceNumber);
        } else if (typeof generateInvoiceNumber === 'function') {
          window.setInvoiceNumber(generateInvoiceNumber());
        }
      }

      // Populate Products
      // We need to access the 'products' array from invoice.js
      if (typeof window.setProducts === 'function') {
        const newProducts = (record.products || []).map((p, i) => ({
          id: i + 1,
          ...p,
          // Ensure numeric values
          quantity: parseInt(p.quantity) || 1,
          price: parseFloat(p.price) || 0
        }));

        window.setProducts(newProducts);
      }

      // Render and Update
      renderProducts();
      updateInvoice();

      this.showToast(`Invoice ${record.invoiceNumber} loaded!`, 'success');

    } catch (error) {
      console.error('Error loading invoice:', error);
      this.showToast('Error loading details into generator', 'error');
    }
  }

  refreshData() {
    this.loadData();
    if (typeof showToast === 'function') {
      showToast('Data refreshed successfully', 'info');
    }
  }

  exportData() {
    try {
      const dataStr = JSON.stringify(this.records, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice - records - ${new Date().toISOString().split('T')[0]}.json`;
      link.click();

      URL.revokeObjectURL(url);
      this.showToast('Data exported successfully', 'success');
    } catch (error) {
      console.error('Export error:', error);
      this.showToast('Failed to export data', 'error');
    }
  }

  // Helper methods
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatNumber(number) {
    return new Intl.NumberFormat('en-IN').format(number || 0);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  showToast(message, type = 'info') {
    // Use existing toast functionality if available
    if (typeof showToast === 'function') {
      showToast(message, type);
    } else {
      // Fallback implementation
      console.log(`[${type.toUpperCase()}] ${message} `);
      alert(message);
    }
  }
}

// Initialize when DOM is ready
window.initFetchBillManager = function () {
  if (!window.fetchBillManager) {
    window.fetchBillManager = new FetchBillManager();
  } else {
    window.fetchBillManager.loadData();
  }
};

// Also auto-initialize if we are on the invoices page
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('page-invoices') && document.getElementById('page-invoices').style.display !== 'none') {
      window.initFetchBillManager();
    }
  });
} else {
  if (document.getElementById('page-invoices') && document.getElementById('page-invoices').style.display !== 'none') {
    window.initFetchBillManager();
  }
}