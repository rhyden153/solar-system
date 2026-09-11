<script setup lang="ts">
defineProps<{ isReplay: boolean; zoomLevel: number }>()
const emit = defineEmits<{ step: []; reset: []; zoom: [multiplier: number] }>()
const isRunning = defineModel<boolean>('isRunning', { required: true })
const speed = defineModel<number>('speed', { required: true })
const showTrails = defineModel<boolean>('showTrails', { required: true })
const showGuides = defineModel<boolean>('showGuides', { required: true })
const showInspector = defineModel<boolean>('showInspector', { required: true })
const showTelemetry = defineModel<boolean>('showTelemetry', { required: true })
const focusMode = defineModel<boolean>('focusMode', { required: true })
</script>

<template>
<div class="controlbar">
        <div class="transport-controls"><button class="run-button" type="button" title="Run or pause (Space)" @click="isRunning = !isRunning"><span class="control-symbol">{{ isRunning ? '||' : '>' }}</span>{{ isRunning ? 'Pause' : 'Run' }}</button><button class="secondary-button" type="button" @click="emit('step')"><span class="control-symbol">>|</span>Step</button><button class="secondary-button" type="button" @click="emit('reset')"><span class="control-symbol">R</span>Reset</button></div>
        <div class="control-divider"></div>
        <div class="speed-control"><label class="control-label" for="speed-slider" title="Adjust with + and -">SPEED</label><input id="speed-slider" v-model.number="speed" class="speed-slider" type="range" min="1" max="20" step="1" aria-label="Simulation speed" title="Adjust speed (+ / -)"><output class="speed-value" for="speed-slider">{{ speed }}x</output></div>
        <div class="display-controls"><button class="display-toggle" :class="{ enabled: showTrails }" type="button" @click="showTrails = !showTrails"><span class="toggle-mark"></span>Trails</button><button class="display-toggle" :class="{ enabled: showGuides }" type="button" @click="showGuides = !showGuides"><span class="toggle-mark ring"></span>Guides</button><button class="display-toggle" :class="{ enabled: showInspector }" type="button" @click="showInspector = !showInspector"><span class="toggle-mark panel-mark"></span>Inspector</button><button v-if="!isReplay" class="display-toggle" :class="{ enabled: showTelemetry }" type="button" @click="showTelemetry = !showTelemetry"><span class="toggle-mark panel-mark"></span>Metrics</button><button class="focus-button" type="button" title="Toggle canvas zoom (Enter)" @click="focusMode = !focusMode">{{ focusMode ? 'Exit Zoom' : 'Zoom canvas' }}</button><div class="zoom-control"><button type="button" aria-label="Zoom out" title="Zoom out" @click="emit('zoom', .8)">-</button><span>{{ Math.round(zoomLevel * 100) }}%</span><button type="button" aria-label="Zoom in" title="Zoom in" @click="emit('zoom', 1.25)">+</button></div></div>
      </div>
</template>
