// Thermal Printer Service (Web Serial & ESC/POS + Fallback to Browser Print Preview)

export interface PrintableReceiptData {
  storeName?: string;
  storeSubtitle?: string;
  taxNumber?: string;
  commercialRegister?: string;
  orderNumber?: string | number;
  orderType?: string;
  paymentMethod?: string;
  customerName?: string;
  date?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  discount?: number;
  serviceFee?: number;
  deliveryFee?: number;
  tax: number;
  taxRate?: number;
  total: number;
  currency?: string;
  thankYouMessage?: string;
  footerNotes?: string;
  wifiInfo?: string;
}

class ThermalPrinterService {
  private port: any = null;
  private writer: any = null;
  private isConnected: boolean = false;

  constructor() {
    this.checkSavedPrinter();
  }

  private checkSavedPrinter() {
    if (typeof window !== "undefined" && "serial" in navigator) {
      (navigator as any).serial
        ?.getPorts()
        .then((ports: any[]) => {
          if (ports.length > 0) {
            this.port = ports[0];
            this.isConnected = true;
            this.notifyStatus();
          }
        })
        .catch(() => {});
    }
  }

  public isPrinterConnected(): boolean {
    return this.isConnected;
  }

  public async connectThermalPrinter(): Promise<boolean> {
    if (typeof window === "undefined" || !("serial" in navigator)) {
      alert("متصفحك لا يدعم الاتصال المباشر عبر Web Serial. يمكنك استخدام طباعة المتصفح العادية.");
      return false;
    }

    try {
      this.port = await (navigator as any).serial.requestPort();
      await this.port.open({ baudRate: 9600 });
      this.isConnected = true;
      this.notifyStatus();
      return true;
    } catch (err: any) {
      console.warn("Failed to connect thermal printer via Web Serial:", err);
      this.isConnected = false;
      this.notifyStatus();
      return false;
    }
  }

  public async disconnectPrinter() {
    try {
      if (this.writer) {
        await this.writer.close();
        this.writer = null;
      }
      if (this.port) {
        await this.port.close();
        this.port = null;
      }
    } catch (e) {
      console.error(e);
    }
    this.isConnected = false;
    this.notifyStatus();
  }

  private notifyStatus() {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("thermal_printer_status_changed", {
          detail: { isConnected: this.isConnected },
        }),
      );
    }
  }

  /**
   * Main Smart Print Method:
   * - If Thermal Printer is CONNECTED -> Direct ESC/POS Print immediately!
   * - If Thermal Printer is NOT CONNECTED -> Fallback to window.print() + printHtmlWindow if needed
   */
  public async printReceipt(
    data?: PrintableReceiptData,
  ): Promise<{ method: "direct" | "browser"; success: boolean }> {
    if (this.isConnected && this.port) {
      try {
        const success = await this.sendEscPosToPrinter(data);
        if (success) {
          return { method: "direct", success: true };
        }
      } catch (err) {
        console.warn("Direct thermal print error, falling back to browser print preview:", err);
        this.isConnected = false;
        this.notifyStatus();
      }
    }

    // Fallback: Open Browser Print Preview directly
    if (typeof window !== "undefined") {
      try {
        window.print();
      } catch (err) {
        console.warn("window.print failed or blocked in iframe, opening popup print window:", err);
        if (data) {
          this.printHtmlWindow(data);
        }
      }
      return { method: "browser", success: true };
    }

    return { method: "browser", success: false };
  }

  /**
   * Dedicated Print Window Popup (Bypasses iframe sandboxing and ensures thermal receipt preview)
   */
  public printHtmlWindow(data: PrintableReceiptData) {
    if (typeof window === "undefined") return;

    const printWindow = window.open(
      "",
      "_blank",
      "width=420,height=650,scrollbars=yes,resizable=yes",
    );
    if (!printWindow) {
      window.print();
      return;
    }

    const itemsRows = (data.items || [])
      .map(
        (it) => `
      <tr>
        <td style="text-align: right; padding: 4px 0; border-bottom: 1px dashed #eee;">${it.name}</td>
        <td style="text-align: center; padding: 4px 0; border-bottom: 1px dashed #eee;">x${it.quantity}</td>
        <td style="text-align: left; padding: 4px 0; border-bottom: 1px dashed #eee; font-weight: bold;">
          ${(it.price * it.quantity).toFixed(2)} ${data.currency || "ج.م"}
        </td>
      </tr>
    `,
      )
      .join("");

    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>طباعة الإيصال - #${data.orderNumber || ""}</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          body {
            font-family: 'Courier New', Courier, monospace, system-ui, sans-serif;
            width: 76mm;
            margin: 0 auto;
            padding: 12px;
            color: #000;
            background: #fff;
            font-size: 12px;
            line-height: 1.4;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .text-left { text-align: left; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 8px 0; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          .total-box {
            font-size: 16px;
            font-weight: 900;
            border: 2px solid #000;
            padding: 8px;
            margin-top: 8px;
            text-align: center;
            border-radius: 6px;
          }
          .print-btn {
            background: #10b981;
            color: white;
            border: none;
            padding: 10px 20px;
            font-weight: bold;
            border-radius: 8px;
            cursor: pointer;
            width: 100%;
            margin-bottom: 12px;
            font-size: 14px;
          }
          @media print {
            .no-print { display: none !important; }
            body { width: 100%; margin: 0; padding: 5px; }
          }
        </style>
      </head>
      <body>
        <div class="no-print">
          <button onclick="window.print()" class="print-btn">🖨️ اضغط هنا للطباعة الفورية</button>
        </div>

        <div class="text-center">
          <h2 style="margin: 0 0 4px 0; font-size: 18px;">${data.storeName || "مطعم ومقهى ريستوكاش"}</h2>
          <div style="font-size: 11px;">${data.storeSubtitle || "إيصال مبيعات"}</div>
          ${data.taxNumber ? `<div style="font-size: 10px;">الرقم الضريبي: ${data.taxNumber}</div>` : ""}
        </div>
        
        <div class="divider"></div>
        
        ${data.orderNumber ? `<div class="bold text-center" style="font-size: 16px;">رقم الطلب: #${data.orderNumber}</div>` : ""}
        ${data.date ? `<div style="font-size: 11px;">التاريخ: ${data.date}</div>` : ""}
        ${data.orderType ? `<div style="font-size: 11px;">نوع الطلب: ${data.orderType}</div>` : ""}
        ${data.paymentMethod ? `<div style="font-size: 11px;">طريقة الدفع: ${data.paymentMethod}</div>` : ""}
        
        <div class="divider"></div>
        
        <table>
          <thead>
            <tr style="border-bottom: 1px solid #000;">
              <th class="text-right">الصنف</th>
              <th class="text-center">الكمية</th>
              <th class="text-left">السعر</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>
        
        <div class="divider"></div>
        
        <div style="display: flex; justify-content: space-between;">
          <span>المجموع الفرعي:</span>
          <span>${data.subtotal.toFixed(2)} ${data.currency || "ج.م"}</span>
        </div>
        ${
          data.discount && data.discount > 0
            ? `
          <div style="display: flex; justify-content: space-between; font-weight: bold;">
            <span>الخصم:</span>
            <span>-${data.discount.toFixed(2)} ${data.currency || "ج.م"}</span>
          </div>
        `
            : ""
        }
        ${
          data.serviceFee && data.serviceFee > 0
            ? `
          <div style="display: flex; justify-content: space-between;">
            <span>خدمة الصالة:</span>
            <span>+${data.serviceFee.toFixed(2)} ${data.currency || "ج.م"}</span>
          </div>
        `
            : ""
        }
        ${
          data.deliveryFee && data.deliveryFee > 0
            ? `
          <div style="display: flex; justify-content: space-between;">
            <span>رسوم التوصيل:</span>
            <span>+${data.deliveryFee.toFixed(2)} ${data.currency || "ج.م"}</span>
          </div>
        `
            : ""
        }
        ${
          data.tax && data.tax > 0
            ? `
          <div style="display: flex; justify-content: space-between;">
            <span>الضريبة${data.taxRate ? ` (${data.taxRate}%)` : ""}:</span>
            <span>${data.tax.toFixed(2)} ${data.currency || "ج.م"}</span>
          </div>
        `
            : ""
        }
        
        <div class="total-box">
          الإجمالي: ${data.total.toFixed(2)} ${data.currency || "ج.م"}
        </div>
        
        <div class="divider"></div>
        
        <div class="text-center" style="margin-top: 10px;">
          ${data.thankYouMessage ? `<div class="bold">${data.thankYouMessage}</div>` : ""}
          ${data.footerNotes ? `<div style="font-size: 10px; margin-top: 4px;">${data.footerNotes}</div>` : ""}
        </div>
        
        <script>
          setTimeout(function() {
            window.focus();
            window.print();
          }, 300);
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }

  /**
   * Generate ESC/POS commands and send to serial port writer
   */
  private async sendEscPosToPrinter(data?: PrintableReceiptData): Promise<boolean> {
    if (!this.port) return false;

    if (!this.writer) {
      const writableStreamClosed = this.port.writable;
      this.writer = writableStreamClosed.getWriter();
    }

    const encoder = new TextEncoder();
    const bytes: number[] = [];

    // ESC/POS Commands
    const ESC = 0x1b;
    const GS = 0x1d;

    // Initialize Printer
    bytes.push(ESC, 0x40);

    // Center Align
    bytes.push(ESC, 0x61, 1);

    if (data) {
      const storeName = data.storeName || "مطعم ومقهى ريستوكاش";
      const subtitle = data.storeSubtitle || "إيصال مبيعات";
      const orderNum = data.orderNumber ? `#${data.orderNumber}` : "";
      const curr = data.currency || "ج.م";

      // Big Title
      bytes.push(GS, 0x21, 0x11); // Double size
      this.appendUtf8Bytes(bytes, storeName + "\n", encoder);

      bytes.push(GS, 0x21, 0x00); // Normal size
      this.appendUtf8Bytes(bytes, subtitle + "\n", encoder);

      if (data.taxNumber) {
        this.appendUtf8Bytes(bytes, `الرقم الضريبي: ${data.taxNumber}\n`, encoder);
      }

      this.appendUtf8Bytes(bytes, "--------------------------------\n", encoder);

      if (orderNum) {
        bytes.push(ESC, 0x45, 1); // Bold
        this.appendUtf8Bytes(bytes, `رقم الطلب: ${orderNum}\n`, encoder);
        bytes.push(ESC, 0x45, 0); // Bold off
      }

      if (data.date) {
        this.appendUtf8Bytes(bytes, `التاريخ: ${data.date}\n`, encoder);
      }
      if (data.orderType) {
        this.appendUtf8Bytes(bytes, `نوع الطلب: ${data.orderType}\n`, encoder);
      }
      if (data.paymentMethod) {
        this.appendUtf8Bytes(bytes, `طريقة الدفع: ${data.paymentMethod}\n`, encoder);
      }

      this.appendUtf8Bytes(bytes, "--------------------------------\n", encoder);

      // Left align items
      bytes.push(ESC, 0x61, 0);
      data.items.forEach((item) => {
        const line = `${item.name} x${item.quantity} = ${(item.price * item.quantity).toFixed(2)} ${curr}\n`;
        this.appendUtf8Bytes(bytes, line, encoder);
      });

      bytes.push(ESC, 0x61, 1); // Center align
      this.appendUtf8Bytes(bytes, "--------------------------------\n", encoder);

      // Totals
      this.appendUtf8Bytes(bytes, `المجموع الفرعي: ${data.subtotal.toFixed(2)} ${curr}\n`, encoder);
      if (data.discount && data.discount > 0) {
        this.appendUtf8Bytes(bytes, `الخصم: -${data.discount.toFixed(2)} ${curr}\n`, encoder);
      }
      if (data.serviceFee && data.serviceFee > 0) {
        this.appendUtf8Bytes(
          bytes,
          `خدمة الصالة: +${data.serviceFee.toFixed(2)} ${curr}\n`,
          encoder,
        );
      }
      if (data.deliveryFee && data.deliveryFee > 0) {
        this.appendUtf8Bytes(
          bytes,
          `خدمة التوصيل: +${data.deliveryFee.toFixed(2)} ${curr}\n`,
          encoder,
        );
      }
      if (data.tax > 0) {
        const taxRateLabel = data.taxRate ? ` (${data.taxRate}%)` : "";
        this.appendUtf8Bytes(
          bytes,
          `الضريبة${taxRateLabel}: ${data.tax.toFixed(2)} ${curr}\n`,
          encoder,
        );
      }

      bytes.push(ESC, 0x45, 1); // Bold
      bytes.push(GS, 0x21, 0x01); // Double height
      this.appendUtf8Bytes(bytes, `الإجمالي: ${data.total.toFixed(2)} ${curr}\n`, encoder);
      bytes.push(GS, 0x21, 0x00);
      bytes.push(ESC, 0x45, 0);

      this.appendUtf8Bytes(bytes, "--------------------------------\n", encoder);

      if (data.thankYouMessage) {
        this.appendUtf8Bytes(bytes, `${data.thankYouMessage}\n`, encoder);
      }
      if (data.footerNotes) {
        this.appendUtf8Bytes(bytes, `${data.footerNotes}\n`, encoder);
      }
    } else {
      this.appendUtf8Bytes(bytes, "إيصال مبيعات - طباعة حرارية مباشرة\n", encoder);
    }

    // Feed lines & Cut Paper
    bytes.push(ESC, 0x64, 0x04); // Feed 4 lines
    bytes.push(GS, 0x56, 0x41, 0x03); // Full Cut

    const uint8Array = new Uint8Array(bytes);
    await this.writer.write(uint8Array);
    return true;
  }

  private appendUtf8Bytes(targetArray: number[], str: string, encoder: TextEncoder) {
    const encoded = encoder.encode(str);
    encoded.forEach((b) => targetArray.push(b));
  }
}

export const printerService = new ThermalPrinterService();
