// Define the type of the environment variables.
declare interface Env {
  readonly NODE_ENV: string;
  // Replace the following with your own environment variables.
  // Example: NGX_VERSION: string;
  NG_APP_API_URL: string;
  NG_APP_KEYCLOAK_URL: string;
  NG_APP_KEYCLOAK_REALM: string;
  NG_APP_KEYCLOAK_CLIENT_ID: string;
  NG_APP_FIREBASE_PROJECT_ID: string;
  NG_APP_FIREBASE_APP_ID: string;
  NG_APP_FIREBASE_API_KEY: string;
  NG_APP_FIREBASE_AUTH_DOMAIN: string;
  NG_APP_FIREBASE_MESSAGING_SENDER_ID: string;
  NG_APP_FIREBASE_MEASUREMENT_ID: string;
  NG_APP_FIREBASE_STORAGE_BUCKET: string;

  NG_APP_CLOUDINARY_CLOUD_NAME: string;
  NG_APP_CLOUDINARY_UPLOAD_PRESET: string;
  NG_APP_CLOUDINARY_API_KEY: string;
  NG_APP_CLOUDINARY_API_SECRET: string;
}

// Choose how to access the environment variables.
// Remove the unused options.

// 1. Use import.meta.env.YOUR_ENV_VAR in your code. (conventional)
declare interface ImportMeta {
  readonly env: Env;
}

// 2. Use _NGX_ENV_.YOUR_ENV_VAR in your code. (customizable)
// You can modify the name of the variable in angular.json.
// ngxEnv: {
//  define: '_NGX_ENV_',
// }
declare const _NGX_ENV_: Env;

// 3. Use process.env.YOUR_ENV_VAR in your code. (deprecated)
declare namespace NodeJS {
  export interface ProcessEnv extends Env { }
}
