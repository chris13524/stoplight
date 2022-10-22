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

// TODO rename folder to "stoplight-control"

// TODO share types
type Lights = {
  red: boolean;
  yellow: boolean;
  green: boolean;
};
export type Mode = "manual" | "clock" | "eth";

let mode: Mode = "manual";
(async () => {
  const kv = await js.views.kv("mode", { history: 5, maxBucketSize: 1000 });
  const watch = await kv.watch();
  for await (const e of watch) {
    mode = JSON.parse(sc.decode(e.value));
  }
})();

const kv = await js.views.kv("stoplight", { history: 5, maxBucketSize: 1000 });

async function setStoplight(lights: Lights) {
  await kv?.put("stoplight", sc.encode(JSON.stringify(lights)));
}

async function updateClock() {
  const date = new Date();
  const time = getHours(date) / 3;
  await setStoplight({
    green: (time >> 0 & 0b1) == 1,
    yellow: (time >> 1 & 0b1) == 1,
    red: (time >> 2 & 0b1) == 1,
  });
}

async function updateEth() {
  const res = await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=ethereum");
  const json = await res.json();
  const price = json[0]["price_change_percentage_24h"];
  if (price >= 1) {
    await setStoplight({
      green: true,
      yellow: false,
      red: false,
    });
  } else if (price > 0 && price < 1) {
    await setStoplight({
      green: true,
      yellow: true,
      red: false,
    });
  } else if (price > -0.1 && price < 0.1) {
    await setStoplight({
      green: false,
      yellow: true,
      red: false,
    });
  } else if (price < 0 && price > -1) {
    await setStoplight({
      green: false,
      yellow: true,
      red: true,
    });
  } else {
    await setStoplight({
      green: false,
      yellow: false,
      red: true,
    });
  }
}

while (true) {
  if ((mode as Mode) == "clock") {
    updateClock();
  } else if ((mode as Mode) == "eth") {
    updateEth();
  }

  // TODO make this update immediatly, not after potentially 30 seconds
  // CoinGecko allows 50 calls/minute: https://www.coingecko.com/en/api/documentation
  await new Promise(resolve => setTimeout(resolve, mode == "eth" ? 30000 : 1000));
}
