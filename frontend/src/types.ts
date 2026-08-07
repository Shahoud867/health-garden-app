export type Screen =
  | 'landing' | 'pricing'
  | 'login' | 'signup' | 'forgot-password' | 'email-verify'
  | 'onboarding'
  | 'home' | 'food' | 'workout' | 'water' | 'weight'
  | 'garden' | 'garden-history'
  | 'ai-coach' | 'ai-plan'
  | 'premium' | 'profile'
  | 'privacy' | 'terms' | 'about'

export type Lang = 'en' | 'ur'
export type SyncStatus = 'synced' | 'pending' | 'offline'

export interface NavProps {
  navigate: (s: Screen) => void
  currentScreen: Screen
  lang: Lang
  setLang: (l: Lang) => void
  isPremium: boolean
  syncStatus: SyncStatus
}

export interface FoodEntry {
  id: string
  name: string
  nameUr: string
  slot: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  unit: string
  qty: number
  calories: number
  protein: number
}

export interface WorkoutEntry {
  id: string
  name: string
  nameUr: string
  category: string
  duration: number
  caloriesBurned: number
}

export interface PlantState {
  type: 'cactus' | 'sunflower' | 'bellflower' | 'bamboo' | 'succulent'
  goal: string
  goalUr: string
  /**
   * Qualifying days completed in this plant's current growth cycle.
   *
   * Growth is per-qualifying-day, not weekly: each day the habit is met the
   * plant advances one stage, and on the third it is planted into the
   * permanent garden and a fresh cycle starts. Mirrors garden_state's
   * `current_stage` (0-2 in practice -- 3 is the graduation event and is
   * never stored).
   */
  cycleDays: 0 | 1 | 2
  metToday: boolean
}

/** Qualifying days needed to fully grow one plant (garden mechanic v2). */
export const CYCLE_LENGTH = 3

export interface AppState {
  lang: Lang
  isPremium: boolean
  syncStatus: SyncStatus
  onboardingComplete: boolean
  isLoggedIn: boolean
  user: {
    name: string
    age: number
    sex: string
    heightCm: number
    weightKg: number
    activityLevel: string
    goal: string
    conditions: string[]
    calorieTarget: number
    proteinTarget: number
  }
  today: {
    caloriesLogged: number
    waterGlasses: number
    workoutMinutes: number
    foodEntries: FoodEntry[]
    workoutEntries: WorkoutEntry[]
    weightLog: number | null
  }
  garden: PlantState[]
  weightHistory: { date: string; weight: number }[]
  aiChat: {
    messages: { role: 'user' | 'ai'; text: string; time: string }[]
    usedToday: number
    dailyCap: number
    enabled: boolean
  }
  aiPlan: {
    plan: string | null
    regenUsed: number
    regenCap: number
  }
}

const S = {
  en: {
    home: 'Home', garden: 'Garden', food: 'Food', water: 'Water',
    workout: 'Workout', profile: 'Profile', coach: 'Coach', plan: 'Weekly Plan',
    today: 'Today', back: 'Back', save: 'Save', cancel: 'Cancel',
    continue: 'Continue', submit: 'Submit', logIn: 'Log In',
    signUp: 'Sign Up', logOut: 'Log Out', loading: 'Loading…',
    synced: 'All synced', syncPending: 'Saved locally — will sync when online',
    offline: 'Offline — changes saved on this device',
    resting: 'Resting today', growing: 'Growing',
    breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack',
    english: 'English', urdu: 'اردو',
    premium: 'Premium', upgrade: 'Upgrade to Premium',
    calories: 'Calories', waterLabel: 'Water', workoutMin: 'Active min',
    glasses: 'glasses', minutes: 'min', of: 'of', days: 'days',
    log: 'Log', add: 'Add', edit: 'Edit', remove: 'Remove',
    search: 'Search foods…', noResults: 'No results — try a different name',
    usuals: 'Your Usuals', logMeal: 'Log a Meal', logWater: 'Log Water',
    logWorkout: 'Log a Workout', logWeight: 'Log Weight',
    password: 'Password', email: 'Email', name: 'Full Name',
    forgotPassword: 'Forgot password?', orContinue: 'or continue with',
    google: 'Continue with Google',
    greeting: 'Good morning', greetingEvening: 'Good evening',
    daysThisWeek: 'days this cycle', moreToGrow: 'more to grow',
    restingLabel: 'Resting today', fullyGrown: 'Fully grown this week',
    shareGarden: 'Share garden', viewHistory: 'View garden history',
    mint: 'Hydration', cactus: 'Sugar-free', bamboo: 'Protein',
    sunflower: 'Movement', succulent: 'Consistency',
    premiumTeaser: 'AI coaching is a Premium feature',
    premiumDesc: 'Upgrade to unlock AI chat and weekly plan generation.',
    aiDisabled: 'AI coach is temporarily unavailable',
    aiCapped: 'You\'ve reached today\'s message limit — see you tomorrow',
    disclaimer: 'The AI coach does not replace professional medical advice. Always consult a qualified doctor.',
    syncNow: 'Sync now', retry: 'Retry', tryAgain: 'Try again',
    empty: 'Nothing logged yet', emptyGarden: 'Start logging to grow your garden',
    deleteAccount: 'Delete Account', exportData: 'Export My Data',
    notifPref: 'Notification Preferences', billing: 'Billing & Subscription',
    privacy: 'Privacy Policy', terms: 'Terms of Service', about: 'About',
    installApp: 'Install App', addToHomeScreen: 'Add to Home Screen',
    payPending: 'Pending review', approved: 'Active', rejected: 'Payment not verified',
    jazzcash: 'JazzCash', easypaisa: 'Easypaisa',
    paymentNote: 'Send the exact amount to the number shown, then enter your transaction reference below.',
    txRef: 'Transaction Reference',
    verifyHuman: 'Quick verification — what is',
    subscriptionStatus: 'Subscription Status',
    freeFeatures: 'Free features', premiumFeatures: 'Premium features',
    perMonth: '/month', pkr: 'PKR',
    conditionDiabetes: 'Diabetes', conditionPCOS: 'PCOS',
    conditionJoint: 'Knee / Joint pain', conditionNone: 'None of these',
    actSedentary: 'Mostly seated', actLight: 'Light movement most days',
    actModerate: 'Moderately active', actVery: 'Very active',
    goalLose: 'Lose weight', goalMaintain: 'Stay at current weight',
    goalStrength: 'Build strength', goalGeneral: 'General health', goalGain: 'Gain weight',
    computedTitle: 'Your daily targets',
    computedSub: 'These are calculated from your profile. You can update them anytime in settings.',
    medDisclaimer: 'Health Garden is not a medical app and does not provide diagnoses or treatment advice. Always consult a qualified healthcare provider for medical decisions.',
    medAccept: 'I understand — continue',
    resetSent: 'Check your email — we\'ve sent a reset link.',
    verifyEmail: 'Check your email',
    verifyEmailSub: 'We sent a verification link to your email. Click it to activate your account.',
    heroTitle: 'A garden that grows with you',
    heroSub: 'Track food, water, and movement — watch your garden bloom. Calm, honest, no guilt.',
    howItWorks: 'How it works',
    step1: 'Log your meals', step1sub: 'Quick search with local units — katori, cup, piece.',
    step2: 'Move and hydrate', step2sub: 'A tap to log water or a workout.',
    step3: 'Watch your garden grow', step3sub: 'Five plants, each tied to a weekly habit. They only ever grow.',
    freePlan: 'Free', premiumPlan: 'Premium',
    signUpCta: 'Start growing — it\'s free',
    pricingCta: 'See all features',
    legalNote: '© 2025 Health Garden. For personal wellness tracking only.',
  },
  ur: {
    home: 'گھر', garden: 'باغیچہ', food: 'کھانا', water: 'پانی',
    workout: 'ورزش', profile: 'پروفائل', coach: 'کوچ', plan: 'ہفتہ وار منصوبہ',
    today: 'آج', back: 'واپس', save: 'محفوظ', cancel: 'منسوخ',
    continue: 'جاری رکھیں', submit: 'جمع کریں', logIn: 'لاگ ان',
    signUp: 'سائن اپ', logOut: 'لاگ آؤٹ', loading: 'لوڈ ہو رہا ہے…',
    synced: 'سب محفوظ', syncPending: 'آلے پر محفوظ — آن لائن ہونے پر ہم آہنگ ہوگا',
    offline: 'آف لائن — تبدیلیاں محفوظ',
    resting: 'آج آرام', growing: 'بڑھ رہا ہے',
    breakfast: 'ناشتہ', lunch: 'دوپہر کا کھانا', dinner: 'رات کا کھانا', snack: 'نمکین',
    english: 'English', urdu: 'اردو',
    premium: 'پریمیم', upgrade: 'پریمیم پر اپ گریڈ کریں',
    calories: 'کیلوریز', waterLabel: 'پانی', workoutMin: 'ورزش منٹ',
    glasses: 'گلاس', minutes: 'منٹ', of: 'میں سے', days: 'دن',
    log: 'درج کریں', add: 'شامل', edit: 'ترمیم', remove: 'حذف',
    search: 'کھانا تلاش کریں…', noResults: 'کوئی نتیجہ نہیں',
    usuals: 'آپ کے معمول', logMeal: 'کھانا درج کریں', logWater: 'پانی درج کریں',
    logWorkout: 'ورزش درج کریں', logWeight: 'وزن درج کریں',
    password: 'پاس ورڈ', email: 'ای میل', name: 'پورا نام',
    forgotPassword: 'پاس ورڈ بھول گئے؟', orContinue: 'یا جاری رکھیں',
    google: 'گوگل سے جاری رکھیں',
    greeting: 'سلام', greetingEvening: 'شام بخیر',
    daysThisWeek: 'دن اس چکر میں', moreToGrow: 'مزید بڑھنے کے لیے',
    restingLabel: 'آج آرام', fullyGrown: 'اس ہفتے پوری طرح اگا',
    shareGarden: 'باغیچہ شیئر کریں', viewHistory: 'تاریخ دیکھیں',
    mint: 'پانی', cactus: 'شکر سے پاک', bamboo: 'پروٹین',
    sunflower: 'ورزش', succulent: 'مستقل مزاجی',
    premiumTeaser: 'اے آئی کوچنگ پریمیم فیچر ہے',
    premiumDesc: 'اے آئی چیٹ اور ہفتہ وار منصوبہ استعمال کرنے کے لیے اپ گریڈ کریں',
    aiDisabled: 'اے آئی کوچ فی الحال دستیاب نہیں',
    aiCapped: 'آج کی حد پوری ہو گئی — کل ملیں گے',
    disclaimer: 'اے آئی کوچ پیشہ ور طبی مشورے کی جگہ نہیں۔ ہمیشہ ڈاکٹر سے مشورہ کریں۔',
    syncNow: 'ابھی ہم آہنگ', retry: 'دوبارہ کوشش', tryAgain: 'پھر کوشش کریں',
    empty: 'ابھی کچھ درج نہیں', emptyGarden: 'لاگ کریں اور باغیچہ اگائیں',
    deleteAccount: 'اکاؤنٹ حذف کریں', exportData: 'ڈیٹا برآمد کریں',
    notifPref: 'اطلاع کی ترجیحات', billing: 'بلنگ اور سبسکرپشن',
    privacy: 'رازداری کی پالیسی', terms: 'شرائط و ضوابط', about: 'ہمارے بارے میں',
    installApp: 'ایپ انسٹال کریں', addToHomeScreen: 'ہوم اسکرین پر شامل',
    payPending: 'جائزہ زیر التوا', approved: 'فعال', rejected: 'تصدیق نہیں ہوئی',
    jazzcash: 'جیز کیش', easypaisa: 'آسان پیسہ',
    paymentNote: 'درج ذیل نمبر پر مقررہ رقم بھیجیں، پھر ٹرانزیکشن ریفرنس درج کریں۔',
    txRef: 'ٹرانزیکشن ریفرنس',
    verifyHuman: 'مختصر تصدیق —',
    subscriptionStatus: 'سبسکرپشن کی صورتحال',
    freeFeatures: 'مفت فیچرز', premiumFeatures: 'پریمیم فیچرز',
    perMonth: '/ماہ', pkr: 'روپے',
    conditionDiabetes: 'ذیابیطس', conditionPCOS: 'پی سی او ایس',
    conditionJoint: 'گھٹنے / جوڑوں کا درد', conditionNone: 'ان میں سے کوئی نہیں',
    actSedentary: 'زیادہ بیٹھنا', actLight: 'ہلکی سرگرمی',
    actModerate: 'معتدل سرگرمی', actVery: 'بہت زیادہ سرگرمی',
    goalLose: 'وزن کم کریں', goalMaintain: 'وزن برقرار رکھیں',
    goalStrength: 'طاقت بڑھائیں', goalGeneral: 'عام صحت', goalGain: 'وزن بڑھائیں',
    computedTitle: 'آپ کے روزانہ اہداف',
    computedSub: 'یہ آپ کی پروفائل سے حساب کیے گئے ہیں۔ آپ انہیں سیٹنگز میں تبدیل کر سکتے ہیں۔',
    medDisclaimer: 'ہیلتھ گارڈن ایک طبی ایپ نہیں ہے اور نہ ہی یہ تشخیص یا علاج کا مشورہ دیتی ہے۔ طبی فیصلوں کے لیے ہمیشہ ڈاکٹر سے مشورہ کریں۔',
    medAccept: 'میں سمجھ گیا — جاری رکھیں',
    resetSent: 'ای میل چیک کریں — ہم نے ری سیٹ لنک بھیجا ہے۔',
    verifyEmail: 'ای میل تصدیق کریں',
    verifyEmailSub: 'ہم نے آپ کی ای میل پر تصدیقی لنک بھیجا ہے۔ اسے کلک کریں۔',
    heroTitle: 'ایک باغیچہ جو آپ کے ساتھ بڑھتا ہے',
    heroSub: 'کھانا، پانی اور ورزش ٹریک کریں — اپنا باغیچہ کھلتا دیکھیں۔',
    howItWorks: 'یہ کیسے کام کرتا ہے',
    step1: 'کھانا درج کریں', step1sub: 'مقامی اکائیوں کے ساتھ — کٹورا، کپ، ٹکڑا۔',
    step2: 'حرکت اور پانی', step2sub: 'ایک ٹپ سے پانی یا ورزش درج کریں۔',
    step3: 'باغیچہ دیکھیں بڑھتے ہوئے', step3sub: 'پانچ پودے، ہر ایک ہفتہ وار عادت سے جڑا۔',
    freePlan: 'مفت', premiumPlan: 'پریمیم',
    signUpCta: 'شروع کریں — مفت ہے',
    pricingCta: 'تمام فیچر دیکھیں',
    legalNote: '© 2025 ہیلتھ گارڈن۔ صرف ذاتی صحت ٹریکنگ کے لیے۔',
  }
}

export function t(key: keyof typeof S.en, lang: Lang): string {
  return (S[lang] as Record<string, string>)[key] ?? S.en[key] ?? key
}
