# Bakaya Mobile

React Native app with Expo SDK 54 and React Navigation.

## Setup

```bash
cp .env.example .env
bun install
```

## Development

```bash
bun run start
```

This starts the Expo dev server. Scan the QR code with:
- **iOS**: Camera app or Expo Go
- **Android**: Expo Go app

## Environment Variables

| Variable                | Required | Default                 | Description    |
| ----------------------- | -------- | ----------------------- | -------------- |
| `EXPO_PUBLIC_API_URL`   | No       | `http://localhost:3001`  | API server URL |

## Structure

```
src/
├── components/     # Reusable UI components
├── constants/      # App constants and theme
├── context/        # React context providers
├── interfaces/     # TypeScript interfaces
├── navigation/     # React Navigation setup
├── screens/        # App screens
├── services/       # API service modules
├── types/          # TypeScript type definitions
└── utils/          # Utility functions
```

## Build

```bash
# Development build
bun run start

# Platform-specific
bun run android
bun run ios

# Preview build (EAS)
eas build --profile preview
```
