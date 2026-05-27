import { useStore } from '@/store/useStore'
import { Button } from '@/components/ui/button'

function App() {
  const { count, increment, decrement } = useStore()

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-8">
      <h1 className="text-4xl font-bold">The Fretboard Game</h1>
      <p className="text-muted-foreground">Ready to build!</p>
      <div className="flex items-center gap-4">
        <Button onClick={decrement} variant="outline">-</Button>
        <span className="text-2xl font-mono tabular-nums min-w-[3ch] text-center">{count}</span>
        <Button onClick={increment} variant="outline">+</Button>
      </div>
    </div>
  )
}

export default App
