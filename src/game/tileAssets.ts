const tileArtworkModules = import.meta.glob<string>(
  '../assets/tiles/tile-*.png',
  {
    eager: true,
    import: 'default',
    query: '?url',
  },
)

const tileArtworkByNumber = new Map<number, string>()

for (const [path, url] of Object.entries(tileArtworkModules)) {
  const match = path.match(/tile-(\d{2})\.png$/i)
  if (!match) continue

  const tileNumber = Number(match[1])
  if (tileNumber < 1 || tileNumber > 63) continue

  tileArtworkByNumber.set(tileNumber, url)
}

export function getTileArtworkUrl(tileNumber: number): string | undefined {
  return tileArtworkByNumber.get(tileNumber)
}
