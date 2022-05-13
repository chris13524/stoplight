import {
  connect,
  credsAuthenticator,
  StringCodec,
} from "https://deno.land/x/nats/src/mod.ts";
import { executeInstructions, Pin, PinDirection } from "https://raw.githubusercontent.com/duart38/deno_gpio/main/mod.ts";

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

interface Lights {
  red: boolean;
  yellow: boolean;
  green: boolean;
}

const red = new Pin(21, PinDirection.OUT, 0);
const yellow = new Pin(20, PinDirection.OUT, 0);
const green = new Pin(26, PinDirection.OUT, 0);
await executeInstructions();

for await (const e of watch) {
  const lights: Lights = JSON.parse(sc.decode(e.value));
  console.log(lights);

  red.setValue(lights.red ? 1 : 0);
  yellow.setValue(lights.yellow ? 1 : 0);
  green.setValue(lights.green ? 1 : 0);

  executeInstructions();
}
