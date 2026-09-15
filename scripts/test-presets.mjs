import assert from 'node:assert/strict'
import { loadLaboratory, loadTsModule } from './test-support.mjs'
const { cassiniReplay } = await loadTsModule(new URL('../app/missions/cassini.ts', import.meta.url))
const { rosettaReplay } = await loadTsModule(new URL('../app/missions/rosetta.ts', import.meta.url))
const { webbReplay } = await loadTsModule(new URL('../app/missions/webb.ts', import.meta.url))
const { apolloReplay } = await loadTsModule(new URL('../app/missions/apollo.ts', import.meta.url))
const AU_KM = 149597870.7
const lab = await loadLaboratory()
assert.equal(new Set(lab.presetCatalog.map(p => p.id)).size, 10)
for (const [id, replay] of Object.entries({ cassini:cassiniReplay, rosetta:rosettaReplay, webb:webbReplay, apollo11:apolloReplay })) {
  for (const rows of Object.values(replay.tracks)) {
    assert.ok(rows.length > 1)
    for (let i=0;i<rows.length;i++) {
      assert.equal(rows[i].length,7)
      assert.ok(rows[i].every(Number.isFinite))
      if(i)assert.ok(rows[i][0]>rows[i-1][0])
    }
  }
  lab.selectPreset(id)
  assert.equal(lab.selectedBodyId.value,id)
  assert.equal(lab.simulation.value.bodies.length,replay.bodies.length)
  assert.equal(lab.activeReplayView.value.id,replay.views[0].id)
  const initial={...lab.simulation.value.bodies.find(body=>body.id===id).position}
  const dt=lab.presetCatalog.find(p=>p.id===id).dt
  lab.integrate(dt)
  assert.notDeepEqual(lab.simulation.value.bodies.find(body=>body.id===id).position,initial)
  for(const event of replay.missions[0].events) {
    assert.ok(event.years>=0 && event.years<=replay.years)
    lab.seekMission(event.years,id)
    assert.equal(lab.isRunning.value,false)
    assert.equal(lab.selectedMissionState.value.distance,replay.sample(id,event.years).distance)
    for(const view of replay.views) {
      lab.setReplayView(view.id)
      const expected=view.project(replay.sample(id,event.years).position3D,replay.start+event.years*365.25)
      assert.deepEqual({...lab.simulation.value.bodies.find(body=>body.id===id).position},expected)
      assert.equal(lab.simulation.value.elapsed,event.years,'Changing views preserves mission time')
      assert.equal(lab.isRunning.value,false)
      for(const trackId of Object.keys(replay.tracks)) {
        const rows=replay.tracks[trackId]
        for(const i of [0,Math.floor(rows.length/2),rows.length-1]) {
          assert.deepEqual(view.tracks[trackId][i],view.project(rows[i].slice(1,4),rows[i][0]),'Rendered route uses the same frame as current bodies')
        }
      }
    }
  }
  // Render each view through the real canvas functions and reject invalid geometry.
  const labels=[]
  const context=new Proxy({}, { get(_,name) {
    if(name==='createRadialGradient')return()=>({addColorStop(){}})
    if(name==='fillText')return label=>labels.push(label)
    return(...args)=>{if(['moveTo','lineTo','arc','ellipse'].includes(name))assert.ok(args.filter(x=>typeof x==='number').every(Number.isFinite))}
  }, set(){return true} })
  lab.canvas.value={getContext:()=>context}
  lab.canvasSize.value={width:800,height:500,dpr:1}
  lab.setReplayView('system')
  lab.draw()
  assert.ok(labels.includes(replay.bodies.find(body=>body.id===id).name))
  if(id==='webb')assert.ok(labels.includes('L2 (approx.)'))
  lab.canvas.value=null
  lab.isRunning.value=true
  lab.integrate(100)
  assert.equal(lab.simulation.value.elapsed,replay.years)
  assert.equal(lab.isRunning.value,false)
  lab.resetSimulation()
  lab.setReplayView(replay.views[0].id)
  assert.equal(lab.simulation.value.elapsed,0)
  assert.deepEqual({...lab.simulation.value.bodies.find(body=>body.id===id).position},initial)
  console.log(`${id}: data, events, coordinate frames, rendering, endpoint and reset passed`)
}
const cassiniDistances=cassiniReplay.tracks.cassini.map(r=>Math.hypot(...r.slice(1,4))*AU_KM)
const dives=cassiniDistances.filter((d,i)=>i>0 && i<cassiniDistances.length-1 && d<cassiniDistances[i-1] && d<cassiniDistances[i+1])
assert.equal(dives.length,22)
assert.ok(dives.every(d=>d>60000 && d<75000))
assert.ok(cassiniDistances.at(-1)<65000)
assert.ok(Math.abs(rosettaReplay.sample('rosetta',0).distance*AU_KM-100)<10)
assert.ok(rosettaReplay.sample('rosetta',rosettaReplay.years).distance*AU_KM<3)
assert.equal(apolloReplay.date(0), '1969-07-16 16:22 UTC')
assert.equal(apolloReplay.date(apolloReplay.years), '1969-07-24 16:35 UTC')
assert.ok(!lab.presetCatalog.some(p=>p.id==='apollo13'))
assert.ok(apolloReplay.missions[0].events.some(e=>e.label==='Eagle lands' && e.date==='1969-07-20 20:17:43 UTC'))
// Columbia must stay above the surface throughout the lunar stay, including
// Eagle's landing; a renamed free-return flyby cannot satisfy this check.
const orbitStart=apolloReplay.dateToYears('1969-07-19T17:27:48Z')
const orbitEnd=apolloReplay.dateToYears('1969-07-22T04:55:42.3Z')
for(let years=orbitStart;years<=orbitEnd;years+=300/(365.25*86400)) {
  const apollo=apolloReplay.sample('apollo11',years), moon=apolloReplay.sample('moon',years)
  const radius=Math.hypot(...apollo.position3D.map((x,i)=>x-moon.position3D[i]))*AU_KM
  assert.ok(radius>1737 && radius<2100, `Columbia lunar radius: ${radius}`)
}
assert.ok(apolloReplay.sample('apollo11',0).distance*AU_KM<7000)
assert.ok(apolloReplay.sample('apollo11',apolloReplay.years).distance*AU_KM<6600)
const halo=webbReplay.missions[0].events.find(e=>e.label==='Halo orbit insertion')
assert.ok(webbReplay.sample('webb',halo.years).distance*AU_KM>1300000)
assert.ok(webbReplay.sample('webb',halo.years).distance*AU_KM<1600000)

for(const [a,b] of [[1,.65],[.2,2.5],[2.5,.2],[1,1]]) {
  lab.binaryPrimaryMass.value=a;lab.binaryCompanionMass.value=b
  lab.selectPreset('binary')
  const [first,second]=lab.simulation.value.bodies
  assert.ok(Math.abs(Math.hypot(first.position.x,first.position.y)/Math.hypot(second.position.x,second.position.y)-b/a)<1e-10)
  for(let i=0;i<2000;i++)lab.integrate(.0005)
  assert.ok(Math.abs(lab.energyDrift.value)<.001)
  const [x,y]=lab.simulation.value.bodies
  assert.ok(Math.hypot(a*x.position.x+b*y.position.x,a*x.position.y+b*y.position.y)<1e-9)
}
lab.isRunning.value=true
lab.updateBinaryMasses()
assert.equal(lab.isRunning.value,true)
assert.equal(lab.simulation.value.elapsed,0)
lab.selectPreset('figure-eight')
const initial=lab.simulation.value.bodies.map(body=>({...body.position}))
const period=6.32591398/(2*Math.PI), steps=4000
for(let i=0;i<steps;i++)lab.integrate(period/steps)
assert.ok(Math.abs(lab.energyDrift.value)<.001)
lab.simulation.value.bodies.forEach((body,i)=>{
  assert.ok(Math.hypot(body.position.x-initial[i].x,body.position.y-initial[i].y)<.0001)
  assert.equal(body.trail.length,700)
})
console.log('22 Cassini dives, Rosetta touchdown, Apollo 11 lunar orbit, Webb arrival, binary mass ratios and figure-eight periodicity passed.')
