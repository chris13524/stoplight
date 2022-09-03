import {
  connect,
  credsAuthenticator,
  StringCodec,
} from "https://deno.land/x/nats/src/mod.ts";

import { getUnixTime } from "https://esm.sh/date-fns";

const sc = StringCodec();

const nc = await connect({
  servers: "tls://connect.ngs.global",
  authenticator: credsAuthenticator(
    new TextEncoder().encode(Deno.env.get("CREDS")),
  ),
});

const js = nc.jetstream();
const kv = await js.views.kv("stoplight", { history: 5, maxBucketSize: 1000 });

while (true) {
  const date = new Date();
  update(date);
  await new Promise(resolve => setTimeout(resolve, 1000));
}

async function update(date: Date) {
  const time = getUnixTime(date);
  await setStoplight({
    red: (time >> 0 & 0b1) == 1,
    yellow: (time >> 1 & 0b1) == 1,
    green: (time >> 2 & 0b1) == 1,
  });
}

interface Lights {
  red: boolean;
  yellow: boolean;
  green: boolean;
}

async function setStoplight(lights: Lights) {
  await kv?.put("stoplight", sc.encode(JSON.stringify(lights)));
}
