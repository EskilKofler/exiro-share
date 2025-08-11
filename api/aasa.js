export default function handler(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.status(200).send({
      applinks: {
        apps: [],
        details: [
          { appID: 'M8D4P9DUD5.com.exiro.app', paths: ['/share/*'] }
        ]
      }
    });
  }
  