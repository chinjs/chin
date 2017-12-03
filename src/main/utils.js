// @flow
import { extname, sep } from 'path'

export const extstr = (pathstring: string) => extname(pathstring).slice(1)

export const dirReplace = (
  target: string,
  source: string,
  compare: string
): string => {
  const sources = source.split(sep)
  const spoiles = target.split(sep).filter((tar, index) => !sources[index])
  return compare
    .split(sep)
    .concat(spoiles)
    .join(sep)
}

export const throwIf = (target: any, type: string, key: string): void => {
  if (type && typeof target !== type) {
    throw new TypeError(`${key} is ${typeof target}`)
  }
}
