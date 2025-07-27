# How to Copy This Project

Since Bolt doesn't have a download button, here's how to manually copy the project:

## Method 1: Copy Files One by One
1. Open each file in the file explorer
2. Copy the content
3. Create the same file structure on your computer
4. Paste the content

## Method 2: Use Git (if available)
```bash
# If you can access the project via git
git clone [project-url]
cd sentreso-finance-app
npm install
```

## Essential Files to Copy:

### Root Files:
- `package.json`
- `babel.config.js` 
- `app.json`
- `tsconfig.json`
- `metro.config.js`

### App Directory:
- `app/_layout.tsx`
- `app/+not-found.tsx`
- `app/(tabs)/_layout.tsx`
- `app/(tabs)/index.tsx`
- `app/(tabs)/add.tsx`
- `app/(tabs)/voice.tsx`
- `app/(tabs)/analytics.tsx`

### Other Directories:
- `contexts/TransactionContext.tsx`
- `hooks/useFrameworkReady.ts`
- `services/VapiService.ts`
- `types/receipt.ts`

## After Copying:
```bash
npm install
npx expo start
```

## If Still Having Issues:
The _interopRequireDefault error is a known Expo web bundling issue. Try:
1. `npm install @babel/runtime`
2. `npx expo install --fix`
3. Use mobile simulator instead of web
4. Downgrade expo-router: `npm install expo-router@3.5.23`