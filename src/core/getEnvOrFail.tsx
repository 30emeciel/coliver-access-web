export function getEnvOrFail(key: string) {
  const val = process.env[`REACT_APP_${key}`];
  if (!val) {
    throw new Error(`Env. variable not set ${key}`);
  }
  return val;
}
