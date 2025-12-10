"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type Translations = Record<string, string>;
type Locale = string;

// RTL Languages list
const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur', 'ps', 'ku', 'dv'];

interface I18nContextType {
  language: Locale;
  setLanguage: (lng: Locale) => void;
  t: (key: string, fallback?: string) => string;
  supportedLocales: { code: string; name: string; nativeName: string; rtl: boolean }[];
  isRTL: boolean;
  direction: 'ltr' | 'rtl';
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const useI18n = (): I18nContextType => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
};

// Supported locales with native names and RTL flag
const SUPPORTED: { code: string; name: string; nativeName: string; rtl: boolean }[] = [
  { code: "en", name: "English", nativeName: "English", rtl: false },
  { code: "ar", name: "Arabic", nativeName: "العربية", rtl: true },
  { code: "es", name: "Spanish", nativeName: "Español", rtl: false },
  { code: "fr", name: "French", nativeName: "Français", rtl: false },
  { code: "de", name: "German", nativeName: "Deutsch", rtl: false },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", rtl: false },
  { code: "it", name: "Italian", nativeName: "Italiano", rtl: false },
  { code: "ru", name: "Russian", nativeName: "Русский", rtl: false },
  { code: "zh", name: "Chinese", nativeName: "中文", rtl: false },
  { code: "ja", name: "Japanese", nativeName: "日本語", rtl: false },
  { code: "ko", name: "Korean", nativeName: "한국어", rtl: false },
  { code: "pt", name: "Portuguese", nativeName: "Português", rtl: false },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", rtl: false },
  { code: "ur", name: "Urdu", nativeName: "اردو", rtl: true },
  { code: "fa", name: "Persian", nativeName: "فارسی", rtl: true },
  { code: "he", name: "Hebrew", nativeName: "עברית", rtl: true },
  { code: "nl", name: "Dutch", nativeName: "Nederlands", rtl: false },
  { code: "pl", name: "Polish", nativeName: "Polski", rtl: false },
  { code: "uk", name: "Ukrainian", nativeName: "Українська", rtl: false },
  { code: "el", name: "Greek", nativeName: "Ελληνικά", rtl: false },
];

// Complete English translations
const EN_TRANSLATIONS: Translations = {
  // Navigation
  "nav.home": "Home",
  "nav.messages": "Messages",
  "nav.desnaps": "DeSnaps",
  "nav.premium": "Premium",
  "nav.create": "Create",
  "nav.notifications": "Notifications",
  "nav.settings": "Settings",
  "nav.profile": "Profile",
  "nav.logout": "Logout",
  "nav.search": "Search...",
  "nav.pages": "Pages",
  "nav.navigateTo": "Navigate to",
  
  // Actions
  "action.like": "Like",
  "action.comment": "Comment",
  "action.share": "Share",
  "action.save": "Save",
  "action.cancel": "Cancel",
  "action.submit": "Submit",
  "action.close": "Close",
  "action.edit": "Edit",
  "action.delete": "Delete",
  "action.follow": "Follow",
  "action.unfollow": "Unfollow",
  "action.showMore": "Show more",
  "action.showLess": "Show less",
  "action.send": "Send",
  "action.post": "Post",
  "action.upload": "Upload",
  "action.refresh": "Refresh",
  "action.retry": "Retry",
  "action.back": "Back",
  "action.next": "Next",
  "action.done": "Done",
  "action.confirm": "Confirm",
  "action.viewProfile": "View Profile",
  "action.saved": "Saved",
  
  // Content
  "content.posts": "Posts",
  "content.followers": "Followers",
  "content.following": "Following",
  "content.addStory": "Add Story",
  "content.noPostsYet": "No posts yet",
  "content.noStoriesYet": "No stories yet",
  "content.loading": "Loading...",
  "content.error": "Error",
  "content.noResults": "No results found",
  "content.searchResults": "Search Results",
  "content.communityMember": "Community Member",
  "content.justNow": "Just now",
  
  // Forms
  "form.email": "Email",
  "form.password": "Password",
  "form.username": "Username",
  "form.name": "Name",
  "form.fullName": "Full Name",
  "form.phone": "Phone Number",
  "form.bio": "Bio",
  "form.message": "Message",
  "form.location": "Location",
  "form.website": "Website",
  "form.confirmPassword": "Confirm Password",
  
  // Profile
  "profile.editProfile": "Edit Profile",
  "profile.posts": "Posts",
  "profile.followers": "Followers",
  "profile.following": "Following",
  "profile.myProfile": "My Profile",
  "profile.viewAll": "View All",
  "profile.likes": "Likes",
  "profile.changePhoto": "Change Photo",
  
  // Chat
  "chat.typeMessage": "Type a message...",
  "chat.send": "Send",
  "chat.online": "Online",
  "chat.offline": "Offline",
  "chat.typing": "Typing...",
  "chat.newMessage": "New Message",
  "chat.noMessages": "No messages yet",
  "chat.startConversation": "Start a conversation!",
  "chat.mute": "Mute",
  "chat.unmute": "Unmute",
  "chat.muteSounds": "Mute sounds",
  "chat.enableSounds": "Enable sounds",
  "chat.blockUser": "Block User",
  "chat.deleteChat": "Delete Chat",
  "chat.notFound": "Chat not found",
  "chat.backToMessages": "Back to Messages",
  "chat.showStickers": "Show stickers",
  
  // Settings
  "settings.title": "Settings",
  "settings.language": "Language",
  "settings.account": "Account",
  "settings.security": "Security",
  "settings.notifications": "Notifications",
  "settings.privacy": "Privacy",
  "settings.appearance": "Appearance",
  "settings.support": "Support",
  "settings.theme": "Theme",
  "settings.darkMode": "Dark Mode",
  "settings.lightMode": "Light Mode",
  
  // Auth
  "auth.welcomeBack": "Welcome Back",
  "auth.login": "Login",
  "auth.signUp": "Sign Up",
  "auth.email": "Email Address",
  "auth.phone": "Phone Number",
  "auth.password": "Password",
  "auth.noAccount": "Don't have an account?",
  "auth.haveAccount": "Already have an account?",
  "auth.signingIn": "Signing In...",
  "auth.creatingAccount": "Creating Account...",
  "auth.name": "Full Name",
  "auth.username": "Username",
  "auth.confirmPassword": "Confirm Password",
  "auth.rememberMe": "Remember me",
  "auth.forgotPassword": "Forgot password?",
  "auth.loginFailed": "Login failed",
  "auth.invalidCredentials": "Invalid credentials",
  "auth.signUpTitle": "Create Account",
  "auth.welcomeTitle": "Join DeMedia",
  "auth.alreadyHaveAccount": "Already have an account?",
  "auth.dontHaveAccount": "Don't have an account?",
  "auth.goToLogin": "Go to Login",
  "auth.tryAgain": "Try Again",
  
  // Setup
  "setup.completeProfile": "Complete Your Profile",
  "setup.preferredLanguage": "Preferred Language",
  "setup.phoneNumber": "Phone Number",
  "setup.saveContinue": "Save & Continue",
  "setup.saving": "Saving...",
  
  // Common
  "common.save": "Save",
  "common.continue": "Continue",
  "common.loading": "Loading",
  "common.error": "Error",
  "common.success": "Success",
  "common.warning": "Warning",
  "common.info": "Info",
  
  // Posts
  "posts.loading": "Loading posts...",
  "posts.none": "No posts yet.",
  "posts.error": "Error",
  "posts.unknown": "Unknown",
  "posts.image": "Image",
  "posts.like": "Like",
  "posts.comment": "Comment",
  "posts.share": "Share",
  "posts.createPost": "Create Post",
  "posts.whatsOnYourMind": "What's on your mind?",
  "posts.readyForStory": "Everything is ready for the next big story.",
  "posts.beFirst": "Be the first to share something with the community.",
  
  // Stories
  "stories.add": "Add Story",
  "stories.loading": "Loading stories...",
  "stories.none": "No stories yet.",
  "stories.error": "Error loading stories",
  "stories.yourStory": "Your Story",
  "stories.title": "Stories",
  
  // Home
  "home.welcome": "Welcome to DeMedia",
  "home.feed": "Your Feed",
  "home.trending": "Trending",
  "home.suggestions": "Suggestions",
  
  // Index
  "index.checkingAuth": "Checking authentication...",
  
  // Comments
  "comments.title": "Comments",
  "comments.noComments": "No comments yet. Be the first to comment!",
  "comments.addPlaceholder": "Add a comment...",
  "comments.editPlaceholder": "Edit your comment...",
  "comments.reply": "Reply",
  
  // DeSnaps
  "desnaps.create": "Create DeSnap",
  "desnaps.shareTemporary": "Share temporary videos and moments",
  
  // Content
  "content.chooseCreate": "Choose what you'd like to create",
  
  // Posts
  "posts.shareThoughts": "Share your thoughts, images, and stories",
};


// Complete Arabic translations
const AR_TRANSLATIONS: Translations = {
  // Navigation
  "nav.home": "الرئيسية",
  "nav.messages": "الرسائل",
  "nav.desnaps": "ديسنابس",
  "nav.premium": "بريميوم",
  "nav.create": "إنشاء",
  "nav.notifications": "الإشعارات",
  "nav.settings": "الإعدادات",
  "nav.profile": "الملف الشخصي",
  "nav.logout": "تسجيل الخروج",
  "nav.search": "بحث...",
  "nav.pages": "الصفحات",
  "nav.navigateTo": "انتقل إلى",
  
  // Actions
  "action.like": "إعجاب",
  "action.comment": "تعليق",
  "action.share": "مشاركة",
  "action.save": "حفظ",
  "action.cancel": "إلغاء",
  "action.submit": "إرسال",
  "action.close": "إغلاق",
  "action.edit": "تعديل",
  "action.delete": "حذف",
  "action.follow": "متابعة",
  "action.unfollow": "إلغاء المتابعة",
  "action.showMore": "عرض المزيد",
  "action.showLess": "عرض أقل",
  "action.send": "إرسال",
  "action.post": "نشر",
  "action.upload": "رفع",
  "action.refresh": "تحديث",
  "action.retry": "إعادة المحاولة",
  "action.back": "رجوع",
  "action.next": "التالي",
  "action.done": "تم",
  "action.confirm": "تأكيد",
  "action.viewProfile": "عرض الملف الشخصي",
  "action.saved": "محفوظ",
  
  // Content
  "content.posts": "المنشورات",
  "content.followers": "المتابعون",
  "content.following": "المتابَعون",
  "content.addStory": "إضافة قصة",
  "content.noPostsYet": "لا توجد منشورات بعد",
  "content.noStoriesYet": "لا توجد قصص بعد",
  "content.loading": "جاري التحميل...",
  "content.error": "خطأ",
  "content.noResults": "لا توجد نتائج",
  "content.searchResults": "نتائج البحث",
  "content.communityMember": "عضو في المجتمع",
  "content.justNow": "الآن",
  
  // Forms
  "form.email": "البريد الإلكتروني",
  "form.password": "كلمة المرور",
  "form.username": "اسم المستخدم",
  "form.name": "الاسم",
  "form.fullName": "الاسم الكامل",
  "form.phone": "رقم الهاتف",
  "form.bio": "نبذة",
  "form.message": "رسالة",
  "form.location": "الموقع",
  "form.website": "الموقع الإلكتروني",
  "form.confirmPassword": "تأكيد كلمة المرور",
  
  // Profile
  "profile.editProfile": "تعديل الملف الشخصي",
  "profile.posts": "المنشورات",
  "profile.followers": "المتابعون",
  "profile.following": "المتابَعون",
  "profile.myProfile": "ملفي الشخصي",
  "profile.viewAll": "عرض الكل",
  "profile.likes": "الإعجابات",
  "profile.changePhoto": "تغيير الصورة",
  
  // Chat
  "chat.typeMessage": "اكتب رسالة...",
  "chat.send": "إرسال",
  "chat.online": "متصل",
  "chat.offline": "غير متصل",
  "chat.typing": "يكتب...",
  "chat.newMessage": "رسالة جديدة",
  "chat.noMessages": "لا توجد رسائل بعد",
  "chat.startConversation": "ابدأ محادثة!",
  "chat.mute": "كتم",
  "chat.unmute": "إلغاء الكتم",
  "chat.muteSounds": "كتم الأصوات",
  "chat.enableSounds": "تفعيل الأصوات",
  "chat.blockUser": "حظر المستخدم",
  "chat.deleteChat": "حذف المحادثة",
  "chat.notFound": "المحادثة غير موجودة",
  "chat.backToMessages": "العودة للرسائل",
  "chat.showStickers": "عرض الملصقات",
  
  // Settings
  "settings.title": "الإعدادات",
  "settings.language": "اللغة",
  "settings.account": "الحساب",
  "settings.security": "الأمان",
  "settings.notifications": "الإشعارات",
  "settings.privacy": "الخصوصية",
  "settings.appearance": "المظهر",
  "settings.support": "الدعم",
  "settings.theme": "السمة",
  "settings.darkMode": "الوضع الداكن",
  "settings.lightMode": "الوضع الفاتح",
  
  // Auth
  "auth.welcomeBack": "مرحباً بعودتك",
  "auth.login": "تسجيل الدخول",
  "auth.signUp": "إنشاء حساب",
  "auth.email": "البريد الإلكتروني",
  "auth.phone": "رقم الهاتف",
  "auth.password": "كلمة المرور",
  "auth.noAccount": "ليس لديك حساب؟",
  "auth.haveAccount": "لديك حساب بالفعل؟",
  "auth.signingIn": "جاري تسجيل الدخول...",
  "auth.creatingAccount": "جاري إنشاء الحساب...",
  "auth.name": "الاسم الكامل",
  "auth.username": "اسم المستخدم",
  "auth.confirmPassword": "تأكيد كلمة المرور",
  "auth.rememberMe": "تذكرني",
  "auth.forgotPassword": "نسيت كلمة المرور؟",
  "auth.loginFailed": "فشل تسجيل الدخول",
  "auth.invalidCredentials": "بيانات غير صحيحة",
  "auth.signUpTitle": "إنشاء حساب",
  "auth.welcomeTitle": "انضم إلى DeMedia",
  "auth.alreadyHaveAccount": "لديك حساب بالفعل؟",
  "auth.dontHaveAccount": "ليس لديك حساب؟",
  "auth.goToLogin": "الذهاب لتسجيل الدخول",
  "auth.tryAgain": "حاول مرة أخرى",
  
  // Setup
  "setup.completeProfile": "أكمل ملفك الشخصي",
  "setup.preferredLanguage": "اللغة المفضلة",
  "setup.phoneNumber": "رقم الهاتف",
  "setup.saveContinue": "حفظ ومتابعة",
  "setup.saving": "جاري الحفظ...",
  
  // Common
  "common.save": "حفظ",
  "common.continue": "متابعة",
  "common.loading": "جاري التحميل",
  "common.error": "خطأ",
  "common.success": "نجاح",
  "common.warning": "تحذير",
  "common.info": "معلومات",
  
  // Posts
  "posts.loading": "جاري تحميل المنشورات...",
  "posts.none": "لا توجد منشورات بعد.",
  "posts.error": "خطأ",
  "posts.unknown": "غير معروف",
  "posts.image": "صورة",
  "posts.like": "إعجاب",
  "posts.comment": "تعليق",
  "posts.share": "مشاركة",
  "posts.createPost": "إنشاء منشور",
  "posts.whatsOnYourMind": "بماذا تفكر؟",
  "posts.readyForStory": "كل شيء جاهز للقصة الكبيرة القادمة.",
  "posts.beFirst": "كن أول من يشارك شيئاً مع المجتمع.",
  
  // Stories
  "stories.add": "إضافة قصة",
  "stories.loading": "جاري تحميل القصص...",
  "stories.none": "لا توجد قصص بعد.",
  "stories.error": "خطأ في تحميل القصص",
  "stories.yourStory": "قصتك",
  "stories.title": "القصص",
  
  // Home
  "home.welcome": "مرحباً بك في DeMedia",
  "home.feed": "المحتوى الخاص بك",
  "home.trending": "الرائج",
  "home.suggestions": "الاقتراحات",
  
  // Index
  "index.checkingAuth": "جاري التحقق من المصادقة...",
  
  // Navbar specific
  "navbar.notifications": "الإشعارات",
  "navbar.messages": "الرسائل",
  "navbar.profile": "الملف الشخصي",
  "navbar.logout": "تسجيل الخروج",
  
  // Comments
  "comments.title": "التعليقات",
  "comments.noComments": "لا توجد تعليقات بعد. كن أول من يعلق!",
  "comments.addPlaceholder": "أضف تعليقاً...",
  "comments.editPlaceholder": "عدل تعليقك...",
  "comments.reply": "رد",
  
  // DeSnaps
  "desnaps.create": "إنشاء ديسناب",
  "desnaps.shareTemporary": "شارك مقاطع فيديو ولحظات مؤقتة",
  
  // Content
  "content.chooseCreate": "اختر ما تريد إنشاءه",
  
  // Posts
  "posts.shareThoughts": "شارك أفكارك وصورك وقصصك",
};


// Complete Spanish translations
const ES_TRANSLATIONS: Translations = {
  // Navigation
  "nav.home": "Inicio",
  "nav.messages": "Mensajes",
  "nav.desnaps": "DeSnaps",
  "nav.premium": "Premium",
  "nav.create": "Crear",
  "nav.notifications": "Notificaciones",
  "nav.settings": "Configuración",
  "nav.profile": "Perfil",
  "nav.logout": "Cerrar sesión",
  "nav.search": "Buscar...",
  "nav.pages": "Páginas",
  "nav.navigateTo": "Ir a",
  
  // Actions
  "action.like": "Me gusta",
  "action.comment": "Comentar",
  "action.share": "Compartir",
  "action.save": "Guardar",
  "action.cancel": "Cancelar",
  "action.submit": "Enviar",
  "action.close": "Cerrar",
  "action.edit": "Editar",
  "action.delete": "Eliminar",
  "action.follow": "Seguir",
  "action.unfollow": "Dejar de seguir",
  "action.showMore": "Ver más",
  "action.showLess": "Ver menos",
  "action.send": "Enviar",
  "action.post": "Publicar",
  "action.upload": "Subir",
  "action.refresh": "Actualizar",
  "action.retry": "Reintentar",
  "action.back": "Atrás",
  "action.next": "Siguiente",
  "action.done": "Hecho",
  "action.confirm": "Confirmar",
  "action.viewProfile": "Ver perfil",
  "action.saved": "Guardado",
  
  // Content
  "content.posts": "Publicaciones",
  "content.followers": "Seguidores",
  "content.following": "Siguiendo",
  "content.addStory": "Agregar historia",
  "content.noPostsYet": "Aún no hay publicaciones",
  "content.noStoriesYet": "Aún no hay historias",
  "content.loading": "Cargando...",
  "content.error": "Error",
  "content.noResults": "No se encontraron resultados",
  "content.searchResults": "Resultados de búsqueda",
  "content.communityMember": "Miembro de la comunidad",
  "content.justNow": "Ahora mismo",
  
  // Forms
  "form.email": "Correo electrónico",
  "form.password": "Contraseña",
  "form.username": "Nombre de usuario",
  "form.name": "Nombre",
  "form.fullName": "Nombre completo",
  "form.phone": "Número de teléfono",
  "form.bio": "Biografía",
  "form.message": "Mensaje",
  "form.location": "Ubicación",
  "form.website": "Sitio web",
  "form.confirmPassword": "Confirmar contraseña",
  
  // Profile
  "profile.editProfile": "Editar perfil",
  "profile.posts": "Publicaciones",
  "profile.followers": "Seguidores",
  "profile.following": "Siguiendo",
  "profile.myProfile": "Mi perfil",
  "profile.viewAll": "Ver todo",
  "profile.likes": "Me gusta",
  "profile.changePhoto": "Cambiar foto",
  
  // Chat
  "chat.typeMessage": "Escribe un mensaje...",
  "chat.send": "Enviar",
  "chat.online": "En línea",
  "chat.offline": "Desconectado",
  "chat.typing": "Escribiendo...",
  "chat.newMessage": "Nuevo mensaje",
  "chat.noMessages": "Aún no hay mensajes",
  "chat.startConversation": "¡Inicia una conversación!",
  "chat.mute": "Silenciar",
  "chat.unmute": "Activar sonido",
  "chat.muteSounds": "Silenciar sonidos",
  "chat.enableSounds": "Activar sonidos",
  "chat.blockUser": "Bloquear usuario",
  "chat.deleteChat": "Eliminar chat",
  "chat.notFound": "Chat no encontrado",
  "chat.backToMessages": "Volver a mensajes",
  "chat.showStickers": "Mostrar stickers",
  
  // Settings
  "settings.title": "Configuración",
  "settings.language": "Idioma",
  "settings.account": "Cuenta",
  "settings.security": "Seguridad",
  "settings.notifications": "Notificaciones",
  "settings.privacy": "Privacidad",
  "settings.appearance": "Apariencia",
  "settings.support": "Soporte",
  "settings.theme": "Tema",
  "settings.darkMode": "Modo oscuro",
  "settings.lightMode": "Modo claro",
  
  // Auth
  "auth.welcomeBack": "Bienvenido de nuevo",
  "auth.login": "Iniciar sesión",
  "auth.signUp": "Registrarse",
  "auth.email": "Correo electrónico",
  "auth.phone": "Número de teléfono",
  "auth.password": "Contraseña",
  "auth.noAccount": "¿No tienes cuenta?",
  "auth.haveAccount": "¿Ya tienes cuenta?",
  "auth.signingIn": "Iniciando sesión...",
  "auth.creatingAccount": "Creando cuenta...",
  "auth.name": "Nombre completo",
  "auth.username": "Nombre de usuario",
  "auth.confirmPassword": "Confirmar contraseña",
  "auth.rememberMe": "Recuérdame",
  "auth.forgotPassword": "¿Olvidaste tu contraseña?",
  "auth.loginFailed": "Error al iniciar sesión",
  "auth.invalidCredentials": "Credenciales inválidas",
  "auth.signUpTitle": "Crear cuenta",
  "auth.welcomeTitle": "Únete a DeMedia",
  "auth.alreadyHaveAccount": "¿Ya tienes cuenta?",
  "auth.dontHaveAccount": "¿No tienes cuenta?",
  "auth.goToLogin": "Ir a iniciar sesión",
  "auth.tryAgain": "Intentar de nuevo",
  
  // Setup
  "setup.completeProfile": "Completa tu perfil",
  "setup.preferredLanguage": "Idioma preferido",
  "setup.phoneNumber": "Número de teléfono",
  "setup.saveContinue": "Guardar y continuar",
  "setup.saving": "Guardando...",
  
  // Common
  "common.save": "Guardar",
  "common.continue": "Continuar",
  "common.loading": "Cargando",
  "common.error": "Error",
  "common.success": "Éxito",
  "common.warning": "Advertencia",
  "common.info": "Información",
  
  // Posts
  "posts.loading": "Cargando publicaciones...",
  "posts.none": "Aún no hay publicaciones.",
  "posts.error": "Error",
  "posts.unknown": "Desconocido",
  "posts.image": "Imagen",
  "posts.like": "Me gusta",
  "posts.comment": "Comentar",
  "posts.share": "Compartir",
  "posts.createPost": "Crear publicación",
  "posts.whatsOnYourMind": "¿Qué estás pensando?",
  "posts.readyForStory": "Todo está listo para la próxima gran historia.",
  "posts.beFirst": "Sé el primero en compartir algo con la comunidad.",
  
  // Stories
  "stories.add": "Agregar historia",
  "stories.loading": "Cargando historias...",
  "stories.none": "Aún no hay historias.",
  "stories.error": "Error al cargar historias",
  "stories.yourStory": "Tu historia",
  "stories.title": "Historias",
  
  // Home
  "home.welcome": "Bienvenido a DeMedia",
  "home.feed": "Tu feed",
  "home.trending": "Tendencias",
  "home.suggestions": "Sugerencias",
  
  // Index
  "index.checkingAuth": "Verificando autenticación...",
  
  // Navbar specific
  "navbar.notifications": "Notificaciones",
  "navbar.messages": "Mensajes",
  "navbar.profile": "Perfil",
  "navbar.logout": "Cerrar sesión",
  
  // Comments
  "comments.title": "Comentarios",
  "comments.noComments": "Aún no hay comentarios. ¡Sé el primero en comentar!",
  "comments.addPlaceholder": "Añade un comentario...",
  "comments.editPlaceholder": "Edita tu comentario...",
  "comments.reply": "Responder",
  
  // DeSnaps
  "desnaps.create": "Crear DeSnap",
  "desnaps.shareTemporary": "Comparte videos y momentos temporales",
  
  // Content
  "content.chooseCreate": "Elige qué quieres crear",
  
  // Posts
  "posts.shareThoughts": "Comparte tus pensamientos, imágenes e historias",
};

// Complete French translations
const FR_TRANSLATIONS: Translations = {
  // Navigation
  "nav.home": "Accueil",
  "nav.messages": "Messages",
  "nav.desnaps": "DeSnaps",
  "nav.premium": "Premium",
  "nav.create": "Créer",
  "nav.notifications": "Notifications",
  "nav.settings": "Paramètres",
  "nav.profile": "Profil",
  "nav.logout": "Déconnexion",
  "nav.search": "Rechercher...",
  "nav.pages": "Pages",
  "nav.navigateTo": "Aller à",
  
  // Actions
  "action.like": "J'aime",
  "action.comment": "Commenter",
  "action.share": "Partager",
  "action.save": "Enregistrer",
  "action.cancel": "Annuler",
  "action.submit": "Soumettre",
  "action.close": "Fermer",
  "action.edit": "Modifier",
  "action.delete": "Supprimer",
  "action.follow": "Suivre",
  "action.unfollow": "Ne plus suivre",
  "action.showMore": "Voir plus",
  "action.showLess": "Voir moins",
  "action.send": "Envoyer",
  "action.post": "Publier",
  "action.upload": "Télécharger",
  "action.refresh": "Actualiser",
  "action.retry": "Réessayer",
  "action.back": "Retour",
  "action.next": "Suivant",
  "action.done": "Terminé",
  "action.confirm": "Confirmer",
  "action.viewProfile": "Voir le profil",
  "action.saved": "Enregistré",
  
  // Content
  "content.posts": "Publications",
  "content.followers": "Abonnés",
  "content.following": "Abonnements",
  "content.addStory": "Ajouter une story",
  "content.noPostsYet": "Aucune publication pour le moment",
  "content.noStoriesYet": "Aucune story pour le moment",
  "content.loading": "Chargement...",
  "content.error": "Erreur",
  "content.noResults": "Aucun résultat trouvé",
  "content.searchResults": "Résultats de recherche",
  "content.communityMember": "Membre de la communauté",
  "content.justNow": "À l'instant",
  
  // Forms
  "form.email": "E-mail",
  "form.password": "Mot de passe",
  "form.username": "Nom d'utilisateur",
  "form.name": "Nom",
  "form.fullName": "Nom complet",
  "form.phone": "Numéro de téléphone",
  "form.bio": "Bio",
  "form.message": "Message",
  "form.location": "Localisation",
  "form.website": "Site web",
  "form.confirmPassword": "Confirmer le mot de passe",
  
  // Profile
  "profile.editProfile": "Modifier le profil",
  "profile.posts": "Publications",
  "profile.followers": "Abonnés",
  "profile.following": "Abonnements",
  "profile.myProfile": "Mon profil",
  "profile.viewAll": "Voir tout",
  "profile.likes": "J'aime",
  "profile.changePhoto": "Changer la photo",
  
  // Chat
  "chat.typeMessage": "Écrivez un message...",
  "chat.send": "Envoyer",
  "chat.online": "En ligne",
  "chat.offline": "Hors ligne",
  "chat.typing": "En train d'écrire...",
  "chat.newMessage": "Nouveau message",
  "chat.noMessages": "Aucun message pour le moment",
  "chat.startConversation": "Commencez une conversation !",
  "chat.mute": "Muet",
  "chat.unmute": "Activer le son",
  "chat.muteSounds": "Couper les sons",
  "chat.enableSounds": "Activer les sons",
  "chat.blockUser": "Bloquer l'utilisateur",
  "chat.deleteChat": "Supprimer la conversation",
  "chat.notFound": "Conversation introuvable",
  "chat.backToMessages": "Retour aux messages",
  "chat.showStickers": "Afficher les stickers",
  
  // Settings
  "settings.title": "Paramètres",
  "settings.language": "Langue",
  "settings.account": "Compte",
  "settings.security": "Sécurité",
  "settings.notifications": "Notifications",
  "settings.privacy": "Confidentialité",
  "settings.appearance": "Apparence",
  "settings.support": "Support",
  "settings.theme": "Thème",
  "settings.darkMode": "Mode sombre",
  "settings.lightMode": "Mode clair",
  
  // Auth
  "auth.welcomeBack": "Bon retour",
  "auth.login": "Connexion",
  "auth.signUp": "S'inscrire",
  "auth.email": "Adresse e-mail",
  "auth.phone": "Numéro de téléphone",
  "auth.password": "Mot de passe",
  "auth.noAccount": "Vous n'avez pas de compte ?",
  "auth.haveAccount": "Vous avez déjà un compte ?",
  "auth.signingIn": "Connexion en cours...",
  "auth.creatingAccount": "Création du compte...",
  "auth.name": "Nom complet",
  "auth.username": "Nom d'utilisateur",
  "auth.confirmPassword": "Confirmer le mot de passe",
  "auth.rememberMe": "Se souvenir de moi",
  "auth.forgotPassword": "Mot de passe oublié ?",
  "auth.loginFailed": "Échec de la connexion",
  "auth.invalidCredentials": "Identifiants invalides",
  "auth.signUpTitle": "Créer un compte",
  "auth.welcomeTitle": "Rejoignez DeMedia",
  "auth.alreadyHaveAccount": "Vous avez déjà un compte ?",
  "auth.dontHaveAccount": "Vous n'avez pas de compte ?",
  "auth.goToLogin": "Aller à la connexion",
  "auth.tryAgain": "Réessayer",
  
  // Setup
  "setup.completeProfile": "Complétez votre profil",
  "setup.preferredLanguage": "Langue préférée",
  "setup.phoneNumber": "Numéro de téléphone",
  "setup.saveContinue": "Enregistrer et continuer",
  "setup.saving": "Enregistrement...",
  
  // Common
  "common.save": "Enregistrer",
  "common.continue": "Continuer",
  "common.loading": "Chargement",
  "common.error": "Erreur",
  "common.success": "Succès",
  "common.warning": "Avertissement",
  "common.info": "Information",
  
  // Posts
  "posts.loading": "Chargement des publications...",
  "posts.none": "Aucune publication pour le moment.",
  "posts.error": "Erreur",
  "posts.unknown": "Inconnu",
  "posts.image": "Image",
  "posts.like": "J'aime",
  "posts.comment": "Commenter",
  "posts.share": "Partager",
  "posts.createPost": "Créer une publication",
  "posts.whatsOnYourMind": "À quoi pensez-vous ?",
  "posts.readyForStory": "Tout est prêt pour la prochaine grande histoire.",
  "posts.beFirst": "Soyez le premier à partager quelque chose avec la communauté.",
  
  // Stories
  "stories.add": "Ajouter une story",
  "stories.loading": "Chargement des stories...",
  "stories.none": "Aucune story pour le moment.",
  "stories.error": "Erreur lors du chargement des stories",
  "stories.yourStory": "Votre story",
  "stories.title": "Stories",
  
  // Home
  "home.welcome": "Bienvenue sur DeMedia",
  "home.feed": "Votre fil",
  "home.trending": "Tendances",
  "home.suggestions": "Suggestions",
  
  // Index
  "index.checkingAuth": "Vérification de l'authentification...",
  
  // Navbar specific
  "navbar.notifications": "Notifications",
  "navbar.messages": "Messages",
  "navbar.profile": "Profil",
  "navbar.logout": "Déconnexion",
  
  // Comments
  "comments.title": "Commentaires",
  "comments.noComments": "Aucun commentaire pour le moment. Soyez le premier à commenter !",
  "comments.addPlaceholder": "Ajouter un commentaire...",
  "comments.editPlaceholder": "Modifier votre commentaire...",
  "comments.reply": "Répondre",
  
  // DeSnaps
  "desnaps.create": "Créer un DeSnap",
  "desnaps.shareTemporary": "Partagez des vidéos et des moments temporaires",
  
  // Content
  "content.chooseCreate": "Choisissez ce que vous souhaitez créer",
  
  // Posts
  "posts.shareThoughts": "Partagez vos pensées, images et histoires",
};


// Complete German translations
const DE_TRANSLATIONS: Translations = {
  // Navigation
  "nav.home": "Startseite",
  "nav.messages": "Nachrichten",
  "nav.desnaps": "DeSnaps",
  "nav.premium": "Premium",
  "nav.create": "Erstellen",
  "nav.notifications": "Benachrichtigungen",
  "nav.settings": "Einstellungen",
  "nav.profile": "Profil",
  "nav.logout": "Abmelden",
  "nav.search": "Suchen...",
  "nav.pages": "Seiten",
  "nav.navigateTo": "Gehe zu",
  
  // Actions
  "action.like": "Gefällt mir",
  "action.comment": "Kommentieren",
  "action.share": "Teilen",
  "action.save": "Speichern",
  "action.cancel": "Abbrechen",
  "action.submit": "Absenden",
  "action.close": "Schließen",
  "action.edit": "Bearbeiten",
  "action.delete": "Löschen",
  "action.follow": "Folgen",
  "action.unfollow": "Entfolgen",
  "action.showMore": "Mehr anzeigen",
  "action.showLess": "Weniger anzeigen",
  "action.send": "Senden",
  "action.post": "Posten",
  "action.upload": "Hochladen",
  "action.refresh": "Aktualisieren",
  "action.retry": "Erneut versuchen",
  "action.back": "Zurück",
  "action.next": "Weiter",
  "action.done": "Fertig",
  "action.confirm": "Bestätigen",
  "action.viewProfile": "Profil anzeigen",
  "action.saved": "Gespeichert",
  
  // Content
  "content.posts": "Beiträge",
  "content.followers": "Follower",
  "content.following": "Folge ich",
  "content.addStory": "Story hinzufügen",
  "content.noPostsYet": "Noch keine Beiträge",
  "content.noStoriesYet": "Noch keine Stories",
  "content.loading": "Laden...",
  "content.error": "Fehler",
  "content.noResults": "Keine Ergebnisse gefunden",
  "content.searchResults": "Suchergebnisse",
  "content.communityMember": "Community-Mitglied",
  "content.justNow": "Gerade eben",
  
  // Forms
  "form.email": "E-Mail",
  "form.password": "Passwort",
  "form.username": "Benutzername",
  "form.name": "Name",
  "form.fullName": "Vollständiger Name",
  "form.phone": "Telefonnummer",
  "form.bio": "Bio",
  "form.message": "Nachricht",
  "form.location": "Standort",
  "form.website": "Website",
  "form.confirmPassword": "Passwort bestätigen",
  
  // Profile
  "profile.editProfile": "Profil bearbeiten",
  "profile.posts": "Beiträge",
  "profile.followers": "Follower",
  "profile.following": "Folge ich",
  "profile.myProfile": "Mein Profil",
  "profile.viewAll": "Alle anzeigen",
  "profile.likes": "Gefällt mir",
  "profile.changePhoto": "Foto ändern",
  
  // Chat
  "chat.typeMessage": "Nachricht eingeben...",
  "chat.send": "Senden",
  "chat.online": "Online",
  "chat.offline": "Offline",
  "chat.typing": "Schreibt...",
  "chat.newMessage": "Neue Nachricht",
  "chat.noMessages": "Noch keine Nachrichten",
  "chat.startConversation": "Starte eine Unterhaltung!",
  "chat.mute": "Stumm",
  "chat.unmute": "Ton an",
  "chat.muteSounds": "Töne stumm schalten",
  "chat.enableSounds": "Töne aktivieren",
  "chat.blockUser": "Benutzer blockieren",
  "chat.deleteChat": "Chat löschen",
  "chat.notFound": "Chat nicht gefunden",
  "chat.backToMessages": "Zurück zu Nachrichten",
  "chat.showStickers": "Sticker anzeigen",
  
  // Settings
  "settings.title": "Einstellungen",
  "settings.language": "Sprache",
  "settings.account": "Konto",
  "settings.security": "Sicherheit",
  "settings.notifications": "Benachrichtigungen",
  "settings.privacy": "Datenschutz",
  "settings.appearance": "Erscheinungsbild",
  "settings.support": "Support",
  "settings.theme": "Design",
  "settings.darkMode": "Dunkelmodus",
  "settings.lightMode": "Hellmodus",
  
  // Auth
  "auth.welcomeBack": "Willkommen zurück",
  "auth.login": "Anmelden",
  "auth.signUp": "Registrieren",
  "auth.email": "E-Mail-Adresse",
  "auth.phone": "Telefonnummer",
  "auth.password": "Passwort",
  "auth.noAccount": "Kein Konto?",
  "auth.haveAccount": "Bereits ein Konto?",
  "auth.signingIn": "Anmeldung läuft...",
  "auth.creatingAccount": "Konto wird erstellt...",
  "auth.name": "Vollständiger Name",
  "auth.username": "Benutzername",
  "auth.confirmPassword": "Passwort bestätigen",
  "auth.rememberMe": "Angemeldet bleiben",
  "auth.forgotPassword": "Passwort vergessen?",
  "auth.loginFailed": "Anmeldung fehlgeschlagen",
  "auth.invalidCredentials": "Ungültige Anmeldedaten",
  "auth.signUpTitle": "Konto erstellen",
  "auth.welcomeTitle": "Tritt DeMedia bei",
  "auth.alreadyHaveAccount": "Bereits ein Konto?",
  "auth.dontHaveAccount": "Kein Konto?",
  "auth.goToLogin": "Zur Anmeldung",
  "auth.tryAgain": "Erneut versuchen",
  
  // Setup
  "setup.completeProfile": "Profil vervollständigen",
  "setup.preferredLanguage": "Bevorzugte Sprache",
  "setup.phoneNumber": "Telefonnummer",
  "setup.saveContinue": "Speichern und fortfahren",
  "setup.saving": "Speichern...",
  
  // Common
  "common.save": "Speichern",
  "common.continue": "Fortfahren",
  "common.loading": "Laden",
  "common.error": "Fehler",
  "common.success": "Erfolg",
  "common.warning": "Warnung",
  "common.info": "Information",
  
  // Posts
  "posts.loading": "Beiträge werden geladen...",
  "posts.none": "Noch keine Beiträge.",
  "posts.error": "Fehler",
  "posts.unknown": "Unbekannt",
  "posts.image": "Bild",
  "posts.like": "Gefällt mir",
  "posts.comment": "Kommentieren",
  "posts.share": "Teilen",
  "posts.createPost": "Beitrag erstellen",
  "posts.whatsOnYourMind": "Was denkst du?",
  "posts.readyForStory": "Alles ist bereit für die nächste große Geschichte.",
  "posts.beFirst": "Sei der Erste, der etwas mit der Community teilt.",
  
  // Stories
  "stories.add": "Story hinzufügen",
  "stories.loading": "Stories werden geladen...",
  "stories.none": "Noch keine Stories.",
  "stories.error": "Fehler beim Laden der Stories",
  "stories.yourStory": "Deine Story",
  "stories.title": "Stories",
  
  // Home
  "home.welcome": "Willkommen bei DeMedia",
  "home.feed": "Dein Feed",
  "home.trending": "Trending",
  "home.suggestions": "Vorschläge",
  
  // Index
  "index.checkingAuth": "Authentifizierung wird überprüft...",
  
  // Navbar specific
  "navbar.notifications": "Benachrichtigungen",
  "navbar.messages": "Nachrichten",
  "navbar.profile": "Profil",
  "navbar.logout": "Abmelden",
  
  // Comments
  "comments.title": "Kommentare",
  "comments.noComments": "Noch keine Kommentare. Sei der Erste, der kommentiert!",
  "comments.addPlaceholder": "Kommentar hinzufügen...",
  "comments.editPlaceholder": "Kommentar bearbeiten...",
  "comments.reply": "Antworten",
  
  // DeSnaps
  "desnaps.create": "DeSnap erstellen",
  "desnaps.shareTemporary": "Teile temporäre Videos und Momente",
  
  // Content
  "content.chooseCreate": "Wähle, was du erstellen möchtest",
  
  // Posts
  "posts.shareThoughts": "Teile deine Gedanken, Bilder und Geschichten",
};

// Combine all translations
const BASE_TRANSLATIONS: Record<Locale, Translations> = {
  en: EN_TRANSLATIONS,
  ar: AR_TRANSLATIONS,
  es: ES_TRANSLATIONS,
  fr: FR_TRANSLATIONS,
  de: DE_TRANSLATIONS,
};

// Helper function to check if a language is RTL
const isRTLLanguage = (code: string): boolean => {
  return RTL_LANGUAGES.includes(code);
};

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Locale>("en");

  // Update document direction when language changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isRTL = isRTLLanguage(language);
      document.documentElement.dir = isRTL ? "rtl" : "ltr";
      document.documentElement.lang = language;
    }
  }, [language]);

  // Load saved language on mount
  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("language") : null;
    if (stored && SUPPORTED.find(l => l.code === stored)) {
      setLanguageState(stored);
    }
  }, []);

  const setLanguage = (lng: Locale) => {
    if (SUPPORTED.find(l => l.code === lng)) {
      setLanguageState(lng);
      if (typeof window !== "undefined") {
        localStorage.setItem("language", lng);
      }
    }
  };

  const t = (key: string, fallback?: string): string => {
    const lang = BASE_TRANSLATIONS[language] || {};
    if (lang[key]) return lang[key];
    const en = BASE_TRANSLATIONS["en"] || {};
    return en[key] || fallback || key;
  };

  const isRTL = isRTLLanguage(language);
  const direction = isRTL ? "rtl" : "ltr";

  const value = useMemo<I18nContextType>(() => ({
    language,
    setLanguage,
    t,
    supportedLocales: SUPPORTED,
    isRTL,
    direction,
  }), [language, isRTL, direction]);

  return (
    <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
  );
};
