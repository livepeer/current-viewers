# current-viewers

Single-file JavaScript that queries Prometheus/Grafana for the current number of
viewers of a stream in a Catalyst node and exposes an overlay suitable for
including in OBS.

### Usage

```
GRAFANA_SERVICE_TOKEN="CHANGEME" \
GRAFANA_DATASOURCE_UID="CHANGEME" \
GRAFANA_QUERY_URL="https://example.com/grafana/api/ds/query" \
GRAFANA_ORG_ID="1" \
node current-viewers.mjs
```

Then you can access the overlay at http://localhost:1730/PLAYBACK_ID.html. If
you want to query the data yourself, it's at
http://localhost:1730/PLAYBACK_ID.json
