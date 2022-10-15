import {
  connect,
  credsAuthenticator,
  StringCodec,
} from "https://deno.land/x/nats/src/mod.ts";

import { getHours } from "https://esm.sh/date-fns";

const sc = StringCodec();

const nc = await connect({
  servers: "tls://connect.ngs.global",
  authenticator: credsAuthenticator(
    new TextEncoder().encode(Deno.env.get("CREDS")),
  ),
});

const js = nc.jetstream();

// TODO share types
type Lights = {
  red: boolean;
  yellow: boolean;
  green: boolean;
};
type Clock = boolean;

let clock: Clock = false;
(async () => {
  const kv = await js.views.kv("clock", { history: 5, maxBucketSize: 1000 });
  const watch = await kv.watch();
  for await (const e of watch) {
    clock = JSON.parse(sc.decode(e.value));
  }
})();

const kv = await js.views.kv("stoplight", { history: 5, maxBucketSize: 1000 });

async function setStoplight(lights: Lights) {
  await kv?.put("stoplight", sc.encode(JSON.stringify(lights)));
}

async function update(date: Date) {
  const time = getHours(date) / 3;
  await setStoplight({
    green: (time >> 0 & 0b1) == 1,
    yellow: (time >> 1 & 0b1) == 1,
    red: (time >> 2 & 0b1) == 1,
  });
}

while (true) {
  const date = new Date();
  if (clock) {
    update(date);
  }
  await new Promise(resolve => setTimeout(resolve, 1000));
}
