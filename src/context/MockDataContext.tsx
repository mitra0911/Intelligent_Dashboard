import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import {
  createMockData,
  DEFAULT_MOCK_SEED,
  type MockDataBundle,
  type MockScenario,
} from '../data/mockData'

type MockDataContextValue = {
  seed: number
  scenario: MockScenario
  data: MockDataBundle
  refresh: () => void
  setScenario: (s: MockScenario) => void
}

const MockDataContext = createContext<MockDataContextValue | null>(null)

function nextSeed() {
  return (Math.random() * 0x1_0000_0000) >>> 0
}

export function MockDataProvider({ children }: { children: ReactNode }) {
  const [seed, setSeed] = useState(DEFAULT_MOCK_SEED)
  const [scenario, setScenario] = useState<MockScenario>('default')
  const data = useMemo(() => createMockData(seed, { scenario }), [seed, scenario])
  const refresh = useCallback(() => {
    setSeed(nextSeed())
  }, [])

  const value = useMemo(
    () => ({ seed, scenario, data, refresh, setScenario }),
    [seed, scenario, data, refresh],
  )

  return <MockDataContext.Provider value={value}>{children}</MockDataContext.Provider>
}

export function useMockData() {
  const ctx = useContext(MockDataContext)
  if (!ctx) throw new Error('useMockData must be used within MockDataProvider')
  return ctx
}
