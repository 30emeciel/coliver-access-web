export function zip<T,U>(a:T[], b:U[]) {
  return a.map((k, i) => [k, b[i]] as [T, U])
}
