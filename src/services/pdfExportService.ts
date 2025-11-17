import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  DoughnutController,
  BarController,
  LineController,
  PieController,
  PolarAreaController
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  DoughnutController,
  BarController,
  LineController,
  PieController,
  PolarAreaController
);

export interface ChartData {
  type: 'bar' | 'line' | 'doughnut' | 'pie' | 'polarArea';
  data: any;
  options?: any;
  title?: string;
}

export interface ReportData {
  title: string;
  subtitle?: string;
  dateRange?: string;
  stats: Array<{
    label: string;
    value: string | number;
    description?: string;
  }>;
  charts: ChartData[];
  tables?: Array<{
    title: string;
    headers: string[];
    rows: string[][];
  }>;
  summary?: string;
}

class PDFExportService {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;
  private currentY: number;

  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4');
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.margin = 20;
    this.currentY = this.margin;
  }

  private addNewPage(): void {
    this.doc.addPage();
    this.currentY = this.margin;
  }

  private checkPageBreak(requiredHeight: number): void {
    if (this.currentY + requiredHeight > this.pageHeight - this.margin) {
      this.addNewPage();
    }
  }

  private addTitle(title: string, fontSize: number = 20): void {
    this.checkPageBreak(15);
    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.pageWidth / 2, this.currentY, { align: 'center' });
    this.currentY += 12;
  }

  private addSubtitle(subtitle: string): void {
    this.checkPageBreak(10);
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(100, 100, 100);
    this.doc.text(subtitle, this.pageWidth / 2, this.currentY, { align: 'center' });
    this.doc.setTextColor(0, 0, 0);
    this.currentY += 8;
  }

  private addText(text: string, fontSize: number = 10, isBold: boolean = false): void {
    this.checkPageBreak(8);
    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    const lines = this.doc.splitTextToSize(text, this.pageWidth - 2 * this.margin);
    lines.forEach((line: string) => {
      this.checkPageBreak(6);
      this.doc.text(line, this.margin, this.currentY);
      this.currentY += 6;
    });
  }

  private addStatsGrid(stats: ReportData['stats']): void {
    this.checkPageBreak(40);
    const statsPerRow = 2;
    const statWidth = (this.pageWidth - 2 * this.margin - 10) / statsPerRow;
    const statHeight = 25;

    stats.forEach((stat, index) => {
      const row = Math.floor(index / statsPerRow);
      const col = index % statsPerRow;
      const x = this.margin + col * (statWidth + 10);
      const y = this.currentY + row * (statHeight + 10);

      // Draw stat box
      this.doc.setDrawColor(200, 200, 200);
      this.doc.setFillColor(248, 250, 252);
      this.doc.roundedRect(x, y, statWidth, statHeight, 3, 3, 'FD');

      // Add stat content
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(100, 100, 100);
      this.doc.text(stat.label, x + 5, y + 8);

      this.doc.setFontSize(14);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(0, 0, 0);
      this.doc.text(String(stat.value), x + 5, y + 16);

      if (stat.description) {
        this.doc.setFontSize(7);
        this.doc.setFont('helvetica', 'normal');
        this.doc.setTextColor(120, 120, 120);
        this.doc.text(stat.description, x + 5, y + 22);
      }
    });

    const rowsNeeded = Math.ceil(stats.length / statsPerRow);
    this.currentY += rowsNeeded * (statHeight + 10) + 10;
  }

  private async addChart(chartData: ChartData): Promise<void> {
    this.checkPageBreak(120);

    // Create canvas element for chart
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Create chart
    const chart = new ChartJS(ctx, {
      type: chartData.type,
      data: chartData.data,
      options: {
        responsive: false,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: chartData.type === 'pie' || chartData.type === 'doughnut' ? 'bottom' : 'top',
            labels: {
              font: {
                size: 10
              }
            }
          },
          title: {
            display: !!chartData.title,
            text: chartData.title,
            font: {
              size: 14,
              weight: 'bold'
            }
          }
        },
        scales: chartData.type === 'bar' || chartData.type === 'line' ? {
          x: {
            ticks: {
              font: {
                size: 8
              }
            }
          },
          y: {
            ticks: {
              font: {
                size: 8
              }
            }
          }
        } : undefined,
        ...chartData.options
      }
    });

    // Wait for chart to render
    await new Promise(resolve => setTimeout(resolve, 100));

    // Convert canvas to image
    const chartImage = canvas.toDataURL('image/png');
    
    // Add chart to PDF
    const chartWidth = this.pageWidth - 2 * this.margin;
    const chartHeight = 80;
    const x = this.margin;
    const y = this.currentY;

    this.doc.addImage(chartImage, 'PNG', x, y, chartWidth, chartHeight);
    this.currentY += chartHeight + 15;

    // Clean up
    chart.destroy();
    canvas.remove();
  }

  private addTable(table: ReportData['tables'][0]): void {
    this.checkPageBreak(30);
    
    // Add table title
    this.addText(table.title, 12, true);
    this.currentY += 5;

    const cellWidth = (this.pageWidth - 2 * this.margin) / table.headers.length;
    const cellHeight = 8;

    // Add headers
    table.headers.forEach((header, index) => {
      const x = this.margin + index * cellWidth;
      this.doc.setFillColor(240, 240, 240);
      this.doc.rect(x, this.currentY, cellWidth, cellHeight, 'F');
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(header, x + 2, this.currentY + 5);
    });
    this.currentY += cellHeight;

    // Add rows
    table.rows.forEach((row, rowIndex) => {
      this.checkPageBreak(cellHeight + 2);
      
      row.forEach((cell, cellIndex) => {
        const x = this.margin + cellIndex * cellWidth;
        this.doc.setDrawColor(200, 200, 200);
        this.doc.rect(x, this.currentY, cellWidth, cellHeight);
        this.doc.setFontSize(8);
        this.doc.setFont('helvetica', 'normal');
        
        // Handle long text by truncating
        let displayText = cell;
        if (displayText.length > 20) {
          displayText = displayText.substring(0, 17) + '...';
        }
        this.doc.text(displayText, x + 2, this.currentY + 5);
      });
      this.currentY += cellHeight;
    });

    this.currentY += 10;
  }

  private addFooter(): void {
    const footerY = this.pageHeight - 15;
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(150, 150, 150);
    this.doc.text(
      `Generated on ${new Date().toLocaleString()} by Restaurant Admin System`,
      this.pageWidth / 2,
      footerY,
      { align: 'center' }
    );
    this.doc.setTextColor(0, 0, 0);
  }

  public async generatePDF(reportData: ReportData): Promise<void> {
    try {
      // Add title
      this.addTitle(reportData.title);
      
      // Add subtitle
      if (reportData.subtitle) {
        this.addSubtitle(reportData.subtitle);
      }

      // Add date range
      if (reportData.dateRange) {
        this.addText(`Report Period: ${reportData.dateRange}`, 10);
        this.currentY += 5;
      }

      // Add stats grid
      if (reportData.stats.length > 0) {
        this.addText('Key Statistics', 14, true);
        this.currentY += 5;
        this.addStatsGrid(reportData.stats);
      }

      // Add charts
      if (reportData.charts.length > 0) {
        this.addText('Visual Analytics', 14, true);
        this.currentY += 5;
        
        for (const chartData of reportData.charts) {
          await this.addChart(chartData);
        }
      }

      // Add tables
      if (reportData.tables) {
        for (const table of reportData.tables) {
          this.addTable(table);
        }
      }

      // Add summary
      if (reportData.summary) {
        this.addText('Summary', 14, true);
        this.currentY += 5;
        this.addText(reportData.summary);
      }

      // Add footer to all pages
      const pageCount = this.doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        this.doc.setPage(i);
        this.addFooter();
      }

      // Save the PDF
      const fileName = `${reportData.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      this.doc.save(fileName);

    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF report');
    }
  }

  public async exportElementToPDF(elementId: string, filename: string): Promise<void> {
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error(`Element with id '${elementId}' not found`);
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = this.pageWidth - 2 * this.margin;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      this.doc.addImage(imgData, 'PNG', this.margin, this.margin, imgWidth, imgHeight);
      this.addFooter();

      this.doc.save(`${filename}.pdf`);
    } catch (error) {
      console.error('Error exporting element to PDF:', error);
      throw new Error('Failed to export element to PDF');
    }
  }
}

export const pdfExportService = new PDFExportService();

// Helper functions for creating chart data
export const createBarChartData = (labels: string[], data: number[], label: string, color: string = '#FF6B6B') => ({
  type: 'bar' as const,
  data: {
    labels,
    datasets: [{
      label,
      data,
      backgroundColor: color,
      borderColor: color,
      borderWidth: 1
    }]
  },
  options: {
    plugins: {
      legend: {
        display: false
      }
    }
  }
});

export const createDoughnutChartData = (labels: string[], data: number[], colors: string[] = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7']) => ({
  type: 'doughnut' as const,
  data: {
    labels,
    datasets: [{
      data,
      backgroundColor: colors,
      borderWidth: 2,
      borderColor: '#fff'
    }]
  }
});

export const createLineChartData = (labels: string[], datasets: Array<{ label: string; data: number[]; color: string }>) => ({
  type: 'line' as const,
  data: {
    labels,
    datasets: datasets.map(dataset => ({
      label: dataset.label,
      data: dataset.data,
      borderColor: dataset.color,
      backgroundColor: dataset.color + '20',
      tension: 0.4,
      fill: true
    }))
  }
});

export const createPieChartData = (labels: string[], data: number[], colors: string[] = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7']) => ({
  type: 'pie' as const,
  data: {
    labels,
    datasets: [{
      data,
      backgroundColor: colors,
      borderWidth: 2,
      borderColor: '#fff'
    }]
  }
});