# Stoplight

An app to remotely control a stoplight using a Raspberry Pi.

The Raspberry Pi runs a Deno script (`rpi.ts`) which controls three 120V relays using GPIO pins. Control commands are sent using a NATS pub/sub bus. The script watches a NATS JetStream key-value store which is hosted on <https://ngs.global> for convenience.

The app component is developed using Next.js, and can be used from any browser with Internet connectivity or from your phone. The app is deployed to Vercel for convenience.

## Usage

```bash
NEXT_PUBLIC_CREDS=$(cat default.creds) npm run dev
```

## TODO

- Automate updates to RPi, move Docker stuff into the repo
- Document NKEYs provisioning
