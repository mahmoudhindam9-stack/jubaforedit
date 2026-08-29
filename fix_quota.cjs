const fs = require("fs");
const path = "src/routes/admin/ledger.tsx";
let content = fs.readFileSync(path, "utf8");

const targetStr = `        } catch (err) {
          console.error(err);
          alert("حدث خطأ أثناء معالجة الملف. تأكد من أن الملف بنفس صيغة أوراكل.");
        }`;

const newStr = `        } catch (err: any) {
          console.error(err);
          if (err instanceof DOMException && err.name === 'QuotaExceededError' || (err.message && err.message.toLowerCase().includes('quota'))) {
            alert("حجم البيانات كبير جداً وتجاوز سعة التخزين المحلية للمتصفح (5 ميجابايت).\\n\\nلحل المشكلة:\\n1. قم بتقسيم ملف الإكسيل إلى أجزاء أصغر (مثلاً: ارفع كل شهر في ملف مستقل).\\n2. أو يمكنك تفعيل الربط مع قاعدة بيانات سحابية (Supabase) للتعامل مع السنوات والبيانات الضخمة.");
          } else {
            alert("حدث خطأ أثناء معالجة الملف. تأكد من أن الملف بنفس صيغة أوراكل.");
          }
        }`;

content = content.replace(targetStr, newStr);
fs.writeFileSync(path, content);
console.log("Fixed quota error message");
