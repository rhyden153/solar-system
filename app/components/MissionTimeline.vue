<script setup lang="ts">
import type { MissionReplay } from '../missions/types'
defineProps<{ replay: MissionReplay; title: string; elapsed: number; dt: number }>()
const emit = defineEmits<{ seek: [years: number, spacecraft?: string] }>()
</script>

<template>
<section class="mission-timeline" :aria-label="title + ' mission timeline'">
        <div class="mission-timeline-heading"><label for="mission-date">MISSION DATE / {{ replay.date(elapsed) }}</label><span>{{ replay.date(0).slice(0, 4) }}–{{ replay.date(replay.years).slice(0, 4) }} · 2D projection</span></div>
        <input id="mission-date" type="range" min="0" :max="replay.years" :step="replay.showTime ? Math.min(dt / 4, replay.years / 5000) : 0.0001" :value="elapsed" :aria-valuetext="replay.date(elapsed)" @input="emit('seek', Number(($event.target as HTMLInputElement).value))">
        <div v-for="mission in replay.missions" :key="mission.id" class="mission-track" :style="{ '--mission-color': mission.color }" role="group" :aria-label="mission.name + ' timeline'">
          <h3><i></i>{{ mission.name }}<small>{{ replay.available(mission.id, elapsed) ? 'Flight path' : 'Awaiting departure' }}</small></h3>
          <div class="mission-events"><button v-for="event in mission.events" :key="event.date" type="button" @click="emit('seek', event.years, mission.id)">{{ event.label }}<small>{{ event.date }}</small></button></div>
        </div>
        <p><a :href="replay.source?.url ?? 'https://ssd.jpl.nasa.gov/horizons/'" target="_blank" rel="noreferrer">{{ replay.source?.label ?? 'NASA/JPL Horizons' }}</a> · {{ replay.note }}</p>
      </section>
</template>
