
function getConfig() {
  return require(`../config/${process.env.NODE_ENV}.json`);
}

const config = getConfig()

export const REGION = config.REGION;
export const LOG_RETENTION = config.LOG_RETENTION;
export const ENVIRONMENT = config.ENVIRONMENT;
export const GIT_BRANCH = config.GIT_BRANCH;





