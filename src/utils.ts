import adjectives from 'threewords/data/adjectives.json'
import nouns from 'threewords/data/nouns.json'

export function randomThreeWords(): string {
  const ints = new Uint32Array(3)
  crypto.getRandomValues(ints)
  const one = adjectives[ints[0] % adjectives.length]
  const two = adjectives[ints[1] % adjectives.length]
  const three = nouns[ints[2] % nouns.length]
  return `${one}-${two}-${three}`.toLowerCase()
}
