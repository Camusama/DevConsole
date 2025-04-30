'use client'
import { useState } from 'react'

export const CountComp = () => {
  const [count, setCount] = useState<number>(0)

  return (
    <>
      <div>Count: {count}</div>
      <div>
        <button className="cursor-pointer" onClick={() => setCount(count + 1)}>
          Increment
        </button>
      </div>
    </>
  )
}
