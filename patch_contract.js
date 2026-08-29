const fs = require("fs");
const path = "src/routes/admin/mall.tsx";
let content = fs.readFileSync(path, "utf8");

const regex =
  /const printContractContent = \([\s\S]*?handlePrintHTML\(isEn \? "Lease Contract" : "عقد الإيجار", html\);\n  };/g;

const match = content.match(regex);
if (!match) {
  console.error("Could not find printContractContent");
  process.exit(1);
}

const replacement = `const printContractContent = (
    tenantName: string,
    shopNum: string,
    shopName: string,
    activity: string,
    phone: string,
    monthlyRent: number,
    deposit: number,
    advancePayment: number,
    startDate: string,
    endDate: string,
    terms: string,
    lang: "ar" | "en",
    idImage?: string,
  ) => {
    const isEn = lang === "en";
    let html = "";
    
    if (isEn) {
      html += \`
        <div class="print-container contract-doc" style="direction: ltr; text-align: left; font-size: 13px; line-height: 1.6; max-width: 800px; margin: 0 auto; color: #000;">
          <h2 style="text-align: center; font-size: 18px; margin-bottom: 5px; text-transform: uppercase;">COMMERCIAL SHOP LEASE AGREEMENT</h2>
          <h3 style="text-align: center; font-size: 14px; margin-top: 0; color: #444;">Juba Mall Management, Juba, Republic of South Sudan</h3>
          
          <h4 style="font-size: 14px; margin-top: 20px; border-bottom: 1px solid #ccc; padding-bottom: 4px;">1. PARTIES</h4>
          <p><strong>Landlord:</strong> Juba Mall Management, Juba, Republic of South Sudan.</p>
          <p><strong>Authorized Representative:</strong> ........................................................................</p>
          <p><strong>Tenant:</strong> \${tenantName || "........................................................................"}</p>
          <p><strong>ID/Registration No.:</strong> ........................................................................</p>
          <p><strong>Address:</strong> ........................................................................</p>
          <p><strong>Telephone/Email:</strong> \${phone || "........................................................................"}</p>

          <h4 style="font-size: 14px; margin-top: 20px; border-bottom: 1px solid #ccc; padding-bottom: 4px;">2. PREMISES</h4>
          <p><strong>Shop No.:</strong> \${shopNum} (\${shopName}) &nbsp;&nbsp;&nbsp;&nbsp; <strong>Floor:</strong> ........................ &nbsp;&nbsp;&nbsp;&nbsp; <strong>Approximate Area:</strong> ........................ square metres</p>
          <p><strong>Permitted Business:</strong> \${activity || "........................................................................"}</p>
          <p>The Premises shall be used only for the commercial purpose stated in this Agreement. The Tenant shall not use the Premises for any other activity without the required prior written approval of Mall Management and in compliance with the laws and regulations of the Republic of South Sudan.</p>

          <h4 style="font-size: 14px; margin-top: 20px; border-bottom: 1px solid #ccc; padding-bottom: 4px;">3. TERM</h4>
          <p><strong>Commencement Date:</strong> \${startDate || ".... / .... / ........"}</p>
          <p><strong>Expiry Date:</strong> \${endDate || ".... / .... / ........"}</p>
          <p><strong>Lease Term:</strong> ........................................................</p>
          <p><strong>Renewal option, if any:</strong> ........................................................</p>
          <p>Any renewal shall be effective only under a written agreement signed by both Parties.</p>

          <h4 style="font-size: 14px; margin-top: 20px; border-bottom: 1px solid #ccc; padding-bottom: 4px;">4. RENT, CURRENCY AND PAYMENT</h4>
          <p><strong>Monthly Rent:</strong> \${monthlyRent} USD</p>
          <p><strong>Annual Rent:</strong> \${monthlyRent * 12} USD</p>
          <p><strong>Agreed Currency:</strong> [ X ] United States Dollars (USD) &nbsp;&nbsp;&nbsp; [ ] South Sudanese Pounds (SSP)</p>
          <p>If the Rent is denominated in USD and may be paid in SSP, the applicable exchange rate, source and date shall be:<br>................................................................................................................................................</p>
          <p><strong>Payment Due Date:</strong> ........................................................</p>
          <p><strong>Payment Method:</strong> ........................................................</p>
          <p>The currency or method of calculating the Rent shall not be changed except by written agreement between the Parties.</p>

          <h4 style="font-size: 14px; margin-top: 20px; border-bottom: 1px solid #ccc; padding-bottom: 4px;">5. SECURITY DEPOSIT</h4>
          <p><strong>Security Deposit:</strong> \${deposit} USD</p>
          <p>The Security Deposit shall secure the Tenant’s performance of its obligations under this Agreement. To the extent permitted by law, the Landlord may apply the deposit toward unpaid Rent or charges, the cost of repairing damage for which the Tenant is responsible, or other amounts due under this Agreement, with an accounting of deductions.<br>Any remaining balance shall be returned after expiry or lawful termination, handover of the Premises, and settlement of all outstanding obligations.</p>

          <h4 style="font-size: 14px; margin-top: 20px; border-bottom: 1px solid #ccc; padding-bottom: 4px;">6. SERVICE CHARGES AND UTILITIES</h4>
          <p><strong>Service Charge:</strong> ........................................ [monthly / annually]</p>
          <p><strong>Electricity:</strong> [ ] included in Rent &nbsp;&nbsp; [ ] separately metered/billed</p>
          <p><strong>Water:</strong> [ ] included in Rent &nbsp;&nbsp; [ ] separately billed</p>
          <p><strong>Other Charges:</strong> ........................................................................................</p>
          <p>The Tenant shall pay all service charges and utility costs allocated to it under this Agreement when due.</p>

          <div style="page-break-before: always; margin-top: 20px;"></div>

          <h4 style="font-size: 14px; margin-top: 20px; border-bottom: 1px solid #ccc; padding-bottom: 4px;">7. FIT-OUT AND ALTERATIONS</h4>
          <p>The Tenant shall not carry out structural works, alterations, installations, signage, or fit-out works without the prior written approval of Mall Management and any governmental approvals required by law.<br>All works shall comply with applicable safety requirements, technical specifications, and Mall standards.</p>

          <h4 style="font-size: 14px; margin-top: 20px; border-bottom: 1px solid #ccc; padding-bottom: 4px;">8. MAINTENANCE AND REPAIRS</h4>
          <p>The Tenant shall keep the Premises clean, safe, and in good condition and shall bear the cost of repairing damage caused by the Tenant or its employees, contractors, customers, or invitees.<br>Mall Management shall be responsible for common areas and matters expressly allocated to it under this Agreement.</p>

          <h4 style="font-size: 14px; margin-top: 20px; border-bottom: 1px solid #ccc; padding-bottom: 4px;">9. MALL RULES</h4>
          <p>The Tenant shall comply with reasonable Mall rules concerning opening hours, security, safety, deliveries, storage, waste disposal, noise, signage, parking, fire safety, and use of common areas.<br>The Tenant shall be notified of material Mall rules and material amendments to them.</p>

          <h4 style="font-size: 14px; margin-top: 20px; border-bottom: 1px solid #ccc; padding-bottom: 4px;">10. LICENCES AND LEGAL COMPLIANCE</h4>
          <p>The Tenant shall obtain and maintain all licences, registrations, permits, approvals, and tax registrations required for its business.<br>The Landlord shall reasonably cooperate where its documents or consent are legally required for such procedures.</p>

          <h4 style="font-size: 14px; margin-top: 20px; border-bottom: 1px solid #ccc; padding-bottom: 4px;">11. INSURANCE AND LIABILITY</h4>
          <p>Where required by law or appropriate to the nature of the business, the Tenant shall maintain suitable commercial insurance for its business and property.<br>Each Party shall be responsible for loss or damage caused by its negligence, wilful misconduct, or breach of this Agreement, to the extent permitted by applicable law.</p>

          <h4 style="font-size: 14px; margin-top: 20px; border-bottom: 1px solid #ccc; padding-bottom: 4px;">12. ASSIGNMENT AND SUBLETTING</h4>
          <p>The Tenant shall not assign this Agreement, transfer its rights or obligations, sublet the Premises, or permit a third party to occupy or use the Premises without the Landlord’s prior written consent, unless otherwise agreed in writing.</p>

          <h4 style="font-size: 14px; margin-top: 20px; border-bottom: 1px solid #ccc; padding-bottom: 4px;">13. DEFAULT AND LATE PAYMENT</h4>
          <p>If the Tenant fails to pay Rent or other amounts when due, or materially breaches its obligations, the Landlord may issue written notice specifying the breach and, where required or appropriate under the Agreement or applicable law, provide a reasonable period to remedy it.<br>Termination or recovery of possession shall be carried out only in accordance with this Agreement and the laws of the Republic of South Sudan.</p>

          <h4 style="font-size: 14px; margin-top: 20px; border-bottom: 1px solid #ccc; padding-bottom: 4px;">14. EXPIRY, TERMINATION AND HANDOVER</h4>
          <p>Upon expiry or lawful termination, the Tenant shall vacate and hand over the Premises to the Landlord, including keys and Landlord-owned fixtures, in the agreed condition, subject to fair wear and tear.<br>The Tenant shall also settle all amounts due up to the date of handover.</p>

          <h4 style="font-size: 14px; margin-top: 20px; border-bottom: 1px solid #ccc; padding-bottom: 4px;">15. FORCE MAJEURE</h4>
          <p>Neither Party shall be liable for delay or failure caused by an event beyond its reasonable control, to the extent recognized by applicable law.<br>The affected Party shall notify the other Party as soon as reasonably practicable and take reasonable steps to mitigate the effects.</p>

          <h4 style="font-size: 14px; margin-top: 20px; border-bottom: 1px solid #ccc; padding-bottom: 4px;">16. NOTICES</h4>
          <p>All notices under this Agreement shall be in writing and delivered by hand, courier, registered mail, or an electronic means agreed by the Parties to the addresses stated in this Agreement, unless a Party has notified the other in writing of a change of address or contact method.</p>

          <h4 style="font-size: 14px; margin-top: 20px; border-bottom: 1px solid #ccc; padding-bottom: 4px;">17. GOVERNING LAW AND DISPUTE RESOLUTION</h4>
          <p>This Agreement shall be governed by the laws of the Republic of South Sudan.<br>The Parties shall first attempt in good faith to resolve any dispute arising out of or in connection with this Agreement amicably.<br>If an amicable settlement cannot be reached, the dispute shall be submitted to the competent court or another legally agreed dispute-resolution forum in Juba, Republic of South Sudan.</p>

          <h4 style="font-size: 14px; margin-top: 20px; border-bottom: 1px solid #ccc; padding-bottom: 4px;">18. ENTIRE AGREEMENT AND AMENDMENTS</h4>
          <p>This Agreement, the Commercial Schedule, and any signed annexes constitute the entire agreement between the Parties concerning the Premises.<br>No amendment, addition, or waiver shall be effective unless made in writing and signed by both Parties.</p>

          <h4 style="font-size: 14px; margin-top: 20px; border-bottom: 1px solid #ccc; padding-bottom: 4px;">19. LANGUAGE</h4>
          <p>This Agreement is executed in Arabic and English, and both texts are intended to express the same agreement.<br>In the event of inconsistency, the controlling language shall be:<br>[ ] Arabic [ ] English [ X ] Both equally, subject to applicable law.</p>

          <div style="page-break-before: always; margin-top: 20px;"></div>

          <h3 style="text-align: center; font-size: 16px; margin-bottom: 20px; text-transform: uppercase;">COMMERCIAL SCHEDULE</h3>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 13px;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Shop No.:</strong> \${shopNum}</td>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Floor:</strong> ..........</td>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Area:</strong> .......... m²</td>
            </tr>
            <tr>
              <td colspan="3" style="padding: 8px; border: 1px solid #ddd;"><strong>Business:</strong> \${activity || "........................................................"}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;" colspan="2"><strong>Commencement:</strong> \${startDate || "..../..../........"}</td>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Expiry:</strong> \${endDate || "..../..../........"}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;" colspan="2"><strong>Rent:</strong> \${monthlyRent} USD</td>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Security Deposit:</strong> \${deposit} USD</td>
            </tr>
            <tr>
              <td colspan="3" style="padding: 8px; border: 1px solid #ddd;"><strong>Exchange Rate:</strong> ........................................................................</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;" colspan="2"><strong>Service Charge:</strong> .......... [USD / SSP]</td>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Annual Escalation:</strong> .......... %</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;" colspan="2"><strong>Fit-out Period:</strong> .......... days</td>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Payment Method:</strong> ....................................</td>
            </tr>
            <tr>
              <td colspan="3" style="padding: 8px; border: 1px solid #ddd;">
                <strong>Special Conditions:</strong>
                <p style="white-space: pre-wrap; margin-top: 5px;">\${terms}</p>
              </td>
            </tr>
          </table>

          <table style="width: 100%; border-collapse: collapse; margin-top: 30px; text-align: left; font-size: 13px;">
            <tr>
              <td style="width: 50%; padding: 10px; vertical-align: top;">
                <strong>LANDLORD</strong><br><br>
                Name: Juba Mall Management<br><br>
                Authorized Signatory: ........................<br><br>
                Signature: ...........................................<br><br>
                Date: ..................................................
              </td>
              <td style="width: 50%; padding: 10px; vertical-align: top;">
                <strong>TENANT</strong><br><br>
                Name: \${tenantName}<br><br>
                Authorized Signatory: ........................<br><br>
                Signature: ...........................................<br><br>
                Date: ..................................................
              </td>
            </tr>
            <tr>
              <td style="width: 50%; padding: 10px; vertical-align: top;">
                <strong>WITNESS 1</strong><br><br>
                Name: ..................................................<br><br>
                ID: ......................................................<br><br>
                Signature: ...........................................
              </td>
              <td style="width: 50%; padding: 10px; vertical-align: top;">
                <strong>WITNESS 2</strong><br><br>
                Name: ..................................................<br><br>
                ID: ......................................................<br><br>
                Signature: ...........................................
              </td>
            </tr>
          </table>
        </div>
      \`;
    } else {
      html += \`
        <div class="print-container contract-doc" style="direction: rtl; text-align: right; font-size: 13px; line-height: 1.6; max-width: 800px; margin: 0 auto; color: #000;">
          <h2 style="text-align: center; font-size: 18px; margin-bottom: 5px;">عقد إيجار محل تجاري</h2>
          <h3 style="text-align: center; font-size: 14px; margin-top: 0; color: #444;">إدارة جوبا مول – Juba Mall Management</h3>
          
          <h4 style="font-size: 14px; margin-top: 20px; border-bottom: 1px solid #ccc; padding-bottom: 4px;">1. أطراف العقد</h4>
          <p><strong>المؤجر:</strong> إدارة جوبا مول – Juba Mall Management، جوبا، جمهورية جنوب السودان.</p>
          <p><strong>العنوان:</strong> ........................................................................</p>
          <p><strong>الممثل المفوض:</strong> ........................................................................</p>
          <p><strong>المستأجر:</strong> \${tenantName || "........................................................................"}</p>
          <p><strong>رقم الهوية/التسجيل:</strong> ........................................................................</p>
          <p><strong>العنوان:</strong> ........................................................................</p>
          <p><strong>الهاتف/البريد الإلكتروني:</strong> \${phone || "........................................................................"}</p>

          <h4 style="font-size: 14px; margin-top: 20px; border-bottom: 1px solid #ccc; padding-bottom: 4px;">2. العين المؤجرة</h4>
          <p><strong>رقم المحل:</strong> \${shopNum} (\${shopName}) &nbsp;&nbsp;&nbsp;&nbsp; <strong>الطابق:</strong> ........................ &nbsp;&nbsp;&nbsp;&nbsp; <strong>المساحة التقريبية:</strong> ........................ متر مربع</p>
          <p><strong>النشاط المصرح به:</strong> \${activity || "........................................................................"}</p>
          <p>يُؤجر المحل للغرض التجاري المبين في هذا العقد، ولا يجوز استخدامه في أي نشاط آخر إلا بعد الحصول على الموافقة الكتابية اللازمة من إدارة المول، وبما لا يخالف القوانين واللوائح المعمول بها في جمهورية جنوب السودان.</p>

          <h4 style="font-size: 14px; margin-top: 20px; border-bottom: 1px solid #ccc; padding-bottom: 4px;">3. مدة الإيجار</h4>
          <p><strong>تاريخ بدء الإيجار:</strong> \${startDate || ".... / .... / ........"}</p>
          <p><strong>تاريخ انتهاء الإيجار:</strong> \${endDate || ".... / .... / ........"}</p>
          <p><strong>مدة الإيجار:</strong> ........................................................</p>
          <p><strong>خيار التجديد، إن وجد:</strong> ........................................................</p>
          <p>لا يكون أي تجديد نافذًا إلا بموجب اتفاق كتابي موقع من الطرفين.</p>

          <h4 style="font-size: 14px; margin-top: 20px; border-bottom: 1px solid #ccc; padding-bottom: 4px;">4. الأجرة والعملة وطريقة السداد</h4>
          <p><strong>الأجرة الشهرية:</strong> \${monthlyRent} USD</p>
          <p><strong>الأجرة السنوية:</strong> \${monthlyRent * 12} USD</p>
          <p><strong>العملة المتفق عليها:</strong> [ X ] الدولار الأمريكي (USD) &nbsp;&nbsp;&nbsp; [ ] الجنيه الجنوب سوداني (SSP)</p>
          <p>إذا كانت الأجرة محددة بالدولار الأمريكي ويُسمح بسدادها بالجنيه الجنوب سوداني، يكون سعر الصرف المعتمد ومصدره وتاريخ احتسابه كما يلي:<br>................................................................................................................................................</p>
          <p><strong>تاريخ استحقاق السداد:</strong> ........................................................</p>
          <p><strong>طريقة السداد:</strong> ........................................................</p>
          <p>لا يجوز تغيير العملة أو طريقة احتساب الأجرة إلا باتفاق كتابي بين الطرفين.</p>

          <h4 style="font-size: 14px; margin-top: 20px; border-bottom: 1px solid #ccc; padding-bottom: 4px;">5. مبلغ التأمين</h4>
          <p><strong>مبلغ التأمين:</strong> \${deposit} USD</p>
          <p>يُدفع مبلغ التأمين ضمانًا لتنفيذ المستأجر لالتزاماته بموجب هذا العقد. ويجوز للمؤجر، في حدود ما يسمح به القانون، استخدام جزء من مبلغ التأمين لتغطية الإيجارات أو الرسوم غير المسددة أو تكاليف إصلاح الأضرار التي تقع على عاتق المستأجر أو أي مبالغ أخرى مستحقة بموجب العقد، مع تقديم بيان بالمبالغ المخصومة.<br>يُرد الرصيد المتبقي من مبلغ التأمين، إن وجد، بعد انتهاء العقد وتسليم المحل وتسوية جميع الالتزامات المستحقة.</p>

          <h4 style="font-size: 14px; margin-top: 20px; border-bottom: 1px solid #ccc; padding-bottom: 4px;">6. رسوم الخدمات والمرافق</h4>
          <p><strong>رسوم الخدمات:</strong> ........................................ [شهريًا / سنويًا]</p>
          <p><strong>الكهرباء:</strong> [ ] مشمولة في الأجرة &nbsp;&nbsp; [ ] تُحسب وتُدفع بشكل منفصل</p>
          <p><strong>المياه:</strong> [ ] مشمولة في الأجرة &nbsp;&nbsp; [ ] تُحسب وتُدفع بشكل منفصل</p>
          <p><strong>رسوم أخرى:</strong> ........................................................................................</p>
          <p>يلتزم المستأجر بسداد جميع رسوم الخدمات والمرافق التي تقع على عاتقه وفقًا لهذا العقد وفي مواعيد استحقاقها.</p>

          <div style="page-break-before: always; margin-top: 20px;"></div>

          <h4 style="font-size: 14px; margin-top: 20px; border-bottom: 1px solid #ccc; padding-bottom: 4px;">7. أعمال التجهيز والتعديلات</h4>
          <p>لا يجوز للمستأجر تنفيذ أي أعمال إنشائية أو تغييرات أو تركيبات أو لافتات أو أعمال تشطيب وتجهيز داخل المحل إلا بعد الحصول على موافقة كتابية مسبقة من إدارة المول، وعلى أي موافقات حكومية تكون مطلوبة قانونًا.<br>ويجب تنفيذ جميع الأعمال وفق متطلبات السلامة والمواصفات الفنية واللوائح المعتمدة من إدارة المول.</p>

          <h4 style="font-size: 14px; margin-top: 20px; border-bottom: 1px solid #ccc; padding-bottom: 4px;">8. الصيانة والإصلاحات</h4>
          <p>يلتزم المستأجر بالمحافظة على المحل نظيفًا وسليمًا وصالحًا للاستعمال، ويتحمل تكلفة إصلاح الأضرار الناتجة عن فعله أو إهماله أو فعل موظفيه أو مقاوليه أو عملائه أو زواره.<br>وتتولى إدارة المول مسؤولية المناطق المشتركة والأعمال التي يحددها هذا العقد صراحةً على أنها من مسؤوليتها.</p>

          <h4 style="font-size: 14px; margin-top: 20px; border-bottom: 1px solid #ccc; padding-bottom: 4px;">9. لوائح المول</h4>
          <p>يلتزم المستأجر بجميع اللوائح المعقولة التي تضعها إدارة المول والمتعلقة بمواعيد العمل والأمن والسلامة والتوريد والتخزين والتخلص من النفايات والضوضاء واللافتات ومواقف السيارات والسلامة من الحريق واستخدام المناطق المشتركة.<br>ويشترط أن يتم إبلاغ المستأجر بأي لوائح أو تعديلات جوهرية عليها.</p>

          <h4 style="font-size: 14px; margin-top: 20px; border-bottom: 1px solid #ccc; padding-bottom: 4px;">10. التراخيص والامتثال للقانون</h4>
          <p>يتحمل المستأجر مسؤولية الحصول على جميع التراخيص والتسجيلات والتصاريح والموافقات اللازمة لممارسة نشاطه والمحافظة على سريانها، بما في ذلك أي تسجيلات أو التزامات ضريبية مطلوبة قانونًا.<br>ويلتزم المؤجر، في حدود المعقول، بالتعاون مع المستأجر عندما تكون مستنداته أو موافقته مطلوبة بصورة قانونية لإتمام تلك الإجراءات.</p>

          <h4 style="font-size: 14px; margin-top: 20px; border-bottom: 1px solid #ccc; padding-bottom: 4px;">11. التأمين والمسؤولية</h4>
          <p>يلتزم المستأجر، متى كان ذلك مطلوبًا قانونًا أو مناسبًا لطبيعة نشاطه، بالحصول على التأمينات التجارية المناسبة لممتلكاته ونشاطه.<br>ويتحمل كل طرف المسؤولية عن الخسائر أو الأضرار الناتجة عن إهماله أو سوء سلوكه العمدي أو إخلاله بهذا العقد، وذلك في حدود ما يسمح به القانون المعمول به.</p>

          <h4 style="font-size: 14px; margin-top: 20px; border-bottom: 1px solid #ccc; padding-bottom: 4px;">12. التنازل والتأجير من الباطن</h4>
          <p>لا يجوز للمستأجر التنازل عن هذا العقد أو نقل حقوقه أو التزاماته أو تأجير المحل من الباطن أو تمكين الغير من الانتفاع به، إلا بعد الحصول على موافقة كتابية مسبقة من المؤجر، ما لم يتفق الطرفان كتابةً على خلاف ذلك.</p>

          <h4 style="font-size: 14px; margin-top: 20px; border-bottom: 1px solid #ccc; padding-bottom: 4px;">13. الإخلال والتأخر في السداد</h4>
          <p>إذا تأخر المستأجر في سداد الأجرة أو أي مبالغ مستحقة، أو ارتكب إخلالًا جوهريًا بأي من التزاماته، يجوز للمؤجر توجيه إخطار كتابي يحدد طبيعة الإخلال، ومنح مهلة لمعالجة الإخلال متى كان ذلك مطلوبًا أو مناسبًا وفقًا للعقد والقانون.<br>ولا يجوز إنهاء العقد أو استرداد الحيازة إلا وفقًا لأحكام هذا العقد والقوانين المعمول بها في جمهورية جنوب السودان.</p>

          <h4 style="font-size: 14px; margin-top: 20px; border-bottom: 1px solid #ccc; padding-bottom: 4px;">14. انتهاء العقد والتسليم</h4>
          <p>عند انتهاء مدة العقد أو إنهائه بصورة قانونية، يلتزم المستأجر بإخلاء المحل وتسليمه إلى المؤجر، مع تسليم المفاتيح والتجهيزات المملوكة للمؤجر، بالحالة المتفق عليها مع مراعاة الاستهلاك الطبيعي الناتج عن الاستعمال المعتاد.<br>كما يلتزم المستأجر بتسوية جميع المبالغ المستحقة عليه حتى تاريخ التسليم.</p>

          <h4 style="font-size: 14px; margin-top: 20px; border-bottom: 1px solid #ccc; padding-bottom: 4px;">15. القوة القاهرة</h4>
          <p>لا يكون أي من الطرفين مسؤولًا عن التأخير أو عدم التنفيذ الناجم عن حدث خارج عن سيطرته المعقولة، بالقدر الذي يعترف به القانون المعمول به.<br>ويلتزم الطرف المتأثر بإخطار الطرف الآخر في أقرب وقت ممكن واتخاذ الإجراءات المعقولة للحد من آثار الحدث.</p>

          <h4 style="font-size: 14px; margin-top: 20px; border-bottom: 1px solid #ccc; padding-bottom: 4px;">16. الإخطارات</h4>
          <p>تكون جميع الإخطارات المتعلقة بهذا العقد مكتوبة، وتسلم باليد أو بواسطة البريد السريع أو البريد المسجل أو وسيلة إلكترونية يتفق عليها الطرفان، إلى العناوين المبينة في هذا العقد، ما لم يُخطر أحد الطرفين الطرف الآخر كتابيًا بتغيير عنوانه أو وسيلة الاتصال المعتمدة.</p>

          <h4 style="font-size: 14px; margin-top: 20px; border-bottom: 1px solid #ccc; padding-bottom: 4px;">17. القانون الواجب التطبيق وتسوية النزاعات</h4>
          <p>يخضع هذا العقد لقوانين جمهورية جنوب السودان.<br>يسعى الطرفان أولًا وبحسن نية إلى تسوية أي نزاع أو خلاف ينشأ عن هذا العقد أو يتعلق به تسوية ودية.<br>وفي حال تعذر التوصل إلى تسوية ودية، يُحال النزاع إلى المحكمة المختصة أو إلى وسيلة أخرى لتسوية النزاعات يتفق عليها الطرفان بصورة قانونية في جوبا، جمهورية جنوب السودان.</p>

          <h4 style="font-size: 14px; margin-top: 20px; border-bottom: 1px solid #ccc; padding-bottom: 4px;">18. كامل الاتفاق والتعديلات</h4>
          <p>يمثل هذا العقد وجدول البيانات التجارية وأي ملاحق موقعة من الطرفين كامل الاتفاق بينهما بشأن المحل.<br>ولا يكون أي تعديل أو إضافة أو تنازل عن أي حكم من أحكام العقد نافذًا إلا إذا كان مكتوبًا وموقعًا من الطرفين.</p>

          <h4 style="font-size: 14px; margin-top: 20px; border-bottom: 1px solid #ccc; padding-bottom: 4px;">19. اللغة</h4>
          <p>حُرر هذا العقد باللغتين العربية والإنجليزية، ويقصد بالنصين التعبير عن الاتفاق ذاته.<br>اللغة المعتمدة في حال وجود تعارض بين النصين:<br>[ ] العربية [ ] الإنجليزية [ X ] كلتاهما بالتساوي، وذلك مع مراعاة أحكام القانون المعمول به.</p>

          <div style="page-break-before: always; margin-top: 20px;"></div>

          <h3 style="text-align: center; font-size: 16px; margin-bottom: 20px;">جدول البيانات التجارية</h3>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 13px;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>رقم المحل:</strong> \${shopNum}</td>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>الطابق:</strong> ..........</td>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>المساحة:</strong> .......... متر مربع</td>
            </tr>
            <tr>
              <td colspan="3" style="padding: 8px; border: 1px solid #ddd;"><strong>النشاط:</strong> \${activity || "........................................................"}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;" colspan="2"><strong>تاريخ البداية:</strong> \${startDate || "..../..../........"}</td>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>تاريخ الانتهاء:</strong> \${endDate || "..../..../........"}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;" colspan="2"><strong>الإيجار:</strong> \${monthlyRent} USD</td>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>مبلغ التأمين:</strong> \${deposit} USD</td>
            </tr>
            <tr>
              <td colspan="3" style="padding: 8px; border: 1px solid #ddd;"><strong>سعر الصرف:</strong> ........................................................................</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;" colspan="2"><strong>رسوم الخدمات:</strong> .......... [USD / SSP]</td>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>الزيادة السنوية:</strong> .......... %</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;" colspan="2"><strong>فترة التجهيز:</strong> .......... يومًا</td>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>طريقة السداد:</strong> ....................................</td>
            </tr>
            <tr>
              <td colspan="3" style="padding: 8px; border: 1px solid #ddd;">
                <strong>الشروط الخاصة:</strong>
                <p style="white-space: pre-wrap; margin-top: 5px;">\${terms}</p>
              </td>
            </tr>
          </table>

          <table style="width: 100%; border-collapse: collapse; margin-top: 30px; text-align: right; font-size: 13px;">
            <tr>
              <td style="width: 50%; padding: 10px; vertical-align: top;">
                <strong>المؤجر</strong><br><br>
                إدارة جوبا مول<br><br>
                الممثل المفوض: ........................<br><br>
                التوقيع: ...........................................<br><br>
                التاريخ: ..................................................
              </td>
              <td style="width: 50%; padding: 10px; vertical-align: top;">
                <strong>المستأجر</strong><br><br>
                الاسم: \${tenantName}<br><br>
                الممثل المفوض: ........................<br><br>
                التوقيع: ...........................................<br><br>
                التاريخ: ..................................................
              </td>
            </tr>
            <tr>
              <td style="width: 50%; padding: 10px; vertical-align: top;">
                <strong>الشاهد الأول</strong><br><br>
                الاسم: ..................................................<br><br>
                رقم الهوية: ......................................................<br><br>
                التوقيع: ...........................................
              </td>
              <td style="width: 50%; padding: 10px; vertical-align: top;">
                <strong>الشاهد الثاني</strong><br><br>
                الاسم: ..................................................<br><br>
                رقم الهوية: ......................................................<br><br>
                التوقيع: ...........................................
              </td>
            </tr>
          </table>
        </div>
      \`;
    }

    if (idImage) {
      html += \`
        <div class="print-container" style="page-break-before: always; margin-top: 30px; text-align: center; direction: \${isEn ? 'ltr' : 'rtl'};">
          <h3 style="margin-bottom: 12px; font-size: 16px;">\${isEn ? "Tenant ID / Passport" : "صورة الهوية / جواز السفر"}</h3>
          <img src="\${idImage}" style="max-width: 100%; max-height: 700px; object-fit: contain; border: 1px solid #cbd5e1; border-radius: 8px;" />
        </div>
      \`;
    }

    handlePrintHTML(isEn ? "Lease Contract" : "عقد الإيجار", html);
  };`;

content = content.replace(match[0], replacement);

fs.writeFileSync(path, content);
console.log("Replaced printContractContent successfully.");
