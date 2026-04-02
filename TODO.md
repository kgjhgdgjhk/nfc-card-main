# TODO: إصلاح مشكلة معاينة القالب على Render.com

## الخطوات المكتملة ✅
- [x] إنشاء TODO.md وتأكيد الخطة

## الخطوات المتبقية ⏳
1. **تعديل server.js** - إضافة دعم query params للـ template-preview
2. **تعديل views/create-profile-step2.ejs** - تحديث الـ form لتمرير البيانات عبر query params
3. **تعديل views/template-preview.ejs** - إضافة null checks للسلامة
4. **اختبار محلي** - التحقق من `/template-preview/3d?name=Test&title=Dev`
5. **نشر على Render** - تحديث Build/Start commands
6. **اختبار كامل** - create-profile → step2 → preview
7. **إنهاء المهمة** - attempt_completion

## حالة الحل
- **السبب**: Render لا يعالج EJS + sessions مفقودة
- **الحل**: Query params fallback → يعمل بدون session

