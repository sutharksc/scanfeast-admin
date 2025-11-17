import { Order } from '../types';

export interface AdvancedPOSPrintOptions {
  printerName?: string;
  copies?: number;
  paperWidth?: number; // mm
  paperHeight?: number; // mm
  fontSize?: number;
  fontFamily?: string;
  lineHeight?: number;
  margins?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  printLogo?: boolean;
  logoUrl?: string;
  restaurantInfo?: {
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
  };
  includeBarcode?: boolean;
  includeQRCode?: boolean;
  customHeader?: string;
  customFooter?: string;
  printMode?: 'receipt' | 'kitchen' | 'label';
  autoCut?: boolean;
  openCashDrawer?: boolean;
}

export interface PrinterConfiguration {
  name: string;
  type: 'thermal' | 'inkjet' | 'laser';
  paperWidth: number;
  paperHeight: number;
  maxCharsPerLine: number;
  supportedFeatures: string[];
  isConnected: boolean;
}

export class AdvancedPOSService {
  private static instance: AdvancedPOSService;
  private printers: Map<string, PrinterConfiguration> = new Map();
  private defaultPrinter: string | null = null;

  private constructor() {
    this.initializeDefaultPrinters();
  }

  public static getInstance(): AdvancedPOSService {
    if (!AdvancedPOSService.instance) {
      AdvancedPOSService.instance = new AdvancedPOSService();
    }
    return AdvancedPOSService.instance;
  }

  private initializeDefaultPrinters() {
    // Initialize with common POS printer configurations
    const defaultConfigs: PrinterConfiguration[] = [
      {
        name: 'EPSON TM-T88V',
        type: 'thermal',
        paperWidth: 80,
        paperHeight: 200,
        maxCharsPerLine: 48,
        supportedFeatures: ['barcode', 'qrcode', 'logo', 'cut', 'cashdrawer'],
        isConnected: false
      },
      {
        name: 'Star TSP650II',
        type: 'thermal',
        paperWidth: 80,
        paperHeight: 200,
        maxCharsPerLine: 42,
        supportedFeatures: ['barcode', 'qrcode', 'logo', 'cut'],
        isConnected: false
      },
      {
        name: 'Citizen CT-S310II',
        type: 'thermal',
        paperWidth: 58,
        paperHeight: 200,
        maxCharsPerLine: 32,
        supportedFeatures: ['barcode', 'logo'],
        isConnected: false
      }
    ];

    defaultConfigs.forEach(config => {
      this.printers.set(config.name, config);
    });
  }

  /**
   * Discover available printers
   */
  public async discoverPrinters(): Promise<PrinterConfiguration[]> {
    try {
      // In a real implementation, this would use printer discovery APIs
      // For now, return the configured printers
      return Array.from(this.printers.values());
    } catch (error) {
      console.error('Printer discovery failed:', error);
      return [];
    }
  }

  /**
   * Connect to a specific printer
   */
  public async connectPrinter(printerName: string): Promise<boolean> {
    try {
      const printer = this.printers.get(printerName);
      if (!printer) {
        throw new Error(`Printer ${printerName} not found`);
      }

      // Simulate connection process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      printer.isConnected = true;
      this.defaultPrinter = printerName;
      
      return true;
    } catch (error) {
      console.error(`Failed to connect to printer ${printerName}:`, error);
      return false;
    }
  }

  /**
   * Disconnect from a printer
   */
  public disconnectPrinter(printerName: string): void {
    const printer = this.printers.get(printerName);
    if (printer) {
      printer.isConnected = false;
      if (this.defaultPrinter === printerName) {
        this.defaultPrinter = null;
      }
    }
  }

  /**
   * Get connected printers
   */
  public getConnectedPrinters(): PrinterConfiguration[] {
    return Array.from(this.printers.values()).filter(p => p.isConnected);
  }

  /**
   * Print order receipt with advanced formatting
   */
  public async printOrderReceipt(order: Order, options: AdvancedPOSPrintOptions = {}): Promise<void> {
    const printer = this.getDefaultPrinter();
    if (!printer) {
      throw new Error('No printer connected');
    }

    const printOptions = this.mergeWithDefaults(options);
    
    try {
      const printContent = this.generateAdvancedReceiptContent(order, printOptions, printer);
      await this.sendToPrinter(printContent, printer, printOptions);
      
      if (printOptions.autoCut) {
        await this.cutPaper(printer);
      }
      
      if (printOptions.openCashDrawer) {
        await this.openCashDrawer(printer);
      }
    } catch (error) {
      console.error('Advanced receipt printing failed:', error);
      throw error;
    }
  }

  /**
   * Print kitchen order ticket with advanced formatting
   */
  public async printKitchenTicket(order: Order, options: AdvancedPOSPrintOptions = {}): Promise<void> {
    const printer = this.getDefaultPrinter();
    if (!printer) {
      throw new Error('No printer connected');
    }

    const printOptions = { 
      ...this.mergeWithDefaults(options),
      printMode: 'kitchen' as const,
      includeBarcode: false,
      includeQRCode: false
    };
    
    try {
      const printContent = this.generateAdvancedKitchenTicketContent(order, printOptions, printer);
      await this.sendToPrinter(printContent, printer, printOptions);
      
      if (printOptions.autoCut) {
        await this.cutPaper(printer);
      }
    } catch (error) {
      console.error('Advanced kitchen ticket printing failed:', error);
      throw error;
    }
  }

  /**
   * Print product label
   */
  public async printProductLabel(productName: string, price: number, options: AdvancedPOSPrintOptions = {}): Promise<void> {
    const printer = this.getDefaultPrinter();
    if (!printer) {
      throw new Error('No printer connected');
    }

    const printOptions = { 
      ...this.mergeWithDefaults(options),
      printMode: 'label' as const,
      paperWidth: 58,
      paperHeight: 40
    };
    
    try {
      const printContent = this.generateLabelContent(productName, price, printOptions, printer);
      await this.sendToPrinter(printContent, printer, printOptions);
      
      if (printOptions.autoCut) {
        await this.cutPaper(printer);
      }
    } catch (error) {
      console.error('Label printing failed:', error);
      throw error;
    }
  }

  private getDefaultPrinter(): PrinterConfiguration | null {
    if (this.defaultPrinter) {
      return this.printers.get(this.defaultPrinter) || null;
    }
    
    const connectedPrinters = this.getConnectedPrinters();
    return connectedPrinters.length > 0 ? connectedPrinters[0] : null;
  }

  private mergeWithDefaults(options: AdvancedPOSPrintOptions): AdvancedPOSPrintOptions {
    return {
      copies: 1,
      paperWidth: 80,
      paperHeight: 200,
      fontSize: 12,
      fontFamily: 'monospace',
      lineHeight: 1.2,
      margins: { top: 5, right: 5, bottom: 5, left: 5 },
      printLogo: true,
      includeBarcode: true,
      includeQRCode: false,
      autoCut: true,
      openCashDrawer: false,
      restaurantInfo: {
        name: 'RESTAURANT NAME',
        address: '123 Restaurant St, City, State 12345',
        phone: '(555) 123-4567',
        email: 'info@restaurant.com',
        website: 'www.restaurant.com'
      },
      ...options
    };
  }

  private generateAdvancedReceiptContent(order: Order, options: AdvancedPOSPrintOptions, printer: PrinterConfiguration): string {
    const lines: string[] = [];
    const maxChars = printer.maxCharsPerLine;
    const { restaurantInfo, fontSize, margins } = options;

    // Add margins
    const addLine = (text: string = '') => {
      if (margins?.left) {
        lines.push(' '.repeat(margins.left) + text);
      } else {
        lines.push(text);
      }
    };

    // Header
    addLine();
    addLine('='.repeat(maxChars));
    addLine(this.centerText(restaurantInfo?.name || 'RESTAURANT', maxChars));
    if (restaurantInfo?.address) {
      addLine(this.centerText(restaurantInfo.address, maxChars));
    }
    if (restaurantInfo?.phone) {
      addLine(this.centerText(restaurantInfo.phone, maxChars));
    }
    addLine('='.repeat(maxChars));
    addLine();

    // Order Info
    addLine(this.centerText('ORDER RECEIPT', maxChars));
    addLine('-'.repeat(maxChars));
    addLine(`Order #: ${order.id}`);
    addLine(`Date: ${new Date(order.createdAt).toLocaleDateString()}`);
    addLine(`Time: ${new Date(order.createdAt).toLocaleTimeString()}`);
    addLine(`Status: ${order.status.toUpperCase()}`);
    addLine();

    // Customer Info
    addLine('CUSTOMER:');
    addLine(`Name: ${order.customerName}`);
    if (order.customerMobile) {
      addLine(`Phone: ${order.customerMobile}`);
    }
    if (order.customerAddress) {
      addLine(`Address: ${order.customerAddress}`);
    }
    addLine();

    // Order Items
    addLine('ORDER ITEMS:');
    addLine('-'.repeat(maxChars));
    
    order.items.forEach((item, index) => {
      const itemName = item.menuItem.name;
      const quantity = item.quantity;
      const price = item.menuItem.price;
      const subtotal = item.subtotal;
      
      addLine(`${quantity}x ${itemName}`);
      addLine(`  $${price.toFixed(2)} each = $${subtotal.toFixed(2)}`);
      
      if (item.menuItem.description) {
        const desc = this.wrapText(item.menuItem.description, maxChars - 4);
        desc.forEach(line => addLine(`  ${line}`));
      }
      addLine();
    });

    // Total
    addLine('-'.repeat(maxChars));
    addLine(`Subtotal: $${order.totalAmount.toFixed(2)}`);
    addLine(`Tax (10%): $${(order.totalAmount * 0.1).toFixed(2)}`);
    if (order.deliveryFee) {
      addLine(`Delivery: $${order.deliveryFee.toFixed(2)}`);
    }
    addLine('-'.repeat(maxChars));
    const total = order.totalAmount + (order.totalAmount * 0.1) + (order.deliveryFee || 0);
    addLine(`TOTAL: $${total.toFixed(2)}`);
    addLine();

    // Payment Info
    addLine('PAYMENT:');
    addLine(`Method: ${order.paymentMode || 'Cash'}`);
    addLine(`Status: Paid`);
    addLine();

    // Barcode/QR Code placeholder
    if (options.includeBarcode) {
      addLine(this.centerText('[BARCODE]', maxChars));
      addLine(this.centerText(order.id, maxChars));
      addLine();
    }

    // Footer
    addLine('='.repeat(maxChars));
    addLine(this.centerText('THANK YOU FOR YOUR ORDER!', maxChars));
    addLine(this.centerText('Please come again', maxChars));
    if (restaurantInfo?.website) {
      addLine(this.centerText(restaurantInfo.website, maxChars));
    }
    addLine('='.repeat(maxChars));
    addLine();

    return lines.join('\n');
  }

  private generateAdvancedKitchenTicketContent(order: Order, options: AdvancedPOSPrintOptions, printer: PrinterConfiguration): string {
    const lines: string[] = [];
    const maxChars = printer.maxCharsPerLine;

    const addLine = (text: string = '') => {
      lines.push(text);
    };

    // Header
    addLine('='.repeat(maxChars));
    addLine(this.centerText('KITCHEN ORDER', maxChars));
    addLine('='.repeat(maxChars));
    addLine();

    // Order Info
    addLine(`Order #: ${order.id}`);
    addLine(`Date: ${new Date(order.createdAt).toLocaleDateString()}`);
    addLine(`Time: ${new Date(order.createdAt).toLocaleTimeString()}`);
    addLine(`Status: ${order.status.toUpperCase()}`);
    addLine();

    // Customer Info (abbreviated)
    addLine(`Customer: ${order.customerName}`);
    if (order.customerMobile) {
      addLine(`Phone: ${order.customerMobile}`);
    }
    addLine();

    // Order Items
    addLine('ITEMS TO PREPARE:');
    addLine('-'.repeat(maxChars));
    
    order.items.forEach((item, index) => {
      const itemName = item.menuItem.name;
      const quantity = item.quantity;
      
      addLine(`${quantity}x ${itemName.toUpperCase()}`);
      
      // Add special instructions if available
      if (order.notes) {
        addLine(`  Note: ${order.notes}`);
      }
      
      // Add category if available
      if (item.menuItem.categoryId) {
        addLine(`  Category ID: ${item.menuItem.categoryId}`);
      }
      addLine();
    });

    // Footer
    addLine('-'.repeat(maxChars));
    addLine(this.centerText('PREPARE WITH CARE!', maxChars));
    addLine('='.repeat(maxChars));

    return lines.join('\n');
  }

  private generateLabelContent(productName: string, price: number, options: AdvancedPOSPrintOptions, printer: PrinterConfiguration): string {
    const lines: string[] = [];
    const maxChars = printer.maxCharsPerLine;

    lines.push('='.repeat(maxChars));
    lines.push(this.centerText(productName.toUpperCase(), maxChars));
    lines.push('='.repeat(maxChars));
    lines.push(this.centerText(`$${price.toFixed(2)}`, maxChars));
    lines.push('='.repeat(maxChars));

    return lines.join('\n');
  }

  private centerText(text: string, maxWidth: number): string {
    const padding = Math.max(0, Math.floor((maxWidth - text.length) / 2));
    return ' '.repeat(padding) + text;
  }

  private wrapText(text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach(word => {
      if ((currentLine + word).length <= maxWidth) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          lines.push(word.substring(0, maxWidth));
          currentLine = word.substring(maxWidth);
        }
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  private async sendToPrinter(content: string, printer: PrinterConfiguration, options: AdvancedPOSPrintOptions): Promise<void> {
    // In a real implementation, this would send the content to the actual printer
    // For now, we'll use the browser print API as a fallback
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Failed to open print window');
    }

    const { paperWidth = 80, fontSize = 12, fontFamily = 'monospace' } = options;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>POS Print</title>
          <style>
            @page {
              size: ${paperWidth}mm auto;
              margin: 5mm;
            }
            
            body {
              font-family: ${fontFamily};
              font-size: ${fontSize}px;
              line-height: 1.2;
              margin: 0;
              padding: 0;
              white-space: pre-wrap;
              width: ${paperWidth}mm;
            }
            
            .print-content {
              width: 100%;
              text-align: left;
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
          <div class="print-content">
            ${content.replace(/\n/g, '<br>')}
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    return new Promise((resolve, reject) => {
      printWindow.onload = () => {
        try {
          printWindow.print();
          printWindow.close();
          resolve();
        } catch (error) {
          reject(error);
        }
      };
    });
  }

  private async cutPaper(printer: PrinterConfiguration): Promise<void> {
    // In a real implementation, this would send the cut command to the printer
    console.log(`Cutting paper on ${printer.name}`);
  }

  private async openCashDrawer(printer: PrinterConfiguration): Promise<void> {
    // In a real implementation, this would send the cash drawer open command
    console.log(`Opening cash drawer connected to ${printer.name}`);
  }

  /**
   * Get printer status
   */
  public getPrinterStatus(printerName: string): PrinterConfiguration | null {
    return this.printers.get(printerName) || null;
  }

  /**
   * Set default printer
   */
  public setDefaultPrinter(printerName: string): boolean {
    const printer = this.printers.get(printerName);
    if (printer && printer.isConnected) {
      this.defaultPrinter = printerName;
      return true;
    }
    return false;
  }
}

// Export singleton instance
export const advancedPOSService = AdvancedPOSService.getInstance();