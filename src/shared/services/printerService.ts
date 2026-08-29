export interface PrintableReceiptData {
  storeName?: string; storeSubtitle?: string; taxNumber?: string; commercialRegister?: string;
  orderNumber?: string | number; orderType?: string; paymentMethod?: string; customerName?: string; date?: string;
  items: Array<{name:string;quantity:number;price:number}>;
  subtotal:number; discount?:number; serviceFee?:number; deliveryFee?:number; tax:number; taxRate?:number; total:number;
  currency?:string; thankYouMessage?:string; footerNotes?:string; wifiInfo?:string;
}

const n=(v:any)=>Number.isFinite(Number(v))?Number(v):0;
function normalize(data: PrintableReceiptData): PrintableReceiptData {
  const items=Array.isArray(data?.items)?data.items.map(i=>({name:String(i?.name??""),quantity:n(i?.quantity)||1,price:n(i?.price)})):[];
  const itemSubtotal=items.reduce((s,i)=>s+i.price*i.quantity,0);
  const subtotal=n(data?.subtotal) || itemSubtotal;
  const discount=n(data?.discount), service=n(data?.serviceFee), delivery=n(data?.deliveryFee), tax=n(data?.tax);
  const total=n(data?.total) || Math.max(0, subtotal-discount+service+delivery+tax);
  return {...data,items,subtotal,discount,serviceFee:service,deliveryFee:delivery,tax,total};
}
function esc(v:any){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]!));}

class ThermalPrinterService {
  private port:any=null; private writer:any=null; private isConnected=false;
  constructor(){this.checkSavedPrinter();}
  private checkSavedPrinter(){if(typeof window!=="undefined"&&"serial"in navigator){(navigator as any).serial?.getPorts().then((p:any[])=>{if(p?.length){this.port=p[0];this.isConnected=true;this.notifyStatus();}}).catch(()=>{});}}
  public isPrinterConnected(){return this.isConnected;}
  public async connectThermalPrinter():Promise<boolean>{if(typeof window==="undefined"||!("serial"in navigator)){alert("متصفحك لا يدعم الاتصال المباشر عبر Web Serial. يمكنك استخدام طباعة المتصفح العادية.");return false;}try{this.port=await (navigator as any).serial.requestPort();await this.port.open({baudRate:9600});this.isConnected=true;this.notifyStatus();return true;}catch{this.isConnected=false;this.notifyStatus();return false;}}
  public async disconnectPrinter(){try{this.writer?.releaseLock?.();if(this.port)await this.port.close();}catch{}this.writer=null;this.port=null;this.isConnected=false;this.notifyStatus();}
  private notifyStatus(){if(typeof window!=="undefined")window.dispatchEvent(new CustomEvent("thermal_printer_status_changed",{detail:{isConnected:this.isConnected}}));}
  public async printReceipt(input?:PrintableReceiptData){const data=input?normalize(input):input;if(!data)return{method:"browser" as const,success:false};if(this.isConnected&&this.port){try{if(await this.sendEscPosToPrinter(data))return{method:"direct" as const,success:true};}catch{this.isConnected=false;this.notifyStatus();}}if(typeof window!=="undefined"){try{window.print();}catch{this.printHtmlWindow(data);}return{method:"browser" as const,success:true};}return{method:"browser" as const,success:false};}
  public printHtmlWindow(input:PrintableReceiptData){if(typeof window==="undefined")return;const data=normalize(input);const w=window.open("","_blank","width=420,height=650,scrollbars=yes,resizable=yes");if(!w){window.print();return;}const rows=data.items.map(i=>`<tr><td>${esc(i.name)}</td><td style="text-align:center">x${i.quantity}</td><td style="text-align:left;font-weight:bold">${(i.price*i.quantity).toFixed(2)} ${esc(data.currency||"ج.م")}</td></tr>`).join("");w.document.open();w.document.write(`<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>طباعة الإيصال #${data.orderNumber??""}</title><style>@page{size:80mm auto;margin:0}body{font-family:Arial,sans-serif;width:76mm;margin:0 auto;padding:8px;color:#000;font-size:12px}.c{text-align:center}.d{border-top:1px dashed #000;margin:8px 0}table{width:100%;border-collapse:collapse;font-size:11px}td{padding:4px 0;border-bottom:1px dashed #eee}.total{font-size:16px;font-weight:900;border:2px solid #000;padding:8px;margin-top:8px;text-align:center}</style></head><body><div class="c"><h2>${esc(data.storeName||"مطعم ومقهى ريستوكاش")}</h2><div>${esc(data.storeSubtitle||"إيصال مبيعات")}</div></div><div class="d"></div><b>رقم الطلب: #${data.orderNumber??""}</b><div>${esc(data.date||"")}</div><div class="d"></div><table>${rows}</table><div class="d"></div><div>المجموع الفرعي: ${data.subtotal.toFixed(2)} ${esc(data.currency||"ج.م")}</div>${data.discount?`<div>الخصم: -${data.discount.toFixed(2)}</div>`:""}${data.serviceFee?`<div>خدمة الصالة: +${data.serviceFee.toFixed(2)}</div>`:""}${data.deliveryFee?`<div>التوصيل: +${data.deliveryFee.toFixed(2)}</div>`:""}<div>الضريبة: ${data.tax.toFixed(2)}</div><div class="total">الإجمالي: ${data.total.toFixed(2)} ${esc(data.currency||"ج.م")}</div><div class="d"></div><div class="c">${esc(data.thankYouMessage||"")}</div><script>setTimeout(()=>{window.focus();window.print()},300)</script></body></html>`);w.document.close();}
  private async sendEscPosToPrinter(data:PrintableReceiptData){if(!this.port)return false;if(!this.writer)this.writer=this.port.writable.getWriter();const e=new TextEncoder(),b:number[]=[];const ESC=27,GS=29;b.push(ESC,64,ESC,97,1);this.appendUtf8Bytes(b,(data.storeName||"مطعم ومقهى ريستوكاش")+"\n",e);this.appendUtf8Bytes(b,"--------------------------------\n",e);this.appendUtf8Bytes(b,`رقم الطلب: #${data.orderNumber??""}\n`,e);data.items.forEach(i=>this.appendUtf8Bytes(b,`${i.name} x${i.quantity} = ${(i.price*i.quantity).toFixed(2)} ${data.currency||"ج.م"}\n`,e));this.appendUtf8Bytes(b,"--------------------------------\n",e);this.appendUtf8Bytes(b,`المجموع الفرعي: ${data.subtotal.toFixed(2)} ${data.currency||"ج.م"}\n`,e);if(data.discount)this.appendUtf8Bytes(b,`الخصم: -${data.discount.toFixed(2)}\n`,e);if(data.serviceFee)this.appendUtf8Bytes(b,`خدمة الصالة: +${data.serviceFee.toFixed(2)}\n`,e);if(data.deliveryFee)this.appendUtf8Bytes(b,`التوصيل: +${data.deliveryFee.toFixed(2)}\n`,e);this.appendUtf8Bytes(b,`الضريبة: ${data.tax.toFixed(2)}\n`,e);b.push(GS,33,17);this.appendUtf8Bytes(b,`الإجمالي: ${data.total.toFixed(2)} ${data.currency||"ج.م"}\n`,e);b.push(GS,33,0,10,10,10);await this.writer.write(new Uint8Array(b));return true;}
  private appendUtf8Bytes(target:number[],text:string,encoder:TextEncoder){target.push(...encoder.encode(text));}
}
export const printerService=new ThermalPrinterService();
