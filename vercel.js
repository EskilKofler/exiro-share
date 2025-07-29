module.exports = {
    "rewrites": [
      {
        "source": "/share/:token",
        "destination": "/api/share?token=:token"
      }
    ]
};
  