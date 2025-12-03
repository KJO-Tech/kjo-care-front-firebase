export const environment = {
  production: true,
  apiUrl: 'http://localhost:8080',
  firebase: {
    projectId: import.meta.env.NG_APP_FIREBASE_PROJECT_ID,
    appId: import.meta.env.NG_APP_FIREBASE_APP_ID,
    apiKey: import.meta.env.NG_APP_FIREBASE_API_KEY,
    authDomain: import.meta.env.NG_APP_FIREBASE_AUTH_DOMAIN,
    messagingSenderId: import.meta.env.NG_APP_FIREBASE_MESSAGING_SENDER_ID,
    measurementId: import.meta.env.NG_APP_FIREBASE_MEASUREMENT_ID,
    storageBucket: import.meta.env.NG_APP_FIREBASE_STORAGE_BUCKET,
    vapidKey: import.meta.env.NG_APP_FIREBASE_VAPID_KEY,
  },
  cloudinary: {
    cloudName: import.meta.env.NG_APP_CLOUDINARY_CLOUD_NAME,
    uploadPreset: import.meta.env.NG_APP_CLOUDINARY_UPLOAD_PRESET,
    apiKey: import.meta.env.NG_APP_CLOUDINARY_API_KEY,
    apiSecret: import.meta.env.NG_APP_CLOUDINARY_API_SECRET,
  },
};
