import { Order } from '../types';

export interface POSPrintOptions {
  printerName?: string;
  copies?: number;
  includeHeader?: boolean;
  includeFooter?: boolean;
  paperWidth?: number; // mm
  paperHeight?: number; // mm
  fontSize?: number;
  printLogo?: boolean;
}

export class POSPrintService {
  private static instance: POSPrintService;
  private defaultOptions: POSPrintOptions = {
    copies: 1,
    includeHeader: true,
    includeFooter: true,
    paperWidth: 80, // Standard 80mm thermal printer
    paperHeight: 200,
    fontSize: 12,
    printLogo: true
  };

  private constructor() {}

  public static getInstance(): POSPrintService {
    if (!POSPrintService.instance) {
      POSPrintService.instance = new POSPrintService();
    }
    return POSPrintService.instance;
  }

  /**
   * Print order receipt using POS printer
   */
  public async printOrderReceipt(order: Order, options: POSPrintOptions = {}): Promise<void> {
    const printOptions = { ...this.defaultOptions, ...options };
    
    try {
      // Create print content
      const printContent = this.generateReceiptContent(order, printOptions);
      
      // Try to use browser print API with POS formatting
      await this.printWithBrowserAPI(printContent, printOptions);
      
    } catch (error) {
      console.error('POS printing failed:', error);
      throw new Error(`Failed to print receipt: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Print kitchen order ticket (KOT)
   */
  public async printKitchenTicket(order: Order, options: POSPrintOptions = {}): Promise<void> {
    const printOptions = { 
      ...this.defaultOptions, 
      ...options,
      includeFooter: false,
      paperWidth: 80
    };
    
    try {
      const printContent = this.generateKitchenTicketContent(order, printOptions);
      await this.printWithBrowserAPI(printContent, printOptions);
    } catch (error) {
      console.error('Kitchen ticket printing failed:', error);
      throw new Error(`Failed to print kitchen ticket: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate customer receipt content
   */
  private generateReceiptContent(order: Order, options: POSPrintOptions): string {
    const lines: string[] = [];
    const { paperWidth = 80 } = options;
    const maxWidth = Math.floor(paperWidth / 8); // Approximate characters per line

    // Header
    if (options.includeHeader) {
      lines.push('='.repeat(maxWidth));
      lines.push(this.centerText('RESTAURANT NAME', maxWidth));
      lines.push(this.centerText('123 Restaurant St', maxWidth));
      lines.push(this.centerText('City, State 12345', maxWidth));
      lines.push(this.centerText('Tel: (555) 123-4567', maxWidth));
      lines.push('='.repeat(maxWidth));
      lines.push('');
    }

    // Order Info
    lines.push(this.centerText('ORDER RECEIPT', maxWidth));
    lines.push('-'.repeat(maxWidth));
    lines.push(`Order #: ${order.id}`);
    lines.push(`Date: ${new Date(order.createdAt).toLocaleDateString()}`);
    lines.push(`Time: ${new Date(order.createdAt).toLocaleTimeString()}`);
    lines.push(`Status: ${order.status.toUpperCase()}`);
    lines.push('');

    // Customer Info
    lines.push('CUSTOMER:');
    lines.push(`Name: ${order.customerName}`);
    if (order.customerMobile) {
      lines.push(`Phone: ${order.customerMobile}`);
    }
    if (order.customerAddress) {
      lines.push(`Address: ${order.customerAddress}`);
    }
    lines.push('');

    // Order Items
    lines.push('ORDER ITEMS:');
    lines.push('-'.repeat(maxWidth));
    
    order.items.forEach((item, index) => {
      const itemName = item.menuItem.name;
      const quantity = item.quantity;
      const price = item.menuItem.price;
      const subtotal = item.subtotal;
      
      lines.push(`${quantity}x ${itemName}`);
      lines.push(`  $${price.toFixed(2)} each = $${subtotal.toFixed(2)}`);
      
      if (item.menuItem.description) {
        const desc = item.menuItem.description.substring(0, maxWidth - 4);
        lines.push(`  ${desc}`);
      }
      lines.push('');
    });

    // Total
    lines.push('-'.repeat(maxWidth));
    lines.push(`Subtotal: $${order.totalAmount.toFixed(2)}`);
    lines.push(`Tax (10%): $${(order.totalAmount * 0.1).toFixed(2)}`);
    if (order.deliveryFee) {
      lines.push(`Delivery: $${order.deliveryFee.toFixed(2)}`);
    }
    lines.push('-'.repeat(maxWidth));
    const total = order.totalAmount + (order.totalAmount * 0.1) + (order.deliveryFee || 0);
    lines.push(`TOTAL: $${total.toFixed(2)}`);
    lines.push('');

    // Payment Info
    lines.push('PAYMENT:');
    lines.push(`Method: ${order.paymentMode || 'Cash'}`);
    lines.push(`Status: Paid`);
    lines.push('');

    // Footer
    if (options.includeFooter) {
      lines.push('='.repeat(maxWidth));
      lines.push(this.centerText('THANK YOU FOR YOUR ORDER!', maxWidth));
      lines.push(this.centerText('Please come again', maxWidth));
      lines.push(this.centerText('www.restaurant.com', maxWidth));
      lines.push('='.repeat(maxWidth));
    }

    return lines.join('\n');
  }

  /**
   * Generate kitchen ticket content
   */
  private generateKitchenTicketContent(order: Order, options: POSPrintOptions): string {
    const lines: string[] = [];
    const { paperWidth = 80 } = options;
    const maxWidth = Math.floor(paperWidth / 8);

    // Header
    lines.push('='.repeat(maxWidth));
    lines.push(this.centerText('KITCHEN ORDER', maxWidth));
    lines.push('='.repeat(maxWidth));
    lines.push('');

    // Order Info
    lines.push(`Order #: ${order.id}`);
    lines.push(`Date: ${new Date(order.createdAt).toLocaleDateString()}`);
    lines.push(`Time: ${new Date(order.createdAt).toLocaleTimeString()}`);
    lines.push(`Status: ${order.status.toUpperCase()}`);
    lines.push('');

    // Customer Info (abbreviated)
    lines.push(`Customer: ${order.customerName}`);
    if (order.customerMobile) {
      lines.push(`Phone: ${order.customerMobile}`);
    }
    lines.push('');

    // Order Items
    lines.push('ITEMS TO PREPARE:');
    lines.push('-'.repeat(maxWidth));
    
    order.items.forEach((item, index) => {
      const itemName = item.menuItem.name;
      const quantity = item.quantity;
      
      lines.push(`${quantity}x ${itemName.toUpperCase()}`);
      
      // Add special instructions if available
      if (order.notes) {
        lines.push(`  Note: ${order.notes}`);
      }
      
      // Add category if available
      if (item.menuItem.categoryId) {
        lines.push(`  Category ID: ${item.menuItem.categoryId}`);
      }
      lines.push('');
    });

    // Footer
    lines.push('-'.repeat(maxWidth));
    lines.push(this.centerText('PREPARE WITH CARE!', maxWidth));
    lines.push('='.repeat(maxWidth));

    return lines.join('\n');
  }

  /**
   * Print using browser print API with POS styling
   */
  private async printWithBrowserAPI(content: string, options: POSPrintOptions): Promise<void> {
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Unable to open print window. Please check your browser popup settings and allow popups for this site.');
      }

      const { paperWidth = 80, fontSize = 12 } = options;
      
      // Create HTML content with POS styling
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>POS Receipt</title>
            <style>
              @page {
                size: ${paperWidth}mm auto;
                margin: 5mm;
              }
              
              body {
                font-family: 'Courier New', monospace;
                font-size: ${fontSize}px;
                line-height: 1.2;
                margin: 0;
                padding: 0;
                white-space: pre-wrap;
                width: ${paperWidth}mm;
              }
              
              .receipt {
                width: 100%;
                text-align: left;
              }
              
              .center {
                text-align: center;
              }
              
              .bold {
                font-weight: bold;
              }
              
              @media print {
                body {
                  margin: 0;
                  padding: 0;
                }
                
                @page {
                  margin: 2mm;
                }
              }
            </style>
          </head>
          <body>
            <div class="receipt">
              ${content.replace(/\n/g, '<br>')}
            </div>
          </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Wait for content to load, then print
      printWindow.onload = () => {
        setTimeout(() => {
          try {
            printWindow.print();
            // Don't close immediately, let user handle print dialog
            setTimeout(() => {
              printWindow.close();
            }, 1000);
          } catch (error) {
            printWindow.close();
            throw error;
          }
        }, 500);
      };
    } catch (error) {
      console.error('Print window error:', error);
      throw new Error(`Printing failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your browser popup settings.`);
    }
  }

  /**
   * Center text within specified width
   */
  private centerText(text: string, maxWidth: number): string {
    const padding = Math.max(0, Math.floor((maxWidth - text.length) / 2));
    return ' '.repeat(padding) + text;
  }

  /**
   * Check if POS printer is available
   */
  public async checkPrinterAvailability(): Promise<boolean> {
    try {
      // Check if browser supports printing
      if (typeof window === 'undefined' || !window.print) {
        return false;
      }

      // More reliable check - just verify print API exists
      // In modern browsers, print is always available but may be blocked by popup blockers
      // We'll assume it's available and handle errors during actual printing
      return true;
      
    } catch (error) {
      console.error('Printer availability check failed:', error);
      return false;
    }
  }

  /**
   * Get available printers (if supported)
   */
  public async getAvailablePrinters(): Promise<string[]> {
    // Note: Browser security restrictions limit direct printer access
    // This would typically be handled by a native app or service
    try {
      if ('getPrinters' in navigator) {
        // @ts-ignore - Experimental API
        const printers = await navigator.getPrinters();
        return printers.map((printer: any) => printer.name);
      }
    } catch (error) {
      console.error('Failed to get printers:', error);
    }
    
    return ['Default Printer'];
  }

  /**
   * Print multiple copies
   */
  public async printMultipleCopies(order: Order, copies: number, options: POSPrintOptions = {}): Promise<void> {
    const printOptions = { ...options, copies: 1 };
    
    for (let i = 0; i < copies; i++) {
      await this.printOrderReceipt(order, printOptions);
      // Small delay between prints
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

// Export singleton instance
export const posPrintService = POSPrintService.getInstance();