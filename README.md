# WIP: PoW Phalanx

Controller for [PoW-Shield](https://github.com/RuiSiang/PoW-Shield) that calculates and assigns the optimal difficulty via request and waf trigger distributions based on machine learning model.

Todos:

- [x] Socket connectivity with PoW Shield
- [x] Statistics synchronization
- [x] Difficulty control
- [x] Model interaction interface
- [x] Feature synchronization
- [x] Ban state synchronization
- [ ] Security model update
- [ ] Controller graphics interface

## Prerequisites

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
| phlx_ban_ip           | passive endpoint | unicast   | [ip:string, seconds: uint] | Shield signals to phalanx that a new IP is banned               |
| shld_ban_ip           | active feed      | broadcast | [ip:string, seconds: uint] | Phalanx broadcasts to shields that a new IP is banned           |
| shld_fetch_stats      | active feed      | broadcast | N/A                        | Phalanx broadcasts to shields to signal a new data push         |
| shld_set_config       | active feed      | broadcast | [key:string, value:any]    | Phalanx broadcasts to shields to set a config parameter         |
| shld_add_whitelist    | active feed      | broadcast | [token:string]             | Phalanx broadcasts to shields to add a whitelist token          |
| shld_remove_whitelist | active feed      | broadcast | [token:string]             | Phalanx broadcasts to shields to remove a whitelist token       |
| shld_update_model     | active feed      | broadcast | TBD                        | Phalanx broadcasts to shields to update the edge security model |

## Controller Channel

| Method                   | Type             | Scope     | Arguments         | Description                                                           |
| ------------------------ | ---------------- | --------- | ----------------- | --------------------------------------------------------------------- |
| phlx_override_difficulty | passive endpoint | unicast   | [difficulty:uint] | Controller asks phalanx to override difficulty                        |
| phlx_add_whitelist       | passive endpoint | unicast   | [token:string]    | Controller asks phalanx to add new whitelist token                    |
| phlx_remove_whitelist    | passive endpoint | unicast   | [token:string]    | Controller asks phalanx to remove whitelist token                     |
| phlx_update_model        | passive endpoint | unicast   | TBD               | Controller pushes edge security model to phalanx to update on shields |
| ctrl_stats               | active feed      | broadcast | TBD               | Phalanx broadcasts current stats to controller                        |

## Model Channel

| Method                 | Type             | Scope   | Arguments         | Description                                |
| ---------------------- | ---------------- | ------- | ----------------- | ------------------------------------------ |
| phlx_set_difficulty    | passive endpoint | unicast | [difficulty:uint] | Model asks phalanx to set new difficulty   |
| phlx_fetch_batch_stats | passive endpoint | unicast | [lastRow?:string] | Model requests phalanx to send batch stats |
| modl_batch_stats       | active feed      | unicast | stats:Stat[]      | Phalanx sends batch stats to model         |

## Data Formats

### Stat

"stat-type":"client-id":"ISO-Timestamp"|"count"

i.e. `ttl_req:aTqmrN0eKqaQa1nIAAAB:2022-06-14T01:55:00.014Z|10`

| stat-type | Value                   |
| --------- | ----------------------- |
| legit_req | legit request count     |
| ttl_req   | total request count     |
| bad_nonce | bad nonce request count |
| ttl_waf   | total waf triggers      |
