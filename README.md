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

## Endpoints

The following are implemented with standard socket.io protocol. Base url is designated as endpoint, and `message` as the event. Calls are standarized in the following format:

```JSON
{
  "method": "call-method",
  "arguments": ["array-of-parameters"],
}
```

### Subscription Endpoints

// Documentation in progress

### Controller Endpoints

// Documentation in progress

### Model Endpoints

#### Set Difficulty

Method: `set_difficulty`
Arguments: [difficulty]

| Argument   | Type   | Description                     |
| ---------- | ------ | ------------------------------- |
| difficulty | number | difficulty to set on PoW Shield |

Response: N/A

#### Fetch Batch Stats

Method: `fetch_batch_stats`
Arguments: N/A

Response: stats

| Argument | Type     | Description                                 |
| -------- | -------- | ------------------------------------------- |
| stats    | string[] | array of redis entries (`key\|value`) |
