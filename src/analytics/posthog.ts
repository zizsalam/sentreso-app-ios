import PostHog from 'posthog-react-native';

const POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY || '';
const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

let client: PostHog | null = null;

export function initAnalytics() {
  if (client || !POSTHOG_KEY) return;
  client = new PostHog(POSTHOG_KEY, { host: POSTHOG_HOST });
}

export const track = (name: string, props?: Record<string, any>) => {
  if (!client) return;
  client.capture(name, props);
};

export const screen = (name: string, props?: Record<string, any>) => {
  if (!client) return;
  client.screen(name, props);
};


