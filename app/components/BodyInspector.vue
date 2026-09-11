<script setup lang="ts">
import type { Body, Preset } from '../physics/types'
import type { MissionReplay } from '../missions/types'
import type { sampleTrack } from '../utils/ephemeris'
import { magnitude } from '../physics/vector'
import { formatMass, formatDistance, formatReplaySpeed, formatCoordinate, formatBodyListMass } from '../utils/format'
defineProps<{ selectedBody?: Body; selectedMissionState: ReturnType<typeof sampleTrack> | null; selectedDistance: number; replay?: MissionReplay; preset: Preset; bodies: Body[] }>()
const selectedId = defineModel<string>('selectedId', { required: true })
</script>

<template>
<aside class="inspector-panel">
          <div class="panel-heading"><div><span class="section-kicker">INSPECTOR</span><h2>Selected body</h2></div><span class="panel-index">01</span></div>
          <div v-if="selectedBody" class="selected-body"><div class="selected-body-name"><span class="body-swatch" :style="{ backgroundColor: selectedBody.color }"></span><div><strong>{{ selectedBody.name }}</strong><small>{{ selectedBody.role }}</small></div></div><div class="selected-coordinates"><span>X <b>{{ formatCoordinate(selectedBody.position.x) }}</b></span><span>Y <b>{{ formatCoordinate(selectedBody.position.y) }}</b></span></div></div>
          <div class="inspector-stats"><div class="inspector-stat"><span>Mass</span><strong>{{ selectedBody ? formatMass(selectedBody.mass) : '-' }}</strong></div><div class="inspector-stat"><span>{{ replay?.distanceLabel ?? 'Distance to primary' }}</span><strong>{{ formatDistance(selectedDistance) }}</strong></div><div class="inspector-stat"><span>Velocity</span><strong>{{ selectedMissionState ? formatReplaySpeed(selectedMissionState.speed) : (selectedBody ? formatCoordinate(magnitude(selectedBody.velocity)) : '-') + ' AU / yr' }}</strong></div></div>
          <div class="panel-subheading"><span>ACTIVE BODIES</span><span>{{ bodies.length.toString().padStart(2, '0') }}</span></div>
          <div class="body-list"><button v-for="body in bodies" :key="body.id" class="body-row" :class="{ selected: body.id === selectedId }" type="button" @click="selectedId = body.id"><span class="body-row-color" :style="{ backgroundColor: body.color }"></span><span class="body-row-name">{{ body.name }}</span><span class="body-row-mass">{{ formatBodyListMass(body.mass) }}</span><span class="body-row-chevron">></span></button></div>
          <div class="inspector-note"><span class="note-mark">i</span><p>{{ replay ? replay.inspectorNote : preset.inspectorNote ? preset.inspectorNote : preset.id === 'custom' ? 'User parameters are active. Reopen Configure system to adjust this system.' : 'Preset orbits are fixed, but planet masses are randomized for each new run. Configure system to create a user-defined system.' }}</p></div>
        </aside>
</template>
