interface CodeTilesProps {
  code: string
}

export function CodeTiles({ code }: CodeTilesProps) {
  const characters = code.padEnd(6, ' ').slice(0, 6).split('')

  return (
    <div className="grid grid-cols-6 gap-2 md:gap-3" aria-label={`Room code ${code}`}>
      {characters.map((character, index) => (
        <div
          key={`${character}-${index}`}
          className="grid min-h-[72px] place-items-center rounded-[20px] bg-soft font-mono text-[34px] font-bold tracking-[0.12em] text-ink md:min-h-[84px] md:text-[40px]"
        >
          {character.trim()}
        </div>
      ))}
    </div>
  )
}
