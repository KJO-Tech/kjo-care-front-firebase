export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080',
  firebase: {
    projectId: "",
    appId: "",
    apiKey: "",
    authDomain: "",
    messagingSenderId: "",
    measurementId: "",
    storageBucket: ""
  },
  cloudinary: {
    cloudName: import.meta.env.NG_APP_CLOUDINARY_CLOUD_NAME,
    uploadPreset: import.meta.env.NG_APP_CLOUDINARY_UPLOAD_PRESET,
    apiKey: import.meta.env.NG_APP_CLOUDINARY_API_KEY,
    apiSecret: import.meta.env.NG_APP_CLOUDINARY_API_SECRET
  }
};
