const dns = require("dns");

dns.resolveSrv("_mongodb._tcp.gazijunaid07.d2hxxjg.mongodb.net", (err, addresses) => {
  if (err) {
    console.error(err);
  } else {
    console.log(addresses);
  }
});