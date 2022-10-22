import { connect, credsAuthenticator, StringCodec } from 'nats.ws';
import { KV } from 'nats.ws/lib/nats-base-client/types';
import type { NextPage } from 'next'
import Head from 'next/head'
import { useEffect, useState } from 'react'
import styles from './index.module.css'
import { Select, Switch } from '@mantine/core'
import { useLocalStorage } from '@mantine/hooks';

const sc = StringCodec();

const lights: Light[] = ["red", "yellow", "green"];
type Light = "red" | "yellow" | "green";

const ALL_OFF: { [LightKey in Light]: boolean } = { red: false, yellow: false, green: false };

type Mode = "manual" | "clock" | "eth";

const Home: NextPage = () => {
  const [stoplight, setStoplight] = useState(ALL_OFF);
  const [kv, setKv] = useState<KV | null>();
  const [manMode, setManMode] = useLocalStorage({ key: "mode", defaultValue: false });
  const [modeKv, setModeKv] = useState<KV | null>();
  const [mode, setMode] = useState<Mode>("manual");

  useEffect(() => {
    connect({
      servers: "connect.ngs.global",
      authenticator: credsAuthenticator(
        new TextEncoder().encode(process.env.NEXT_PUBLIC_CREDS),
      ),
    }).then(async nc => {
      const js = nc.jetstream();

      (async () => {
        const kv = await js.views.kv("mode", { history: 5, maxBucketSize: 1000 });
        setModeKv(kv);
        const watch = await kv.watch();
        for await (const e of watch) {
          setMode(JSON.parse(sc.decode(e.value)));
        }
      })();

      const kv = await js.views.kv("stoplight", { history: 5, maxBucketSize: 1000 });
      setKv(kv);
      const watch = await kv.watch();
      for await (const e of watch) {
        setStoplight(JSON.parse(sc.decode(e.value)));
      }
    });
  }, []);

  const update = (change: Partial<typeof stoplight>) => {
    const newStoplight = { ...stoplight, ...change };
    setStoplight(newStoplight); // prevent rapid button pressing from overwriting each other
    kv?.put("stoplight", sc.encode(JSON.stringify(newStoplight)));
  };

  const updateMode = (mode: Mode) => {
    setMode(mode);
    modeKv?.put("mode", sc.encode(JSON.stringify(mode)));
  };

  const clicked = (light: Light) => {
    if (manMode) {
      update({ ...ALL_OFF, [light]: true });
    } else {
      update({ [light]: !stoplight[light] });
    }
  };

  const lightClassName = (light: Light) => styles[light] + ' ' + (stoplight[light] ? styles.lit : '');

  return (
    <div className={styles.stoplight}>
      <Head>
        <title>Stoplight</title>
      </Head>

      {lights.map(color => (<div key={color} className={lightClassName(color)} onClick={() => clicked(color)}></div>))}

      <Switch label="Toggle Mode" checked={manMode} onChange={e => setManMode(e.currentTarget.checked)} />
      <Select value={mode} onChange={updateMode} data={["manual", "clock", "eth"]} />
    </div>
  );
};

export default Home;
