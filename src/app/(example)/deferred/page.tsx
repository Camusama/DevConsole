import { Suspense } from 'react'
import { CountComp } from './_components/count'

const personServerFn = ({ data: name }) => {
  return { name, randomNumber: Math.floor(Math.random() * 100) }
}
const slowServerFn = async ({ data: name }) => {
  await new Promise(r => setTimeout(r, 1000))
  return { name, randomNumber: Math.floor(Math.random() * 100) }
}

const DeferredPersonComp = async () => {
  const deferredPerson = await slowServerFn({ data: 'Tanner Linsley' })
  const data = deferredPerson
  return (
    <div data-testid="deferred-person">
      {data.name} - {data.randomNumber}
    </div>
  )
}
const DeferredStuffComp = async () => {
  const deferredStuff = await new Promise<string>(r => setTimeout(() => r('Hello deferred!'), 2000))

  const data = deferredStuff
  return <h3 data-testid="deferred-stuff">{data}</h3>
}

export default async function Page() {
  const person = await personServerFn({ data: 'John Doe' })

  return (
    <div className="p-2">
      <div data-testid="regular-person">
        {person.name} - {person.randomNumber}
      </div>
      <Suspense fallback={<div>Loading person...</div>}>
        <DeferredPersonComp></DeferredPersonComp>
      </Suspense>
      <Suspense fallback={<div>Loading stuff...</div>}>
        <DeferredStuffComp></DeferredStuffComp>
      </Suspense>
      <CountComp></CountComp>
    </div>
  )
}
