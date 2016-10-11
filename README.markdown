mmcsv
===========
This is the ORIGINAL README file for Ben West's mmcsv repo. It should all still work if needed, hence I've left this in
Instructions on mmcsv640g will go up soon :-)

Scraper and Parser for Medtronic pump, cgb and connected bg meter data.

## Install
From source
```bash
$ git clone git://github.com/bewest/mmcsv.git mmcsv
$ cd mmcsv
$ npm install
```
[![Build Status](https://travis-ci.org/bewest/mmcsv.png?branch=master)](https://travis-ci.org/bewest/mmcsv)
[![Code Climate](https://codeclimate.com/github/bewest/mmcsv.png)](https://codeclimate.com/github/bewest/mmcsv)
[![Coverage Status](https://coveralls.io/repos/bewest/mmcsv/badge.svg?branch=master&service=github)](https://coveralls.io/github/bewest/mmcsv?branch=master)

[![browser support](https://ci.testling.com/bewest/mmcsv.png)](https://ci.testling.com/bewest/mmcsv)


### Test
```bash
$ make test
```

## Usage
```bash
$ mmcsv -h
Usage: mmcsv <command> [opts]

## Commands
Command is one of:

  fetch              Fetch csv from carelink.
  parse              Parse Carelink csv.
  version            Print version of this module.

  --help, -h         This help.


Options:
  --help, -h  Some more details about mmcsv
```

```bash
# set up tab completion:
$ . <(mmcsv completion)
```

```bash
$ mmcsv parse -h
### Parse
Parse Carelink CSV into JSON.

Usage: mmcsv parse <opts> [./path/to.csv|stdin]
Parser options:

     --filter=all,   -f all
     --filter=smbg,  -f smbg
     --filter=cbg,   -f cbg
     --filter=basal, -f basal
     --filter=bolus, -f bolus
     --filter=carbs, -f carbs


Options:
  --help, -h  Some more details about mmcsv

```

```bash
### Fetch
Fetch raw csv from carelink

Usage: mmcsv fetch <opts> [./path/to.csv|stdout]
Options:
  --username=, -u    Carelink username
  --password=, -p    Carelink password
  --days, -d         Number of days to fetch
  --json, -j         Output json, not csv


Options:
  --help, -h  Some more details about mmcsv

```

### Server
```bash
# random port if not set
$ PORT=4545 node server.js
$ curl localhost:4545/status
"OK@0.2.2"
```

`REST`ful server launches on port specified by environment variable `PORT`.

# Fetch

```js
var es  = require('event-stream');
// provide credentials and number of days to fetch
var opts = { username: 'my-username', password: 'my-password', days: 120 };
// configure parser readable stream
var stream = require('mmcsv').fetch(opts);
// pipe to destination
es.pipeline(stream, es.stringify( )).pipe(process.stdout);
```

# Parser

### Do stuff with readings
```js
var fs = require('fs'),
    es = require('event-stream'),
     _ = require('underscore'),
 mmcsv = require('../');

// configure incoming csv, from a file for example
var stream = fs.createReadStream('examples/upload_for_stream_tests.csv');

// create through stream which parses incoming carelink csv into json
es.pipeline(stream, mmcsv.all( ) , es.writeArray(
  function (err, readings) {
    console.log('Done parsing', readings);

    console.log("UNIQUE TYPES", _.uniq(readings,
      function (val) {
        return val.type;
      }
    ));
    console.log('Total records', readings.length);
  }
));

```

### Stream all the things
```js
if (!module.parent) {
  // console.log('run as main');
  var es = require('event-stream');

  es.pipeline(
      process.openStdin( )
    , mmcsv.all( )
    , es.stringify( )
    , process.stdout
  );
}
```

## REST server

Run a RESTful webserver that transforms POST body into json.

Starting the server:
`npm start` or `node server.js`, will bind to `PORT` environment variable.

### parser
```bash
nf -j Procfile.dev -p start
curl -vs -XPOST -H "content-type: text/plain" --data-binary @test/1days_smbg_basal_bolus_carbs.csv localhost:5445/api/parse/all
curl -vs -XPOST -H "content-type: multipart/form-data" -F file=@test/current_basal_schedule.csv localhost:5445/api/parse/all

```

```bash
curl -vs -XPOST -H "content-type: text/plain"       \
     --data-binary @test/current_basal_schedule.csv \
     localhost:5445/api/parse/all | json
* About to connect() to localhost port 5445 (#0)
*   Trying 127.0.0.1... connected
> POST /api/parse/all HTTP/1.1
> User-Agent: curl/7.22.0 (x86_64-pc-linux-gnu) libcurl/7.22.0
> OpenSSL/1.0.1 zlib/1.2.3.4 libidn/1.23 li
brtmp/2.3
> Host: localhost:5445
> Accept: */*
> content-type: text/plain
> Content-Length: 2748
> Expect: 100-continue
>
< HTTP/1.1 100 Continue
} [data not shown]
< HTTP/1.1 200 OK
< Content-Type: application/json
< Content-Length: 511
< Date: Sat, 14 Dec 2013 08:15:00 GMT
< Connection: keep-alive
<
{ [data not shown]
* Connection #0 to host localhost left intact
* Closing connection #0
[
  null,
  4,
  [
    {
      "basal": "0.8",
      "basal_type": "11345547469",
      "value": "0.8",
      "type": "basal",
      "start": "0",
      "time": "2013-09-06T00:37:23+00:00"
    },
    {
      "basal": "0.95",
      "basal_type": "11345547469",
      "value": "0.95",
      "type": "basal",
      "start": "23400000",
      "time": "2013-09-06T00:37:23+00:00"
    },
    {
      "basal": "1.1",
      "basal_type": "11345547469",
      "value": "1.1",
      "type": "basal",
      "start": "34200000",
      "time": "2013-09-06T00:37:23+00:00"
    },
    {
      "basal": "0.95",
      "basal_type": "11345547469",
      "value": "0.95",
      "type": "basal",
      "start": "50400000",
      "time": "2013-09-06T00:37:23+00:00"
    }
  ]
]
```

### generator

Generate json stream of ProfileStart (rate change events) from
schedule of rate changes.
#### Input
```
/api/gen/basal - default PREFIX
<microseconds>,<units>;
```
Where `microseconds` is microseconds since beginning of day.  And
`units` is the basal rate starting at that time.

Both of these units are the way that all Medtronic pumps report
`CurrentBasalProfile` rates.
Here is a flat rate lasting all day: `0,0.7;`.

Any number of rates can be appended, eg
Schedules always start at 0.
* **1 rate**: `0,aa;`
* **2 rates**: `0,aa;1,bb;`
* **3 rates**: `0,aa;1,bb;2,cc;`
* **4 rates**: `0,aa;1,bb;2,cc;3,dd`
* **4 rates**: `0,0.8;23400000,0.95;34200000,1.1;50400000,0.95`

The day to use is specified using `=` separator, and `when` as the
keyword.
```
when=<time>
```
`chrono-node` is being used to parse the time, so you can use things
like:
* `today`
* `yesterday`
* `tomorrow`
* `2013-12-01`

**Params**

* `before`, number of days to generate before specified time.
* `after`, number of days to generate before specified time.

Eg
```
?before=2&after=2"
?before=30&after=90"

0,0.8;23400000,0.95;34200000,1.1;50400000,0.95;when=2012-12-01
```

All values used to describe basal schedule in MM terms are allowable,
even suggested by URI spec (see [last paragraphs on
paths](http://tools.ietf.org/html/rfc3986#section-3.3)).

#### Examples


Generate rate change events for a schedule composed of 4 rates on
December 1st, 2012, along with the rates for 2 days before and after.

```bash
curl -s
"localhost:5445/api/gen/basal/0,0.8;23400000,0.95;34200000,1.1;50400000,0.95;when=2012-12-01?before=2&after=2"
| json -a -o schedule -C time rate
2012-11-28T00:00:00-08:00	0.8
2012-11-28T06:30:00-08:00	0.95
2012-11-28T09:30:00-08:00	1.1
2012-11-28T14:00:00-08:00	0.95
2012-11-29T00:00:00-08:00	0.8
2012-11-29T06:30:00-08:00	0.95
2012-11-29T09:30:00-08:00	1.1
2012-11-29T14:00:00-08:00	0.95
2012-12-01T00:00:00-08:00	0.8
2012-12-01T06:30:00-08:00	0.95
2012-12-01T09:30:00-08:00	1.1
2012-12-01T14:00:00-08:00	0.95
2012-12-02T00:00:00-08:00	0.8
2012-12-02T06:30:00-08:00	0.95
2012-12-02T09:30:00-08:00	1.1
2012-12-02T14:00:00-08:00	0.95
2012-12-03T00:00:00-08:00	0.8
2012-12-03T06:30:00-08:00	0.95
2012-12-03T09:30:00-08:00	1.1
2012-12-03T14:00:00-08:00	0.95
```

Fetch single rate:

```bash
curl -s 'localhost:5445/api/gen/basal/0,0.65;when=today;?after=1&before=1' | json -a -o schedule -C start rate
2013-12-13T00:00:00-08:00       0.65
2013-12-15T00:00:00-08:00       0.65
2013-12-16T00:00:00-08:00       0.65

```

