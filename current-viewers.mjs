import http from "http";

const opts = {};
const required = [
  "GRAFANA_SERVICE_TOKEN",
  "GRAFANA_QUERY_URL",
  "GRAFANA_DATASOURCE_UID",
  "GRAFANA_ORG_ID",
];
for (const x of required) {
  if (process.env[x] === undefined) {
    throw new Error(`missing ${x}`);
  }
  opts[x] = process.env[x];
}

const getViewers = async (playbackId) => {
  const expr = `
    sum(
      mist_sessions{
        catalyst="true",
        sessType="viewers",
        stream=~".+${playbackId}"
      }[1m]
    ) by (stream) or on() vector(0)
  `;
  const body = {
    queries: [
      {
        datasource: {
          type: "prometheus",
          uid: opts.GRAFANA_DATASOURCE_UID,
        },
        editorMode: "code",
        exemplar: false,
        expr: expr,
        instant: true,
        interval: "",
        range: false,
        refId: "A",
        utcOffsetSec: 0,
        legendFormat: "",
        datasourceId: 1,
        intervalMs: 15000,
        maxDataPoints: 2010,
      },
    ],
    from: `${Date.now()}`,
    to: `${Date.now()}`,
  };
  const res = await fetch(opts.GRAFANA_QUERY_URL, {
    headers: {
      accept: "application/json, text/plain, */*",
      authorization: `Bearer ${opts.GRAFANA_SERVICE_TOKEN}`,
      "cache-control": "no-cache",
      "content-type": "application/json",
      "x-datasource-uid": opts.GRAFANA_DATASOURCE_UID,
      "x-grafana-org-id": opts.GRAFANA_ORG_ID,
    },
    body: JSON.stringify(body),
    method: "POST",
  });
  const data = await res.json();
  const result = data.results.A.frames[0].data.values[1][0];
  return result;
};

if (process.argv[2]) {
  getViewers(process.argv[2]).then((x) => console.log(x));
}

async function run() {
  const [_, playbackId, ext] = /\/(.+)\.(.+)$/.exec(document.location.pathname);
  const go = async () => {
    const res = await fetch(`/${playbackId}.json`);
    const data = await res.json();
    document.querySelector("#viewers").innerHTML = data.viewers;
  };
  go();
  setInterval(go, 2000);
}

const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Viewers</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@800&display=swap" rel="stylesheet">
    <style>
      html, body {
        margin: 0;
        font-family: 'Noto Sans', sans-serif;
        background-color: rgba(0,0,0,0);
      }
      main {
        font-weight: 800;
        font-size: 96px;
        -webkit-text-fill-color: white;
        -webkit-text-stroke-width: 3px;
        -webkit-text-stroke-color: black;
      }
    </style>
  </head>
  <body>
    <main>Viewers: <span id="viewers"></span></main>
    <script type="application/javascript">
      ${run.toString()}
      run();
    </script>
  </body>
  </html>
`;

const server = http.createServer(async (req, res) => {
  try {
    const [_, playbackId, ext] = /\/(.+)\.(.+)$/.exec(req.url);
    if (ext === "json") {
      const viewers = await getViewers(playbackId);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ viewers }));
      return;
    }

    if (ext === "html") {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(html);
      return;
    }

    // If no route present
    else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Route not found" }));
    }
  } catch (e) {
    res.writeHead(500);
    res.end(e.message);
  }
});

server.listen(1730, (err) => {
  console.log(err);
});
