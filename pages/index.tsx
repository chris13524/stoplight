import { connect, credsAuthenticator, StringCodec } from 'nats.ws';
import { KV } from 'nats.ws/lib/nats-base-client/types';
import type { NextPage } from 'next'
import Head from 'next/head'
import { useEffect, useState } from 'react'
import styles from './index.module.css'

const sc = StringCodec();

const Home: NextPage = () => {
  const [stoplight, setStoplight] = useState({ red: false, yellow: false, green: false });
  const [kv, setKv] = useState<KV | null>();

  useEffect(() => {
    connect({
      servers: "tls://connect.ngs.global",
      authenticator: credsAuthenticator(
        new TextEncoder().encode(process.env.NEXT_PUBLIC_CREDS),
      ),
    }).then(async nc => {
      const js = nc.jetstream();
      const kv = await js.views.kv("stoplight", { history: 5, maxBucketSize: 1000 });
      setKv(kv);
      const watch = await kv.watch();
      for await (const e of watch) {
        setStoplight(JSON.parse(sc.decode(e.value)));
      }
    });
  }, []);

  const update = (change: Partial<typeof stoplight>) => {
    console.log("updated:", change);
    kv?.put("stoplight", sc.encode(JSON.stringify({ ...stoplight, ...change })));
  };

  return (
    <div className={styles.stoplight}>
      <Head>
        <title>Stoplight</title>
      </Head>

      <div className={styles.red + ' ' + (stoplight.red ? styles.lit : '')} onClick={() => update({ red: !stoplight.red })}></div>
      <div className={styles.yellow + ' ' + (stoplight.yellow ? styles.lit : '')} onClick={() => update({ yellow: !stoplight.yellow })}></div>
      <div className={styles.green + ' ' + (stoplight.green ? styles.lit : '')} onClick={() => update({ green: !stoplight.green })}></div>
      {JSON.stringify(stoplight)}
    </div>
  )
}

export default Home;
