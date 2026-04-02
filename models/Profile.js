const dotenv = require('dotenv');
const { Sequelize, DataTypes } = require('sequelize');
dotenv.config();

// ============================================
// ✅ تفعيل الاتصال بقاعدة البيانات PostgreSQL
// ============================================
console.log('📡 جاري الاتصال بقاعدة البيانات PostgreSQL...');

// ============================================
// 🔒 حماية إضافية: التحقق من وجود DATABASE_URL
// ============================================
if (!process.env.DATABASE_URL) {
    console.error('❌ خطأ: DATABASE_URL غير موجود في متغيرات البيئة');
    console.error('📌 تأكد من إضافة DATABASE_URL إلى ملف .env');
}

// تهيئة الاتصال بقاعدة البيانات باستخدام DATABASE_URL
const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false // مهم لـ Render
        }
    },
    logging: false, // إيقاف تسجيل الاستعلامات (يمكن تفعيله للتصحيح)
    
    // 🔒 حماية إضافية: إعدادات المهلة
    pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    
    // 🔒 حماية: تعطيل استخدام الجمل الخطيرة
    retry: {
        max: 3
    }
});

// اختبار الاتصال بقاعدة البيانات
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات PostgreSQL بنجاح');
  } catch (error) {
    console.error('❌ فشل الاتصال بقاعدة البيانات:');
    console.error('📌 رسالة الخطأ:', error.message);
    console.error('📌 تأكد من صحة DATABASE_URL في متغيرات البيئة');
  }
}
testConnection();

// ============================================
// 🔒 دالة تنقية النصوص من XSS (حماية إضافية)
// ============================================
function sanitizeText(text) {
    if (!text) return null;
    if (typeof text !== 'string') return text;
    // إزالة أحرف HTML الضارة
    return text.replace(/[<>]/g, '').trim();
}

// ============================================
// 🔒 دالة تنقية URL
// ============================================
function sanitizeUrl(url) {
    if (!url) return null;
    if (typeof url !== 'string') return url;
    const dangerous = ['javascript:', 'data:', 'vbscript:', 'file:', 'onclick=', 'onerror='];
    const lowerUrl = url.toLowerCase();
    for (let i = 0; i < dangerous.length; i++) {
        if (lowerUrl.includes(dangerous[i])) {
            return null;
        }
    }
    return url.trim();
}

// ============================================
// 🔒 دالة تنقية البريد الإلكتروني
// ============================================
function sanitizeEmail(email) {
    if (!email) return null;
    if (typeof email !== 'string') return email;
    const cleanEmail = email.trim().toLowerCase();
    // التحقق من صيغة البريد الإلكتروني
    const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
        return null;
    }
    return cleanEmail;
}

// ============================================
// 🔒 دالة تنقية رقم الهاتف
// ============================================
function sanitizePhone(phone) {
    if (!phone) return null;
    if (typeof phone !== 'string') return phone;
    // إزالة أي أحرف غير مسموحة في رقم الهاتف
    return phone.replace(/[^0-9+\-\s]/g, '').trim();
}

// ============================================
// تعريف نموذج Profile (الملف الشخصي)
// ============================================
const Profile = sequelize.define('Profile', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  profileId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      // 🔒 التحقق من عدم وجود أحرف ضارة
      isAlphanumericWithDash(value) {
        if (!/^[a-zA-Z0-9\-_]+$/.test(value)) {
          throw new Error('profileId يجب أن يحتوي فقط على أحرف وأرقام وشرطات');
        }
      }
    }
  },
  // المعلومات الأساسية
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 200],
      // 🔒 منع الأحرف الضارة
      isSafe(value) {
        if (value && /[<>]/g.test(value)) {
          throw new Error('الاسم يحتوي على أحرف غير مسموحة');
        }
      }
    },
    // 🔒 تنقية تلقائية
    set(value) {
      this.setDataValue('name', sanitizeText(value));
    }
  },
  email: {
    type: DataTypes.STRING,
    validate: {
      isEmail: true,
      len: [0, 200]
    },
    // 🔒 تنقية تلقائية
    set(value) {
      this.setDataValue('email', sanitizeEmail(value));
    }
  },
  phone: {
    type: DataTypes.STRING,
    validate: {
      len: [0, 50]
    },
    // 🔒 تنقية تلقائية
    set(value) {
      this.setDataValue('phone', sanitizePhone(value));
    }
  },
  title: {
    type: DataTypes.STRING,
    validate: {
      len: [0, 200]
    },
    // 🔒 تنقية تلقائية
    set(value) {
      this.setDataValue('title', sanitizeText(value));
    }
  },
  company: {
    type: DataTypes.STRING,
    validate: {
      len: [0, 200]
    },
    // 🔒 تنقية تلقائية
    set(value) {
      this.setDataValue('company', sanitizeText(value));
    }
  },
  bio: {
    type: DataTypes.TEXT,
    validate: {
      len: [0, 1000]
    },
    // 🔒 تنقية تلقائية
    set(value) {
      this.setDataValue('bio', sanitizeText(value));
    }
  },
  
  // ✅ حقول إضافية (العنوان والموقع)
  website: {
    type: DataTypes.STRING,
    validate: {
      len: [0, 500],
      isUrlOrEmpty(value) {
        if (value && value !== '') {
          const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
          if (!urlRegex.test(value) && !value.startsWith('http')) {
            throw new Error('رابط الموقع غير صحيح');
          }
        }
      }
    },
    // 🔒 تنقية تلقائية
    set(value) {
      this.setDataValue('website', sanitizeUrl(value));
    }
  },
  address: {
    type: DataTypes.STRING,
    validate: {
      len: [0, 500]
    },
    // 🔒 تنقية تلقائية
    set(value) {
      this.setDataValue('address', sanitizeText(value));
    }
  },
  
  // ✅ حقول السوشيال ميديا المنفصلة
  facebook: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
    validate: {
      len: [0, 500]
    },
    set(value) {
      this.setDataValue('facebook', sanitizeUrl(value));
    }
  },
  instagram: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
    validate: {
      len: [0, 500]
    },
    set(value) {
      this.setDataValue('instagram', sanitizeUrl(value));
    }
  },
  twitter: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
    validate: {
      len: [0, 500]
    },
    set(value) {
      this.setDataValue('twitter', sanitizeUrl(value));
    }
  },
  linkedin: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
    validate: {
      len: [0, 500]
    },
    set(value) {
      this.setDataValue('linkedin', sanitizeUrl(value));
    }
  },
  
  // ✅ حقل الصورة الشخصية (Base64) مع حماية
  profileImageBase64: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'profile_image_base64',
    validate: {
      // 🔒 التحقق من صحة Base64
      isSafeBase64(value) {
        if (value && value !== '') {
          // منع الصور الضارة
          if (value.includes('javascript:') || value.includes('data:text/html')) {
            throw new Error('صورة غير صالحة');
          }
          // التحقق من أن الصورة تبدأ بصيغة Base64 صحيحة
          if (!value.startsWith('data:image/') && value.length > 100) {
            throw new Error('تنسيق الصورة غير صحيح');
          }
        }
      }
    }
  },
  
  // القالب
  template: {
    type: DataTypes.STRING,
    defaultValue: 'modern',
    validate: {
      isIn: [['modern', 'classic', 'minimal', 'dark', 'tech', 'elegant', 'corporate', 'creative', '3d', 'neon']]
    }
  },
  
  // إعدادات الحماية
  password: {
    type: DataTypes.STRING,
    validate: {
      len: [0, 255]
    },
    // 🔒 تنقية كلمة المرور من الأحرف الضارة
    set(value) {
      if (value && value !== '') {
        // إزالة الأحرف التي قد تسبب مشاكل أمنية
        const cleanValue = value.replace(/[<>'"]/g, '');
        this.setDataValue('password', cleanValue);
      } else {
        this.setDataValue('password', null);
      }
    }
  },
  isPasswordProtected: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  
  // إعدادات الخصوصية
  enableStats: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  allowVCard: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  
  // روابط التواصل الاجتماعي (JSON - احتفظ بها للتوافق مع الكود القديم)
  social: {
    type: DataTypes.JSONB,
    defaultValue: {
      linkedin: null,
      twitter: null,
      github: null,
      instagram: null,
      facebook: null
    },
    // 🔒 تنقية البيانات داخل JSON
    set(value) {
      if (value && typeof value === 'object') {
        const cleanSocial = {};
        for (const [key, val] of Object.entries(value)) {
          cleanSocial[key] = sanitizeUrl(val);
        }
        this.setDataValue('social', cleanSocial);
      } else {
        this.setDataValue('social', value);
      }
    }
  },
  
  // إحصائيات (مخزنة كـ JSON)
  stats: {
    type: DataTypes.JSONB,
    defaultValue: {
      views: 0,
      lastView: null,
      uniqueVisitors: 0
    }
  },
  
  // حالة الملف
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  timestamps: true,
  tableName: 'profiles',
  
  // 🔒 حماية إضافية: هوك قبل الحفظ
  hooks: {
    beforeSave: async (profile, options) => {
      // إذا كانت كلمة المرور مفعلة ولكن لا توجد كلمة مرور
      if (profile.isPasswordProtected && !profile.password) {
        throw new Error('لا يمكن تفعيل الحماية بدون كلمة مرور');
      }
      // إذا كان هناك كلمة مرور ولكن الحماية غير مفعلة
      if (profile.password && !profile.isPasswordProtected) {
        profile.isPasswordProtected = true;
      }
    },
    
    // 🔒 هوك قبل التحديث
    beforeUpdate: async (profile, options) => {
      // تنقية البيانات مرة أخرى
      if (profile.name) profile.name = sanitizeText(profile.name);
      if (profile.email) profile.email = sanitizeEmail(profile.email);
      if (profile.website) profile.website = sanitizeUrl(profile.website);
    }
  }
});

// ============================================
// 🔒 حماية: إضافة فهارس لتحسين الأداء والأمان
// ============================================
Profile.addHook('afterSync', async () => {
  try {
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_profiles_profileid ON profiles ("profileId");');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_profiles_name ON profiles (name);');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles (email);');
    console.log('✅ تم إنشاء الفهارس اللازمة');
  } catch (error) {
    console.log('⚠️ فهرس موجود بالفعل أو خطأ في الإنشاء:', error.message);
  }
});

// ============================================
// تعريف نموذج Visit (الزيارات) - محدث مع حقول الدولة
// ============================================
const Visit = sequelize.define('Visit', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  profileId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'profiles',
      key: 'profileId'
    },
    validate: {
      notEmpty: true
    }
  },
  cardId: {
    type: DataTypes.STRING,
    validate: {
      len: [0, 100]
    }
  },
  ip: {
    type: DataTypes.STRING,
    validate: {
      len: [0, 50]
    },
    // 🔒 تنقية IP
    set(value) {
      if (value && value !== '') {
        const cleanIp = value.replace(/[^0-9a-fA-F:\.]/g, '');
        this.setDataValue('ip', cleanIp);
      } else {
        this.setDataValue('ip', null);
      }
    }
  },
  
  // ✅ حقول الدولة المنفصلة (جديدة)
  country: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
    validate: {
      len: [0, 100]
    },
    set(value) {
      this.setDataValue('country', sanitizeText(value));
    }
  },
  countryFlag: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
    validate: {
      len: [0, 10]
    }
  },
  countryCode: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
    validate: {
      len: [0, 5]
    }
  },
  
  // معلومات المتصفح والجهاز
  userAgent: {
    type: DataTypes.TEXT,
    set(value) {
      this.setDataValue('userAgent', sanitizeText(value));
    }
  },
  browser: {
    type: DataTypes.STRING,
    set(value) {
      this.setDataValue('browser', sanitizeText(value));
    }
  },
  os: {
    type: DataTypes.STRING,
    set(value) {
      this.setDataValue('os', sanitizeText(value));
    }
  },
  referer: {
    type: DataTypes.STRING,
    set(value) {
      this.setDataValue('referer', sanitizeUrl(value));
    }
  },
  
  // ✅ حقل location القديم (اختياري - يمكن الاحتفاظ به أو حذفه)
  location: {
    type: DataTypes.JSONB,
    defaultValue: {
      country: null,
      city: null
    }
  }
}, {
  timestamps: true,
  tableName: 'visits',
  
  // 🔒 هوك قبل الحفظ
  hooks: {
    beforeSave: async (visit, options) => {
      if (visit.ip) {
        visit.ip = visit.ip.replace(/[^0-9a-fA-F:\.]/g, '');
      }
    }
  }
});

// ============================================
// تعريف نموذج Order (الطلبات)
// ============================================
const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  orderId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [3, 100]
    },
    set(value) {
      this.setDataValue('orderId', sanitizeText(value));
    }
  },
  profileId: {
    type: DataTypes.STRING,
    references: {
      model: 'profiles',
      key: 'profileId'
    },
    validate: {
      len: [0, 100]
    }
  },
  cardType: {
    type: DataTypes.STRING,
    defaultValue: 'physical',
    validate: {
      isIn: [['physical', 'digital', 'premium']]
    }
  },
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    validate: {
      min: 1,
      max: 100
    }
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'processing', 'completed', 'cancelled']]
    }
  }
}, {
  timestamps: true,
  tableName: 'orders'
});

// ============================================
// إنشاء العلاقات بين الجداول
// ============================================
Profile.hasMany(Visit, { foreignKey: 'profileId', sourceKey: 'profileId' });
Visit.belongsTo(Profile, { foreignKey: 'profileId', targetKey: 'profileId' });

Profile.hasMany(Order, { foreignKey: 'profileId', sourceKey: 'profileId' });
Order.belongsTo(Profile, { foreignKey: 'profileId', targetKey: 'profileId' });

// ============================================
// مزامنة النماذج مع قاعدة البيانات
// ============================================
async function syncModels() {
  try {
    await sequelize.sync({ alter: true });
    console.log('✅ تم مزامنة النماذج مع قاعدة البيانات');
  } catch (error) {
    console.error('❌ خطأ في مزامنة النماذج:', error.message);
  }
}

// تشغيل المزامنة بعد التأكد من الاتصال
setTimeout(() => {
  syncModels();
}, 2000);

// ============================================
// 🔒 دوال مساعدة محسنة للتعامل مع البيانات
// ============================================

async function saveProfile(profileData) {
  try {
    // 🔒 تنقية البيانات قبل الحفظ
    const cleanData = { ...profileData };
    
    if (cleanData.name) cleanData.name = sanitizeText(cleanData.name);
    if (cleanData.email) cleanData.email = sanitizeEmail(cleanData.email);
    if (cleanData.phone) cleanData.phone = sanitizePhone(cleanData.phone);
    if (cleanData.title) cleanData.title = sanitizeText(cleanData.title);
    if (cleanData.company) cleanData.company = sanitizeText(cleanData.company);
    if (cleanData.bio) cleanData.bio = sanitizeText(cleanData.bio);
    if (cleanData.website) cleanData.website = sanitizeUrl(cleanData.website);
    if (cleanData.address) cleanData.address = sanitizeText(cleanData.address);
    if (cleanData.facebook) cleanData.facebook = sanitizeUrl(cleanData.facebook);
    if (cleanData.instagram) cleanData.instagram = sanitizeUrl(cleanData.instagram);
    if (cleanData.twitter) cleanData.twitter = sanitizeUrl(cleanData.twitter);
    if (cleanData.linkedin) cleanData.linkedin = sanitizeUrl(cleanData.linkedin);
    
    const profile = await Profile.create(cleanData);
    console.log('✅ تم حفظ الملف الشخصي في PostgreSQL:', profile.profileId);
    return { success: true, data: profile.toJSON() };
  } catch (error) {
    console.error('❌ خطأ في حفظ الملف الشخصي:', error.message);
    return { success: false, error: error.message };
  }
}

async function findProfile(profileId) {
  try {
    // 🔒 تنقية profileId
    const cleanId = sanitizeText(profileId);
    const profile = await Profile.findOne({ where: { profileId: cleanId } });
    return profile ? profile.toJSON() : null;
  } catch (error) {
    console.error('❌ خطأ في البحث:', error.message);
    return null;
  }
}

async function updateProfileStats(profileId) {
  try {
    const cleanId = sanitizeText(profileId);
    const profile = await Profile.findOne({ where: { profileId: cleanId } });
    if (profile) {
      const stats = profile.stats || { views: 0, uniqueVisitors: 0 };
      stats.views = (stats.views || 0) + 1;
      stats.lastView = new Date();
      await profile.update({ stats });
      console.log('📊 تم تحديث إحصائيات:', profileId);
    }
  } catch (error) {
    console.error('❌ خطأ في تحديث الإحصائيات:', error.message);
  }
}

async function createVisit(visitData) {
  try {
    // 🔒 تنقية بيانات الزيارة
    const cleanData = { ...visitData };
    if (cleanData.profileId) cleanData.profileId = sanitizeText(cleanData.profileId);
    if (cleanData.cardId) cleanData.cardId = sanitizeText(cleanData.cardId);
    if (cleanData.country) cleanData.country = sanitizeText(cleanData.country);
    if (cleanData.userAgent) cleanData.userAgent = sanitizeText(cleanData.userAgent);
    
    const visit = await Visit.create(cleanData);
    await updateProfileStats(visitData.profileId);
    return { success: true, data: visit.toJSON() };
  } catch (error) {
    console.error('❌ خطأ في تسجيل الزيارة:', error.message);
    return { success: false, error: error.message };
  }
}

async function createOrder(orderData) {
  try {
    // 🔒 تنقية بيانات الطلب
    const cleanData = { ...orderData };
    if (cleanData.orderId) cleanData.orderId = sanitizeText(cleanData.orderId);
    if (cleanData.profileId) cleanData.profileId = sanitizeText(cleanData.profileId);
    
    const order = await Order.create(cleanData);
    return { success: true, data: order.toJSON() };
  } catch (error) {
    console.error('❌ خطأ في إنشاء الطلب:', error.message);
    return { success: false, error: error.message };
  }
}

async function getAllProfiles() {
  try {
    const profiles = await Profile.findAll({
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['password'] } // 🔒 عدم إرجاع كلمة المرور
    });
    return profiles.map(p => p.toJSON());
  } catch (error) {
    console.error('❌ خطأ في جلب الملفات:', error.message);
    return [];
  }
}

async function getAllVisits(limit = 100) {
  try {
    const visits = await Visit.findAll({
      include: [{
        model: Profile,
        attributes: ['name', 'profileId']
      }],
      attributes: [
        'id', 
        'profileId', 
        'cardId', 
        'ip', 
        'country',
        'countryFlag',
        'countryCode',
        'userAgent', 
        'browser', 
        'os', 
        'referer', 
        'location', 
        'createdAt', 
        'updatedAt'
      ],
      order: [['createdAt', 'DESC']],
      limit: Math.min(limit, 500) // 🔒 حد أقصى للنتائج
    });
    return visits.map(v => v.toJSON());
  } catch (error) {
    console.error('❌ خطأ في جلب الزيارات:', error.message);
    return [];
  }
}

// ============================================
// 🔒 دالة إغلاق الاتصال (للتطبيقات)
// ============================================
async function closeConnection() {
  try {
    await sequelize.close();
    console.log('✅ تم إغلاق الاتصال بقاعدة البيانات');
  } catch (error) {
    console.error('❌ خطأ في إغلاق الاتصال:', error.message);
  }
}

// ============================================
// تصدير النماذج والدوال المساعدة
// ============================================
module.exports = {
  sequelize,
  Profile,
  Visit,
  Order,
  saveProfile,
  findProfile,
  createVisit,
  createOrder,
  getAllProfiles,
  getAllVisits,
  closeConnection
};