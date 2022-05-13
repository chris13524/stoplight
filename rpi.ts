import {
  connect,
  credsAuthenticator,
  StringCodec,
} from "https://deno.land/x/nats/src/mod.ts";

const sc = StringCodec();

const nc = await connect({
  servers: "tls://connect.ngs.global",
  authenticator: credsAuthenticator(
    new TextEncoder().encode(Deno.env.get("CREDS")),
  ),
});

const js = nc.jetstream();
const kv = await js.views.kv("stoplight", { history: 5, maxBucketSize: 1000 });
const watch = await kv.watch();

export interface Lights {
  red: boolean;
  yellow: boolean;
  green: boolean;
}

for await (const e of watch) {
  const lights = JSON.parse(sc.decode(e.value));
  console.log(lights);
}
