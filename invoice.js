
  // Initialize with empty products array
  let products = [];
  let productId = 1;
  let currentInvoiceNumber = generateInvoiceNumber();
  let isRendering = false; // Flag to prevent multiple re-renders

  // Product categories with default warranties
  const productCategories = {
    "TV": "2 Years",
    "LED TV": "2 Years",
    "LCD TV": "2 Years",
    "SMART TV": "2 Years",
    "Home Theater": "1 Year",
    "Soundbar": "1 Year",
    "Speaker": "1 Year",
    "Refrigerator": "5 Years",
    "Fridge": "5 Years",
    "Washing Machine": "3 Years",
    "AC": "3 Years",
    "Air Conditioner": "3 Years",
    "Microwave": "2 Years",
    "Oven": "2 Years",
    "Laptop": "1 Year",
    "Computer": "1 Year",
    "Mobile": "1 Year",
    "Phone": "1 Year",
    "Tablet": "1 Year",
    "Camera": "1 Year",
    "Default": "1 Year"
  };

  // Sample data for quick fill
  const sampleCustomer = {
    name: "Rajesh Kumar",
    address: "123 Main Street, Mumbai, Maharashtra - 400001",
    mobile: "9876543210",
    gstin: "27ABCDE1234F1Z5"
  };

  const sampleProducts = [
    {
      name: "KODAK LED TV 43 inch",
      model: "SUNTEK C98",
      serial: generateSerial(),
      warranty: "2 Years",
      quantity: 1,
      price: 28999
    },
    {
      name: "LG Home Theater",
      model: "LHT-316",
      serial: generateSerial(),
      warranty: "1 Year",
      quantity: 1,
      price: 15999
    }
  ];

  // Show toast notification
  function showToast(message, type = 'info', duration = 3000) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
      toast.classList.remove('show');
    }, duration);
  }

  // Generate random serial number
  function generateSerial() {
    return 'SN' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  }

  // Generate invoice number
  function generateInvoiceNumber() {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const num = Math.floor(Math.random() * 999 + 1).toString().padStart(3, '0');
    return `INV${year}${month}${num}`;
  }

  // Format date
  function formatDate(date) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  // Convert number to words
  function numberToWords(num) {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
                  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    if (isNaN(num) || num < 0) return 'Invalid Amount';
    if (num === 0) return 'Zero Rupees Only';
    
    function convert(n) {
      if (n === 0) return '';
      if (n < 20) return ones[n];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
      if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
      if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
      if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
      return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
    }
    
    const result = convert(Math.floor(num));
    return result ? result + ' Rupees Only' : 'Zero Rupees Only';
  }

  // Check if invoice fits on one page
  function checkPageFit() {
    const maxProducts = 8; // Max products that fit on one page
    const warningElement = document.getElementById('svdt-productWarning');
    
    if (products.length > maxProducts) {
      warningElement.style.display = 'block';
      warningElement.innerHTML = `⚠️ Too many products (${products.length})! Reduce to ${maxProducts} or less to fit on one page.`;
      return false;
    } else {
      warningElement.style.display = 'none';
      return true;
    }
  }

  // Auto-determine warranty based on product name
  function determineWarranty(productName) {
    if (!productName) return "1 Year";
    
    const name = productName.toUpperCase();
    
    // Check for each category in the productCategories object
    for (const [category, warranty] of Object.entries(productCategories)) {
      if (name.includes(category.toUpperCase())) {
        return warranty;
      }
    }
    
    // Return default warranty if no match found
    return productCategories["Default"];
  }

  // Add new product
  function addProduct() {
    if (!checkPageFit()) {
      alert(`Cannot add more products. Maximum ${8} products allowed for single page invoice.`);
      return;
    }
    
    const product = {
      id: productId++,
      name: "",
      model: "",
      serial: generateSerial(),
      warranty: "1 Year",
      quantity: 1,
      price: 0
    };
    products.push(product);
    
    // Get current scroll position
    const container = document.getElementById('svdt-productsContainer');
    const scrollPos = container.scrollTop;
    
    // Render products
    renderProducts();
    updateInvoice();
    
    // Restore scroll position and focus on new input
    setTimeout(() => {
      container.scrollTop = scrollPos;
      const newProductInput = document.getElementById(`product-name-${product.id}`);
      if (newProductInput) {
        newProductInput.focus();
        // Highlight effect
        newProductInput.style.transition = 'background-color 0.3s ease';
        newProductInput.style.backgroundColor = '#fff9c4';
        setTimeout(() => {
          newProductInput.style.backgroundColor = '';
        }, 1000);
      }
    }, 10);
    
    showToast('New product added', 'info');
  }

  // Remove product
  function removeProduct(id) {
    if (products.length <= 1) {
      showToast('You must have at least one product', 'error');
      return;
    }
    
    products = products.filter(p => p.id !== id);
    
    // Get current scroll position
    const container = document.getElementById('svdt-productsContainer');
    const scrollPos = container.scrollTop;
    
    renderProducts();
    updateInvoice();
    
    // Restore scroll position
    setTimeout(() => {
      container.scrollTop = scrollPos;
    }, 10);
    
    showToast('Product removed', 'info');
  }

  // Update product field - FIXED: No re-render on every keystroke
  function updateProduct(id, field, value, element) {
    const product = products.find(p => p.id === id);
    if (product) {
      // Handle different field types
      switch(field) {
        case 'quantity':
          product[field] = Math.max(1, parseInt(value) || 1);
          break;
        case 'price':
          product[field] = Math.max(0, parseFloat(value) || 0);
          break;
        case 'name':
          product[field] = value || '';
          // Update warranty without re-rendering
          const warranty = determineWarranty(value);
          product.warranty = warranty;
          
          // Update warranty dropdown directly
          const warrantySelect = document.getElementById(`warranty-${id}`);
          if (warrantySelect) {
            warrantySelect.value = warranty;
          }
          break;
        case 'model':
        case 'serial':
          product[field] = value || '';
          break;
        case 'warranty':
          product[field] = value || '1 Year';
          break;
        default:
          product[field] = value;
      }
      
      // Update invoice totals without causing re-render
      updateInvoice();
      
      // Only update the specific field value
      if (element && (field === 'quantity' || field === 'price')) {
        element.value = product[field];
      }
    }
  }

  // Render products in sidebar - OPTIMIZED
  function renderProducts() {
    if (isRendering) return;
    isRendering = true;
    
    checkPageFit();
    
    const container = document.getElementById('svdt-productsContainer');
    
    // Save current scroll position before re-rendering
    const scrollPos = container.scrollTop;
    const focusedId = document.activeElement ? document.activeElement.id : null;
    
    container.innerHTML = '';
    
    if (products.length === 0) {
      container.innerHTML = '<p style="text-align: center; color: #7f8c8d;">No products added yet. Click "Add Product" to start.</p>';
      isRendering = false;
      return;
    }
    
    // Use DocumentFragment for better performance
    const fragment = document.createDocumentFragment();
    
    products.forEach((product, index) => {
      const div = document.createElement('div');
      div.className = 'svdt-product-item';
      div.setAttribute('data-product-id', product.id);
      
      // Build product HTML with proper escaping
      const name = escapeHtml(product.name || '');
      const model = escapeHtml(product.model || '');
      const serial = escapeHtml(product.serial || '');
      
      div.innerHTML = `
        <button class="svdt-remove-product" onclick="removeProduct(${product.id})" title="Remove Product" aria-label="Remove product ${index + 1}">
          <i class="fas fa-times"></i>
        </button>
        <h4 style="margin-top: 0; color: #2c3e50;">Product ${index + 1}</h4>
        <div class="svdt-form-group">
          <label for="product-name-${product.id}">Product Name</label>
          <input type="text" 
                 id="product-name-${product.id}"
                 value="${name}" 
                 placeholder="e.g., LED TV"
                 oninput="updateProduct(${product.id}, 'name', this.value, this)">
        </div>
        <div class="svdt-form-group">
          <label for="product-model-${product.id}">Model Number</label>
          <input type="text" 
                 id="product-model-${product.id}"
                 value="${model}" 
                 placeholder="e.g., Model XYZ"
                 oninput="updateProduct(${product.id}, 'model', this.value, this)">
        </div>
        <div class="svdt-form-group">
          <label for="product-serial-${product.id}">Serial Number</label>
          <input type="text" 
                 id="product-serial-${product.id}"
                 value="${serial}" 
                 placeholder="Enter serial number"
                 oninput="updateProduct(${product.id}, 'serial', this.value, this)">
        </div>
        <div class="svdt-form-group">
          <label for="warranty-${product.id}">Warranty Period</label>
          <select id="warranty-${product.id}" onchange="updateProduct(${product.id}, 'warranty', this.value, this)">
            <option value="6 Months" ${product.warranty === "6 Months" ? "selected" : ""}>6 Months</option>
            <option value="1 Year" ${product.warranty === "1 Year" ? "selected" : ""}>1 Year</option>
            <option value="2 Years" ${product.warranty === "2 Years" ? "selected" : ""}>2 Years</option>
            <option value="3 Years" ${product.warranty === "3 Years" ? "selected" : ""}>3 Years</option>
            <option value="5 Years" ${product.warranty === "5 Years" ? "selected" : ""}>5 Years</option>
          </select>
          <p class="svdt-help-text">Auto-detected based on product type</p>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div class="svdt-form-group">
            <label for="product-qty-${product.id}">Quantity</label>
            <input type="number" 
                   id="product-qty-${product.id}"
                   value="${product.quantity}" 
                   min="1"
                   oninput="updateProduct(${product.id}, 'quantity', parseInt(this.value) || 1, this)">
          </div>
          <div class="svdt-form-group">
            <label for="product-price-${product.id}">Price (₹)</label>
            <input type="number" 
                   id="product-price-${product.id}"
                   value="${product.price}" 
                   min="0"
                   step="0.01"
                   oninput="updateProduct(${product.id}, 'price', parseFloat(this.value) || 0, this)">
          </div>
        </div>
      `;
      fragment.appendChild(div);
    });
    
    container.appendChild(fragment);
    
    // Restore scroll position
    setTimeout(() => {
      container.scrollTop = scrollPos;
      
      // Restore focus if there was a focused element
      if (focusedId) {
        const element = document.getElementById(focusedId);
        if (element) {
          element.focus();
          // Put cursor at the end of text
          if (element.type === 'text') {
            element.setSelectionRange(element.value.length, element.value.length);
          }
        }
      }
      
      isRendering = false;
    }, 10);
  }

  // Helper function to escape HTML
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Calculate totals
  function calculateTotals() {
    let subtotal = 0;
    let totalQuantity = 0;
    
    products.forEach(product => {
      const amount = (product.quantity || 1) * (product.price || 0);
      subtotal += amount;
      totalQuantity += (product.quantity || 1);
    });
    
    const taxToggle = document.getElementById('tax-toggle');
    const taxRate = taxToggle.classList.contains('active') ? 18 : 0;
    const tax = (subtotal * taxRate) / 100;
    const total = subtotal + tax;
    
    return { subtotal, tax, total, totalQuantity };
  }

  // Generate COMPACT printable invoice HTML - FITS ONE PAGE
  function generatePrintableInvoice() {
    const totals = calculateTotals();
    const invoiceNumber = currentInvoiceNumber;
    const today = new Date();
    
    // Adjust font sizes based on number of products
    const fontSize = products.length > 5 ? '11px' : '12px';
    const tableFontSize = products.length > 5 ? '10px' : '11px';
    const compactClass = products.length > 4 ? 'svdt-product-details-compact' : '';
    
    return `
      <div class="svdt-print-view" id="svdt-printable-invoice-content" style="font-size: ${fontSize};">
        <!-- TAX INVOICE Header at Top Center -->
        <div style="text-align: center; margin-bottom: 15px;">
          <div class="svdt-tax-invoice-header" style="font-size: ${products.length > 6 ? '18px' : '20px'}">
            TAX INVOICE
          </div>
        </div>
        
        <div style="text-align: center; margin-bottom: 10px;">
          <h2 style="margin: 0; color: #2c3e50; font-size: ${products.length > 6 ? '22px' : '24px'}">AYUSH ENTERPRISES</h2>
          <p style="color: #34495e; margin: 3px 0; font-size: ${products.length > 6 ? '14px' : '16px'}">Amila (Polic Chauki), Mau (U.P.)</p>
          <p style="color: #34495e; margin: 3px 0;">GSTIN: 09AWQPC5111N1ZX | Mob: 8840960213</p>
        </div>
        <hr class="hr-dashed-center" style="border: 0;border-top: 1px dashed #000000;margin: 20px 0;">
        <div style="display: flex; justify-content: space-between; margin: 15px 0; font-size: 14px;">
          <div>
            <p style="margin: 2px 0;"><strong>Invoice No:</strong> ${invoiceNumber}</p>
            <p style="margin: 2px 0;"><strong>Date:</strong> ${formatDate(today)}</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 2px 0;"><strong>Place of Supply:</strong> Mau, Uttar Pradesh</p>
          </div>
        </div>
        
        <div style="margin: 15px 0;">
          <div>
            <p style="margin: 2px 0;"><strong>Sold To:</strong> ${escapeHtml(document.getElementById('svdt-customerName').value || "______________________")}</p>
            <p style="margin: 2px 0;"><strong>Address:</strong> ${escapeHtml(document.getElementById('svdt-customerAddress').value || "________________________")}</p>
            ${document.getElementById('svdt-customerGSTIN').value ? `<p style="margin: 2px 0;"><strong>GSTIN:</strong> ${escapeHtml(document.getElementById('svdt-customerGSTIN').value)}</p>` : ''}
            ${document.getElementById('svdt-customerMobile').value ? `<p style="margin: 2px 0;"><strong>Mobile:</strong> ${escapeHtml(document.getElementById('svdt-customerMobile').value)}</p>` : ''}
          </div>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin: 10px 0; font-size: ${tableFontSize};">
          <thead>
            <tr>
              <th style="border: 2px solid #000; padding: 5px; background: #2c3e50; color: white;">Sr.</th>
              <th style="border: 2px solid #000; padding: 5px; background: #2c3e50; color: white;">Description</th>
              <th style="border: 2px solid #000; padding: 5px; background: #2c3e50; color: white;">Qty</th>
              <th style="border: 2px solid #000; padding: 5px; background: #2c3e50; color: white;">Rate (₹)</th>
              <th style="border: 2px solid #000; padding: 5px; background: #2c3e50; color: white;">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${products.map((product, index) => `
              <tr class="svdt-compact-row">
                <td style="border: 2px solid #000; padding: 5px; vertical-align: top;">${index + 1}</td>
                <td style="border: 2px solid #000; padding: 5px; vertical-align: top;" class="${compactClass}">
                  <strong>${escapeHtml(product.name || "Product")}</strong><br>
                  ${product.model ? `Model: ${escapeHtml(product.model)}<br>` : ''}
                  Serial: ${escapeHtml(product.serial)}<br>
                  Warranty: ${escapeHtml(product.warranty || "1 Year")}
                </td>
                <td style="border: 2px solid #000; padding: 5px; vertical-align: top;">${product.quantity || 1}</td>
                <td style="border: 2px solid #000; padding: 5px; vertical-align: top;">${product.price ? '₹' + product.price.toLocaleString('en-IN') : ''}</td>
                <td style="border: 2px solid #000; padding: 5px; vertical-align: top;">${product.price && product.quantity ? '₹' + (product.price * product.quantity).toLocaleString('en-IN') : ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div style="background: #ecf0f1; padding: 12px; border-radius: 5px; margin-top: 12px;">
          <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 6px;">
            <span>Sub Total:</span>
            <span>₹${totals.subtotal.toLocaleString('en-IN')}</span>
          </div>
          ${document.getElementById('tax-toggle').classList.contains('active') ? `
            <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 6px;">
              <span>CGST (9%):</span>
              <span>₹${(totals.tax/2).toLocaleString('en-IN')}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 6px;">
              <span>SGST (9%):</span>
              <span>₹${(totals.tax/2).toLocaleString('en-IN')}</span>
            </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; color: #27ae60; margin-bottom: 8px;">
            <span>Grand Total:</span>
            <span>₹${totals.total.toLocaleString('en-IN')}</span>
          </div>
          <div style="font-style: italic; color: #7f8c8d; margin-top: 5px; font-size: 12px;">
            <strong>Amount in Words:</strong> ${numberToWords(Math.round(totals.total))}
          </div>
        </div>
        
        <div style="margin-top: 15px; font-size: 11px; color: #2c3e50; line-height: 1.3;">
          <p style="margin: 2px 0;">● Goods once sold would not be taken back.</p>
          <p style="margin: 2px 0;">● Subject to Mau jurisdiction only.</p>
          <p style="margin: 2px 0;">● Our responsibility ceases after delivery of goods to the carrier.</p>
          <p style="margin: 2px 0;">● Warranty as per manufacturer's terms and conditions.</p>
        </div>
        
        <div style="text-align: right; margin-top: 20px; font-weight: bold; font-size: 13px;">
          For: Ayush Enterprises<br><br><br>
          _______________________<br>
          <strong>Authorised Signatory</strong>
        </div>
        
        <div style="margin-top: 15px; padding: 10px; background: #fff8e1; border-radius: 5px; font-size: 11px;">
          <p style="margin: 2px 0;"><strong>Thank you for choosing AYUSH ENTERPRISES</strong></p>
          <p style="margin: 2px 0;">For service assistance or warranty claims, please contact us at:</p>
          <p style="margin: 2px 0;">Mobile: ${escapeHtml(document.getElementById('svdt-customerMobile').value || "8840960213")} | Email: info@ayushenterprises.com</p>
          <p style="margin: 2px 0; font-style: italic;">Please keep this invoice for warranty purposes. Valid GST invoice for input tax credit.</p>
        </div>
      </div>
    `;
  }

  // Generate preview invoice HTML
  function generatePreviewInvoice() {
    const totals = calculateTotals();
    const invoiceNumber = currentInvoiceNumber;
    const today = new Date();
    
    return `
      <!-- TAX INVOICE Header at Top Center -->
      <div style="text-align: center; margin-bottom: 15px;">
        <div class="svdt-tax-invoice-header">
          TAX INVOICE
        </div>
      </div>
      
      <div style="text-align: center; margin-bottom: 15px;">
        <h2 style="margin: 0; color: #2c3e50; font-size: 28px;">AYUSH ENTERPRISES</h2>
        <p style="color: #34495e; margin: 5px 0; font-size: 16px;">Amila (Polic Chauki), Mau (U.P.)</p>
        <p style="color: #34495e; margin: 5px 0;">GSTIN: 09AWQPC5111N1ZX | Mob: 8840960213</p>
      </div>
      <hr class="hr-dashed-center" style="border: 0;border-top: 1px dashed #000000;margin: 20px 0;">
      <div style="display: flex; justify-content: space-between; margin: 15px 0; font-size: 14px;">
        <div>
          <p><strong>Invoice No:</strong> ${invoiceNumber}</p>
          <p><strong>Date:</strong> ${formatDate(today)}</p>
        </div>
        <div style="text-align: right;">
          <p><strong>Place of Supply:</strong> Mau, Uttar Pradesh</p>
        </div>
      </div>
      
      <div style="margin: 15px 0;">
        <div>
          <p><strong>Sold To:</strong> ${escapeHtml(document.getElementById('svdt-customerName').value || "______________________")}</p>
          <p><strong>Address:</strong> ${escapeHtml(document.getElementById('svdt-customerAddress').value || "________________________")}</p>
          ${document.getElementById('svdt-customerGSTIN').value ? `<p><strong>GSTIN:</strong> ${escapeHtml(document.getElementById('svdt-customerGSTIN').value)}</p>` : ''}
          ${document.getElementById('svdt-customerMobile').value ? `<p><strong>Mobile:</strong> ${escapeHtml(document.getElementById('svdt-customerMobile').value)}</p>` : ''}
        </div>
      </div>
      
      <table class="svdt-invoice-table">
        <thead>
          <tr>
            <th>Sr.</th>
            <th>Description</th>
            <th>Qty</th>
            <th>Rate (₹)</th>
            <th>Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${products.map((product, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>
                <strong>${escapeHtml(product.name || "Product")}</strong><br>
                Model: ${escapeHtml(product.model || "N/A")}<br>
                Serial: ${escapeHtml(product.serial)}<br>
                Warranty: ${escapeHtml(product.warranty)}
              </td>
              <td>${product.quantity || 1}</td>
              <td>${product.price ? '₹' + product.price.toLocaleString('en-IN') : ''}</td>
              <td>${product.price && product.quantity ? '₹' + (product.price * product.quantity).toLocaleString('en-IN') : ''}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="svdt-total-section">
        <div class="svdt-total-row">
          <span>Sub Total:</span>
          <span>₹${totals.subtotal.toLocaleString('en-IN')}</span>
        </div>
        ${document.getElementById('tax-toggle').classList.contains('active') ? `
          <div class="svdt-total-row">
            <span>CGST (9%):</span>
            <span>₹${(totals.tax/2).toLocaleString('en-IN')}</span>
          </div>
          <div class="svdt-total-row">
            <span>SGST (9%):</span>
            <span>₹${(totals.tax/2).toLocaleString('en-IN')}</span>
          </div>
        ` : ''}
        <div class="svdt-total-row svdt-total-amount">
          <span>Grand Total:</span>
          <span>₹${totals.total.toLocaleString('en-IN')}</span>
        </div>
        <div class="svdt-amount-words">
          <strong>Amount in Words:</strong> ${numberToWords(Math.round(totals.total))}
        </div>
      </div>
      
      <div class="svdt-footer-notes">
        <p>● Goods once sold would not be taken back.</p>
        <p>● Subject to Mau jurisdiction only.</p>
        <p>● Our responsibility ceases after delivery of goods to the carrier.</p>
        <p>● Warranty as per manufacturer's terms and conditions.</p>
      </div>
      
      <div class="svdt-signature">
        For: Ayush Enterprises<br><br><br>
        _______________________<br>
        <strong>Authorised Signatory</strong>
      </div>
      
      <div style="margin-top: 20px; padding: 12px; background: #fff8e1; border-radius: 5px;">
        <p><strong>Thank you for choosing AYUSH ENTERPRISES</strong></p>
        <p>For service assistance or warranty claims, please contact us at:</p>
        <p>Mobile: ${escapeHtml(document.getElementById('svdt-customerMobile').value || "8840960213")} | Email: info@ayushenterprises.com</p>
        <p><em>Please keep this invoice for warranty purposes. Valid GST invoice for input tax credit.</em></p>
      </div>
    `;
  }

  // Update invoice preview
  function updateInvoice() {
    const totals = calculateTotals();
    
    // Update sidebar totals
    document.getElementById('svdt-subTotalDisplay').textContent = `₹${totals.subtotal.toLocaleString('en-IN')}`;
    document.getElementById('svdt-taxDisplay').textContent = `₹${totals.tax.toLocaleString('en-IN')}`;
    document.getElementById('svdt-totalDisplay').textContent = `₹${totals.total.toLocaleString('en-IN')}`;
    document.getElementById('svdt-amountWords').textContent = numberToWords(Math.round(totals.total));
    
    // Update preview
    const previewHTML = generatePreviewInvoice();
    document.getElementById('svdt-invoicePreview').innerHTML = previewHTML;
    
    // Add watermark back after updating preview
    const watermarkDiv = document.createElement('div');
    watermarkDiv.className = 'svdt-watermark';
    watermarkDiv.textContent = 'AYUSH ENTERPRISES';
    document.getElementById('svdt-invoicePreview').appendChild(watermarkDiv);
    
    // Check page fit
    checkPageFit();
  }

  // Generate and print invoice
  function generateAndPrintInvoice() {
    const customerNameEl = document.getElementById('svdt-customerName');
    const printableInvoiceEl = document.getElementById('svdt-printable-invoice');
    const generateBtn = document.getElementById('generate-btn');
    
    if (!customerNameEl || !printableInvoiceEl || !generateBtn) {
      console.error('Required DOM elements not found');
      showToast('Error: Required elements not found. Please refresh the page.', 'error');
      return;
    }
    
    const customerName = customerNameEl.value.trim();
    
    if (!customerName) {
      showToast('Please enter customer name!', 'error');
      customerNameEl.focus();
      return;
    }
    
    if (!checkPageFit()) {
      showToast('Too many products! Reduce products to fit on one page.', 'error');
      return;
    }
    
    // Show loading state
    const originalText = generateBtn.innerHTML;
    generateBtn.innerHTML = '<div class="loading-spinner"></div> Generating...';
    generateBtn.disabled = true;
    
    // Generate new invoice number
    currentInvoiceNumber = generateInvoiceNumber();
    
    setTimeout(() => {
      try {
        // Generate printable invoice
        const printableInvoice = generatePrintableInvoice();
        printableInvoiceEl.innerHTML = printableInvoice;
        
        // Add watermark back after updating printable invoice
        const watermarkDiv = document.createElement('div');
        watermarkDiv.className = 'svdt-watermark';
        watermarkDiv.textContent = 'AYUSH ENTERPRISES';
        printableInvoiceEl.appendChild(watermarkDiv);
        
        printableInvoiceEl.style.display = 'block';
        
        showToast('Invoice generated! Opening print dialog...', 'info');
        
        // Trigger print
        setTimeout(() => {
          window.print();
          // Hide printable invoice after printing
          setTimeout(() => {
            printableInvoiceEl.style.display = 'none';
            generateBtn.innerHTML = originalText;
            generateBtn.disabled = false;
          }, 100);
        }, 500);
      } catch (error) {
        console.error('Error generating invoice:', error);
        showToast('Error generating invoice. Please check your data and try again.', 'error');
        generateBtn.innerHTML = originalText;
        generateBtn.disabled = false;
      }
    }, 500);
  }

  // Quick fill sample data
  function quickFillSample() {
    // Fill customer details
    document.getElementById('svdt-customerName').value = sampleCustomer.name;
    document.getElementById('svdt-customerAddress').value = sampleCustomer.address;
    document.getElementById('svdt-customerMobile').value = sampleCustomer.mobile;
    document.getElementById('svdt-customerGSTIN').value = sampleCustomer.gstin;
    
    // Fill products
    products = sampleProducts.map((p, i) => ({
      id: i + 1,
      ...p
    }));
    productId = products.length + 1;
    
    renderProducts();
    updateInvoice();
    
    showToast('Sample data loaded successfully!', 'info');
  }

  // Quick fill products only
  function quickFillProducts() {
    products = sampleProducts.map((p, i) => ({
      id: i + 1,
      ...p
    }));
    productId = products.length + 1;
    
    renderProducts();
    updateInvoice();
    
    showToast('Sample products loaded!', 'info');
  }

  // Print preview
  function printInvoice() {
    if (products.length === 0 || products.every(p => !p.name && !p.price)) {
      showToast('Please add at least one product first!', 'error');
      return;
    }
    
    if (!checkPageFit()) {
      showToast('Too many products! Reduce products to fit on one page.', 'error');
      return;
    }
    
    document.getElementById('svdt-printable-invoice').innerHTML = generatePrintableInvoice();
    
    // Add watermark back after updating printable invoice
    const watermarkDiv = document.createElement('div');
    watermarkDiv.className = 'svdt-watermark';
    watermarkDiv.textContent = 'AYUSH ENTERPRISES';
    document.getElementById('svdt-printable-invoice').appendChild(watermarkDiv);
    
    document.getElementById('svdt-printable-invoice').style.display = 'block';
    
    showToast('Opening print preview...', 'info');
    
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.getElementById('svdt-printable-invoice').style.display = 'none';
      }, 100);
    }, 500);
  }

  // Generate new invoice
  function generateNewInvoice() {
    // Clear customer details
    document.getElementById('svdt-customerName').value = '';
    document.getElementById('svdt-customerAddress').value = '';
    document.getElementById('svdt-customerMobile').value = '';
    document.getElementById('svdt-customerGSTIN').value = '';
    
    // Clear products
    products = [{
      id: 1,
      name: "",
      model: "",
      serial: generateSerial(),
      warranty: "1 Year",
      quantity: 1,
      price: 0
    }];
    productId = 2;
    
    // Generate new invoice number
    currentInvoiceNumber = generateInvoiceNumber();
    
    renderProducts();
    updateInvoice();
    
    showToast('New invoice created! Start adding your products.', 'info');
  }

  // Clear all fields
  function clearAll() {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      generateNewInvoice();
      document.getElementById('tax-toggle').classList.add('active');
      updateInvoice();
      showToast('All data cleared successfully!', 'info');
    }
  }

  // Enhanced toggle sidebar function - FIXED for desktop overlay
  function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggle-btn');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const isActive = sidebar.classList.contains('active');
    
    if (!sidebar || !toggleBtn) {
      console.error('Sidebar elements not found');
      return;
    }
    
    if (isActive) {
      // Close sidebar
      sidebar.classList.remove('active');
      toggleBtn.classList.remove('active');
      if (sidebarOverlay) sidebarOverlay.classList.remove('active');
      toggleBtn.setAttribute('aria-expanded', 'false');
    } else {
      // Open sidebar
      sidebar.classList.add('active');
      toggleBtn.classList.add('active');
      
      // Only show overlay on desktop (769px and above)
      if (window.innerWidth >= 769 && sidebarOverlay) {
        sidebarOverlay.classList.add('active');
      }
      toggleBtn.setAttribute('aria-expanded', 'true');
    }
  }

  // Initialize on page load
  document.addEventListener('DOMContentLoaded', function() {
    // Start with one empty product
    products = [{
      id: 1,
      name: "",
      model: "",
      serial: generateSerial(),
      warranty: "1 Year",
      quantity: 1,
      price: 0
    }];
    productId = 2;
    
    renderProducts();
    updateInvoice();
    
    // Enhanced sidebar functionality
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggle-btn');
    const themeToggle = document.getElementById('theme-toggle');
    const menuLinks = document.querySelectorAll('.menu-link');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    
    // Toggle sidebar with hamburger
    toggleBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      toggleSidebar();
    });
    
    // Close sidebar when clicking overlay (desktop only)
    if (sidebarOverlay) {
      sidebarOverlay.addEventListener('click', function() {
        if (window.innerWidth >= 769) {
          toggleSidebar();
        }
      });
    }
    
    // Close sidebar when clicking menu items on mobile/tablet
    menuLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        if (window.innerWidth <= 768) {
          sidebar.classList.remove('active');
          toggleBtn.classList.remove('active');
          if (sidebarOverlay) sidebarOverlay.classList.remove('active');
          toggleBtn.setAttribute('aria-expanded', 'false');
        }
        
        e.preventDefault();
        
        // Remove active class from all links
        menuLinks.forEach(l => {
          l.classList.remove('active');
          l.removeAttribute('aria-current');
        });
        
        // Add active class to clicked link
        this.classList.add('active');
        this.setAttribute('aria-current', 'page');
        
        // Get the page from data attribute
        const page = this.getAttribute('data-page');
        
        // Handle navigation
        if (page === 'logout') {
          if (confirm('Are you sure you want to logout?')) {
            showToast('You have been logged out successfully.', 'info');
          }
        } else {
          console.log(`Navigate to ${page} page`);
          showToast(`Navigating to ${page} page`, 'info');
        }
      });
    });
    
    // Theme toggle functionality
    themeToggle.addEventListener('click', function() {
      this.classList.toggle('active');
      document.body.classList.toggle('dark-mode');
      
      // Update ARIA state
      const isDark = document.body.classList.contains('dark-mode');
      this.setAttribute('aria-checked', isDark);
      
      // Save theme preference to localStorage
      if (isDark) {
        localStorage.setItem('theme', 'dark');
        showToast('Dark mode enabled', 'info');
      } else {
        localStorage.setItem('theme', 'light');
        showToast('Light mode enabled', 'info');
      }
    });
    
    // Theme toggle keyboard support
    themeToggle.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.click();
      }
    });
    
    // Tax toggle functionality
    const taxToggle = document.getElementById('tax-toggle');
    taxToggle.addEventListener('click', function() {
      this.classList.toggle('active');
      const isActive = this.classList.contains('active');
      this.setAttribute('aria-checked', isActive);
      updateInvoice();
      
      showToast(isActive ? 'GST tax (18%) enabled' : 'GST tax disabled', 'info');
    });
    
    // Tax toggle keyboard support
    taxToggle.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.click();
      }
    });
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.body.classList.add('dark-mode');
      themeToggle.classList.add('active');
      themeToggle.setAttribute('aria-checked', 'true');
    }
    
    // Enhanced window resize handler
    let resizeTimeout;
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        // Close sidebar when resizing to mobile
        if (window.innerWidth <= 768) {
          if (sidebar && toggleBtn) {
            sidebar.classList.remove('active');
            toggleBtn.classList.remove('active');
            if (sidebarOverlay) sidebarOverlay.classList.remove('active');
            toggleBtn.setAttribute('aria-expanded', 'false');
          }
        }
      }, 150);
    });
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(e) {
      if (window.innerWidth <= 768) {
        if (sidebar && toggleBtn && sidebar.classList.contains('active')) {
          // Check if click is outside sidebar and toggle button
          if (!sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
            sidebar.classList.remove('active');
            toggleBtn.classList.remove('active');
            if (sidebarOverlay) sidebarOverlay.classList.remove('active');
            toggleBtn.setAttribute('aria-expanded', 'false');
          }
        }
      }
    });
  });
