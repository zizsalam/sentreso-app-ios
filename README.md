# Sentreso Finance App

## Quick Setup Instructions

1. Create a new folder on your computer
2. Copy all files from this project
3. Run these commands:

```bash
npm install
npx expo start
```

## If you still get _interopRequireDefault error:

```bash
# Try these fixes:
npm install @babel/runtime
# OR
npm install expo-router@3.5.23
# OR
npx expo install --fix
```

## Project Structure

```
sentreso-finance-app/
├── app/
│   ├── _layout.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   ├── add.tsx
│   │   ├── voice.tsx
│   │   └── analytics.tsx
│   └── +not-found.tsx
├── contexts/
│   └── TransactionContext.tsx
├── hooks/
│   └── useFrameworkReady.ts
├── services/
│   └── VapiService.ts
├── types/
│   └── receipt.ts
├── package.json
├── babel.config.js
├── app.json
├── tsconfig.json
└── metro.config.js
```

## Features
- ✅ Transaction management
- ✅ Voice recording (mock implementation)
- ✅ Analytics dashboard
- ✅ Tab navigation
- ✅ Context state management

## Troubleshooting
If you encounter issues, try:
1. Delete node_modules and package-lock.json
2. Run `npm install`
3. Run `npx expo doctor`
4. Run `npx expo start --clear`