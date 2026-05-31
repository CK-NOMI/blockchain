const config = {
  webaseFront: {
    url: process.env.WEBASE_FRONT_URL || 'http://127.0.0.1:5002/WeBASE-Front',
    groupId: 1,
  },

  fisco: {
    systemPrivateKey: process.env.DEPLOYER_PRIVATE_KEY,
  },
};

export default config;
