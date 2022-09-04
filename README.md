# PoW Phalanx

Controller for [PoW-Shield](https://github.com/RuiSiang/PoW-Shield) that calculates and assigns the optimal difficulty via request and waf trigger distributions based on machine learning model.

User interface for PoW-Phalanx can be found at [PoW-Phalanx Controller UI](https://github.com/RuiSiang/PoW-Phalanx-Controller-UI)

Todos:

- [x] Socket connectivity with PoW Shield
- [x] Statistics synchronization
- [x] Difficulty control
- [x] Model interaction interface
- [x] Feature synchronization
- [x] Ban state synchronization
- [x] Controller graphics interface
- [ ] Security model update
- [ ] Unit test

## Prerequisites

Docker ^19.0.0
Nodejs ^14.0.0

## Configuration

- nodejs: .env (example: .env.example)
- docker-compose: docker-compose.yaml (example: docker-compose.example.yaml)
- docker run: -e parameter

### Environmental Variables

| Variable                      | Default                 | Description                                                                                  |
| ----------------------------- | ----------------------- | -------------------------------------------------------------------------------------------- |
| PORT                          | 6000                    | port for phalanx instance                                                                    |
| DATABASE_HOST                 | 127.0.0.1               | host for redis database                                                                      |
| DATABASE_PORT                 | 6379                    | port for redis database                                                                      |
| DATABASE_PASSWORD             |                         | password for redis database                                                                  |
| SUBSCRIPTION_TOKEN            | test-subscription-token | token for access to subscription endpoint                                                    |
| CONTROLLER_TOKEN              | test-controller-token   | token for access to controller endpoint                                                      |
| MODEL_TOKEN                   | test-model-token        | token for access to model endpoint                                                           |
| CONTROLLER_BROADCAST_INTERVAL | 20                      | interval(seconds) for phalanx to broadcast controller stats                                  |
| STAT_FETCH_INTERVAL           | 10                      | interval(seconds) for phalanx to broadcast fetch directive to subscibed pow-shield instances |
| STAT_KEEP_HISTORY_TIME        | 3600                    | length(seconds) for phalanx to keep history fetched from pow-shield instances                |
| RESOURCE_MONITOR              | off                     | connect to resource monitor on backend                                                       |
| RESOURCE_MONITOR_HOST         |                         | resource monitor host                                                                        |
| RESOURCE_MONITOR_PORT         |                         | resource monitor port                                                                        |
| SETTINGS_FETCH                | off                     | fetch settings dump alongside batch stats                                                    |
| RESTFUL                       | on                      | enable restful api                                                                           |
| RESTFUL_PORT                  | 9000                    | port for restful api                                                                         |

## Usage

```
# Clone repository
git clone https://github.com/RuiSiang/PoW-Phalanx.git

# Install dependencies
npm install

# Configure settings
cp -n .env.example .env
# Edit .env
nano .env

# Transpile
npm run build

#############################################
# Set up redis server as database           #
# install redis first                       #
# sudo apt-get install redis-server         #
#############################################
npm start
```

## Subscriptions

Default endpoint: `http://localhost:6000?token=token-for-type`

The following are implemented with standard socket.io protocol. Base url is designated as endpoint, and `message` as the event. Calls are standarized in the following format:

```JSON
{
  "method": "call-method",
  "arguments": ["array-of-parameters"],
}
```

Passive endpoints consume a call and return data (call handled by phalanx socket server), active feeds emit a call to the client (call not handled by phalanx socket server).

## Subscription Channel

| Method                | Type             | Scope     | Arguments                  | Description                                                     |
| --------------------- | ---------------- | --------- | -------------------------- | --------------------------------------------------------------- |
| phlx_update_stats     | passive endpoint | unicast   | stats:Stat[]               | Shield pushes new data to phalanx                               |
| phlx_update_settings  | passive endpoint | unicast   | stats:Config               | Shield pushes new settings dump to phalanx                      |
| phlx_ban_ip           | passive endpoint | unicast   | [ip:string, seconds: uint] | Shield signals to phalanx that a new IP is banned               |
| shld_ban_ip           | active feed      | broadcast | [ip:string, seconds: uint] | Phalanx broadcasts to shields that a new IP is banned           |
| shld_fetch_stats      | active feed      | broadcast | N/A                        | Phalanx broadcasts to shields to signal a new data push         |
| shld_fetch_settings   | active feed      | broadcast | N/A                        | Phalanx broadcasts to shields to signal a new settings dump     |
| shld_set_config       | active feed      | broadcast | [key:string, value:any]    | Phalanx broadcasts to shields to set a config parameter         |
| shld_add_whitelist    | active feed      | broadcast | [token:string]             | Phalanx broadcasts to shields to add a whitelist token          |
| shld_remove_whitelist | active feed      | broadcast | [token:string]             | Phalanx broadcasts to shields to remove a whitelist token       |
| shld_update_model     | active feed      | broadcast | TBD                        | Phalanx broadcasts to shields to update the edge security model |

## Controller Channel

| Method                   | Type             | Scope     | Arguments                           | Description                                                           |
| ------------------------ | ---------------- | --------- | ----------------------------------- | --------------------------------------------------------------------- |
| phlx_override_difficulty | passive endpoint | unicast   | [difficulty:uint]                   | Controller asks phalanx to override difficulty                        |
| phlx_add_whitelist       | passive endpoint | unicast   | [token:string]                      | Controller asks phalanx to add new whitelist token                    |
| phlx_remove_whitelist    | passive endpoint | unicast   | [token:string]                      | Controller asks phalanx to remove whitelist token                     |
| phlx_update_model        | passive endpoint | unicast   | TBD                                 | Controller pushes edge security model to phalanx to update on shields |
| ctrl_stats               | active feed      | broadcast | {stats:Stat[], whitelist: string[]} | Phalanx broadcasts current stats to controller                        |

## Model Channel

| Method                 | Type             | Scope     | Arguments         | Description                                         |
| ---------------------- | ---------------- | --------- | ----------------- | --------------------------------------------------- |
| phlx_set_difficulty    | passive endpoint | unicast   | [difficulty:uint] | Model asks phalanx to set new difficulty            |
| phlx_fetch_batch_stats | passive endpoint | unicast   | [lastRow?:string] | Model requests phalanx to send batch stats          |
| modl_batch_stats       | active feed      | unicast   | stats:Stat[]      | Phalanx sends batch stats to model                  |
| modl_backend_stats     | active feed      | broadcast | util:ResourceUtil | Phalanx redirects resource monitor stats on backend |
| modl_settings          | active feed      | broadcast | config:Config     | Phalanx sends settings dump to model                |

## Data Formats

### Stat

"stat-type":"client-id":"ISO-Timestamp"|"count"

i.e. `ttl_req:aTqmrN0eKqaQa1nIAAAB:2022-06-14T01:55:00.014Z|10`

| stat-type      | Value                                | Unit         |
| -------------- | ------------------------------------ | ------------ |
| legit_req      | accumulative legit request count     | count        |
| ttl_req        | accumulative total request count     | count        |
| bad_nonce      | accumulative bad nonce request count | count        |
| ttl_waf        | accumulative waf trigger count       | count        |
| ttl_solve_time | accumulated time of solved problems  | milliseconds |
| prob_solved    | number of problems solved            | count        |

### ResourceUtil

i.e.

```json
{
  "cpuUtil": "0.27",
  "memUtil": "14.22",
  "uptime": "350"
}
```

| stat-type | Value                        |
| --------- | ---------------------------- |
| cpuUtil   | CPU utilization (percentage) |
| memUtil   | RAM utilization (percentage) |
| uptime    | machine uptime (seconds)     |

## Restful API for Model

### GET /stats?token=model-token

Description: Get stats for model training

Request:

- Params: N/A
- Query:
  - token: token for model connection (same as the one for socket)

Response:

- instances: object of stat entry arrays organized by client id and stat type (see example)
- settings: object of setting configurations for each client
- backend: resource stats on the backend site

Example Request

```
curl http://pow-phalanx:9000/stats?token=test-model-token
```

Example Response

```JSON
{
  "instances": {
    "Do4a-RmsY-0zJmFeAAAB": {
      "legit_req": ["1", "13", "22", "22", "23", "24", "24", "24", "24"],
      "ttl_req": ["4", "16", "25", "27", "29", "30", "30", "31", "31"],
      "bad_nonce": ["0", "0", "0", "0", "0", "0", "0", "0", "0"],
      "ttl_waf": ["0", "0", "0", "0", "0", "0", "0", "1", "1"],
      "ttl_solve_time": ["2544", "2544", "2544", "2544", "4647", "4647", "4647", "4647", "4647"],
      "prob_solved": ["1", "1", "1", "1", "2", "2", "2", "2", "2"]
    }
  },
  "settings": [
    {
      "settings:Do4a-RmsY-0zJmFeAAAB": "{\"session_key\":\"abcdefghijklmnop\",\"pow\":true,\"nonce_validity\":60000,\"difficulty\":13,\"backend_url\":\"http://webapp:80\",\"database_host\":\"redis1\",\"database_port\":6379,\"database_password\":\"\",\"rate_limit\":true,\"rate_limit_sample_minutes\":60,\"rate_limit_session_threshold\":100,\"rate_limit_ban_ip\":true,\"rate_limit_ip_threshold\":500,\"rate_limit_ban_minutes\":15,\"waf\":true,\"waf_url_exclude_rules\":\"\",\"waf_header_exclude_rules\":\"14,33,80,96,100\",\"waf_body_exclude_rules\":\"\",\"ssl\":false,\"ssl_cert_path\":\"tests/ssl/mock-cert.pem\",\"ssl_key_path\":\"tests/ssl/mock-key.pem\",\"socket\":true,\"socket_url\":\"http://pow-phalanx:6000\",\"socket_token\":\"test-subscription-token\"}"
    }
  ],
  "backend": "\"{\\\"cpuUtil\\\":\\\"0.30\\\",\\\"memUtil\\\":\\\"21.78\\\",\\\"uptime\\\":\\\"2591\\\"}\""
}
```

### GET /set?token=model-token&difficulty=difficulty

Description: Get stats for model training

Request:

- Params: N/A
- Query:
  - token: token for model connection (same as the one for socket)
  - difficulty: difficulty to set (integer)

Response:

- 200: OK
- 400: Invalid

Example Request

```
curl http://pow-phalanx:9000/set?token=test-model-token&difficulty=13
```

Example Response

`200 OK`
