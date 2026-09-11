import { writeFile } from 'node:fs/promises'
import { horizons, julianDay, AU_KM } from './horizons.mjs'
import { sampleTrack } from '../app/utils/ephemeris.ts'

// Educational Columbia reconstruction anchored to NASA MSC-00171, tables 7-II/7-VII.
// Lunar orbit and finite burns are simplified; Eagle is represented by timeline events.
// This is not an as-flown spacecraft ephemeris. See app/data/README.md.
const launch = Date.parse('1969-07-16T13:32:00Z')
const get = text => text.split(':').map(Number).reduce((value, part) => value * 60 + part)
const dateAt = seconds => new Date(launch + seconds * 1000).toISOString()
const dayAt = seconds => julianDay(dateAt(seconds))
const startSeconds = get('2:50:13.2')
const endSeconds = get('195:03:05.7')
const { rows: moon } = await horizons('301', '500@399', '1969-07-16T00:00:00Z', '1969-07-25T00:00:00Z', '5m', 'FRAME')
const rad = value => value * Math.PI / 180
const add = (a,b) => a.map((x,i) => x+b[i])
const sub = (a,b) => a.map((x,i) => x-b[i])
const mul = (a,s) => a.map(x => x*s)
const dot = (a,b) => a.reduce((s,x,i) => s+x*b[i],0)
const unit = a => mul(a,1/Math.hypot(...a))
const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]
const rotateZ = (p,a) => [p[0]*Math.cos(a)-p[1]*Math.sin(a),p[0]*Math.sin(a)+p[1]*Math.cos(a),p[2]]
function moonState(seconds) {
  const state = sampleTrack(moon,dayAt(seconds))
  return [...mul(state.position3D,AU_KM),...mul(state.velocity3D,AU_KM/(365.25*86400))]
}
function precess(p,day) {
  const T=(day-2451545)/36525, t=-T
  const zeta=rad(((2306.2181+1.39656*T-0.000139*T*T)*t+(0.30188-0.000344*T)*t*t+0.017998*t*t*t)/3600)
  const z=rad(((2306.2181+1.39656*T-0.000139*T*T)*t+(1.09468+0.000066*T)*t*t+0.018203*t*t*t)/3600)
  const theta=rad(((2004.3109-0.85330*T-0.000217*T*T)*t-(0.42665+0.000217*T)*t*t-0.041833*t*t*t)/3600)
  const a=rotateZ(p,zeta)
  return rotateZ([Math.cos(theta)*a[0]-Math.sin(theta)*a[2],a[1],Math.sin(theta)*a[0]+Math.cos(theta)*a[2]],z)
}
function reportState(time, latitude, longitude, altitudeNm, speedFps, gamma, heading, reference='earth') {
  const seconds=get(time), day=dayAt(seconds), lat=rad(latitude), lon=rad(longitude)
  const up=[Math.cos(lat)*Math.cos(lon),Math.cos(lat)*Math.sin(lon),Math.sin(lat)]
  const north=[-Math.sin(lat)*Math.cos(lon),-Math.sin(lat)*Math.sin(lon),Math.cos(lat)]
  const east=[-Math.sin(lon),Math.cos(lon),0]
  const v=mul(add(mul(up,Math.sin(rad(gamma))),mul(add(mul(north,Math.cos(rad(heading))),mul(east,Math.sin(rad(heading)))),Math.cos(rad(gamma)))),speedFps*0.0003048)
  if(reference==='moon') {
    const basis=moonBasis(seconds), m=moonState(seconds)
    const transform=p=>add(add(mul(basis[0],p[0]),mul(basis[1],p[1])),mul(basis[2],p[2]))
    return { seconds, state:[...add(m.slice(0,3),transform(mul(up,1735.4+altitudeNm*1.852))),...add(m.slice(3),transform(v))] }
  }
  const eccentricitySq=0.00669438, N=6378.137/Math.sqrt(1-eccentricitySq*Math.sin(lat)**2), h=altitudeNm*1.852
  const p=[(N+h)*up[0],(N+h)*up[1],(N*(1-eccentricitySq)+h)*up[2]]
  const T=(day-2451545)/36525
  const gmst=rad((280.46061837+360.98564736629*(day-2451545)+0.000387933*T*T-T*T*T/38710000)%360)
  return {seconds,state:[...precess(rotateZ(p,gmst),day),...precess(rotateZ(v,gmst),day)]}
}
function moonBasis(seconds) {
  const z=[Math.cos(rad(66.5392))*Math.cos(rad(269.9949)),Math.cos(rad(66.5392))*Math.sin(rad(269.9949)),Math.sin(rad(66.5392))]
  const towardEarth=mul(moonState(seconds).slice(0,3),-1)
  const x=unit(sub(towardEarth,mul(z,dot(towardEarth,z))))
  return [x,cross(z,x),z]
}
const lunarStart=get('75:55:48.0'), lunarEnd=get('135:23:42.3')
const anchors=[
  reportState('2:50:13.2',9.98,-164.84,180.6,35546,7.37,60.07),
  reportState('3:17:04.6',31.16,-88.76,4110.9,24456.8,46.24,95.10),
  reportState('4:40:04.7',21.16,-68.46,16627.3,14663,64.25,113.74),
  reportState('26:45:01.8',6,-11.17,109477.2,5010,76.88,120.87),
  reportState('75:49:50.4',-1.57,-169.58,86.7,8250,-9.99,-62.80,'moon'),
  reportState('75:55:48.0',0.16,167.13,60.1,5479,-0.20,-66.89,'moon'),
  reportState('80:11:36.8',-0.02,170.09,61.8,5477.3,-0.49,-66.55,'moon'),
  reportState('80:11:53.5',-0.02,169.16,61.6,5338.3,0.32,-66.77,'moon'),
  reportState('100:12:00.0',1.11,116.21,62.9,5333.8,0.16,-89.13,'moon'),
  reportState('135:23:42.3',-0.16,164.02,52.4,5376,-0.03,-62.77,'moon'),
  reportState('135:26:13.7',0.50,154.02,58.1,8589,5.13,-62,'moon'),
  reportState('150:30:07.4',-13.16,-37.83,169080.6,4074,-80.41,129.30),
  reportState('194:49:12.7',-35.09,122.54,1778.3,29615.5,-35.26,69.27),
  reportState('195:03:05.7',-3.19,171.96,65.8,36194.4,-6.48,50.18),
].sort((a,b)=>a.seconds-b.seconds)
function derivative(t,state) {
  const p=state.slice(0,3), mp=moonState(t).slice(0,3), delta=sub(mp,p)
  const acceleration=add(mul(p,-398600.4418/Math.hypot(...p)**3),mul(sub(mul(delta,1/Math.hypot(...delta)**3),mul(mp,1/Math.hypot(...mp)**3)),4902.800066))
  return [...state.slice(3),...acceleration]
}
function step(t,s,h) {
  const k1=derivative(t,s), k2=derivative(t+h/2,add(s,mul(k1,h/2))), k3=derivative(t+h/2,add(s,mul(k2,h/2))), k4=derivative(t+h,add(s,mul(k3,h)))
  return s.map((x,i)=>x+h/6*(k1[i]+2*k2[i]+2*k3[i]+k4[i]))
}
const rows=[]
for(let i=0;i<anchors.length-1;i++) {
  const a=anchors[i], b=anchors[i+1], count=Math.ceil((b.seconds-a.seconds)/30), h=(b.seconds-a.seconds)/count
  const forwards=[a.state], backwards=Array(count+1)
  backwards[count]=b.state
  for(let j=1;j<=count;j++)forwards.push(step(a.seconds+(j-1)*h,forwards[j-1],h))
  for(let j=count-1;j>=0;j--)backwards[j]=step(a.seconds+(j+1)*h,backwards[j+1],-h)
  for(let j=0;j<count;j++) {
    const t=a.seconds+j*h, u=j/count, w=6*u**5-15*u**4+10*u**3, wd=(30*u**4-60*u**3+30*u*u)/(b.seconds-a.seconds)
    const f=forwards[j], back=backwards[j]
    const position=f.slice(0,3).map((x,k)=>(1-w)*x+w*back[k])
    const velocity=f.slice(3).map((x,k)=>(1-w)*x+w*back[k+3]+wd*(back[k]-f[k]))
    // Retain dense samples near Earth and the Moon, five-minute samples on coasts.
    if(j===0 || (t>=lunarStart-3*3600 && t<=lunarEnd+3*3600) || Math.hypot(...position)<50000 || j%10===0) rows.push([dayAt(t),...mul(position,1/AU_KM),...mul(velocity,86400/AU_KM)])
  }
}
rows.push([dayAt(endSeconds),...mul(anchors.at(-1).state.slice(0,3),1/AU_KM),...mul(anchors.at(-1).state.slice(3),86400/AU_KM)])
const states={apollo11:rows,moon:moon.filter(row=>row[0]>=dayAt(startSeconds) && row[0]<=dayAt(endSeconds))}
// Include exact boundaries for the lunar reference track.
for(const t of [startSeconds,endSeconds]){const m=moonState(t);states.moon.push([dayAt(t),...mul(m.slice(0,3),1/AU_KM),...mul(m.slice(3),86400/AU_KM)])}
states.moon.sort((a,b)=>a[0]-b[0])
await writeFile(new URL('../app/data/apollo11.json',import.meta.url),JSON.stringify({start:dateAt(startSeconds),end:dateAt(endSeconds),source:'https://www.nasa.gov/wp-content/uploads/static/apollo50th/pdf/A11_MissionReport.pdf',method:'Educational Columbia reconstruction; NASA MSC-00171 trajectory anchors and JPL Moon states. Earth/Moon point-mass propagation blended between anchors. Lunar orbit, libration and finite burns are simplified; Eagle descent and ascent are not modeled. Ends at entry interface, before atmospheric flight.',states}))
await writeFile(new URL('../app/data/apollo11-anchors.json',import.meta.url),JSON.stringify({source:'NASA MSC-00171, Tables 7-II and 7-VII',frame:'Earth-centered ICRF approximation; kilometers and kilometers/second',anchors},null,2))
console.log(`Apollo 11: ${rows.length} reconstructed states, ${anchors.length} anchors`)
