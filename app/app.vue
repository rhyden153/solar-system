<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
import { useLaboratory } from './composables/useLaboratory'
import MissionTimeline from './components/MissionTimeline.vue'
import BodyInspector from './components/BodyInspector.vue'
import TransportControls from './components/TransportControls.vue'
import SystemConfigurator from './components/SystemConfigurator.vue'

const {
  binaryPrimaryMass,
  binaryCompanionMass,
  presetCatalog,
  pendingPresetId,
  presetError,
  manualPlanetCount,
  configOpen,
  configError,
  showInspector,
  showTelemetry,
  focusMode,
  editableBodies,
  activePresetId,
  activePreset,
  simulation,
  isRunning,
  speed,
  showTrails,
  showGuides,
  selectedBodyId,
  canvas,
  stage,
  selectedBody,
  activeReplay,
  isReplay,
  activeReplayView,
  selectedMissionState,
  energyDrift,
  selectedDistance,
  focusBodyName,
  statusText,
  missionOutsideView,
  seekMission,
  updateEditableBody,
  resizeManualPlanets,
  openConfigurator,
  closeConfigurator,
  restoreManualStarter,
  applyManualSystem,
  selectPreset,
  resetSimulation,
  updateBinaryMasses,
  setReplayView,
  formatRuler,
  stepOnce,
  handleCanvasClick,
  zoomLevel,
  canvasPan,
  isPanned,
  setZoom,
  recenterCamera,
  startCanvasPan,
  moveCanvasPan,
  endCanvasPan,
  handleWheel,
  formatYears
} = useLaboratory()

function setCanvasElement(element: Element | ComponentPublicInstance | null) {
  canvas.value = element as HTMLCanvasElement | null
}

function setStageElement(element: Element | ComponentPublicInstance | null) {
  stage.value = element as HTMLElement | null
}
</script>


<template>
  <div class="app-shell" :class="{ 'focus-mode': focusMode }">
    <aside class="sidebar">
      <div class="brand-block"><div class="brand-mark" aria-hidden="true"><span></span><i></i></div><div><div class="brand-name">ORBITAL LAB</div><div class="brand-subtitle">N-BODY SIMULATOR</div></div></div>
      <div class="sidebar-section-label">WORKSPACE</div>
      <button class="nav-item active" type="button"><span class="nav-dot"></span>Simulation<span class="nav-status">LIVE</span></button>
      <button class="configure-button" :class="{ active: activePresetId === 'custom' }" type="button" @click="openConfigurator"><span class="configure-plus">+</span><span><strong>Configure system</strong><small>{{ activePresetId === 'custom' ? 'Edit user system' : 'Build a user system' }}</small></span></button>
      <div class="sidebar-section-label presets-label">PRESETS <span>{{ presetCatalog.length }}</span></div>
      <div class="preset-list">
        <button v-for="preset in presetCatalog" :key="preset.id" class="preset-item" :class="{ selected: activePresetId === preset.id }" :aria-busy="pendingPresetId === preset.id" type="button" @click="selectPreset(preset.id)">
          <span class="preset-marker" :class="`marker-${preset.id}`"></span><span class="preset-copy"><strong>{{ preset.name }}</strong><small aria-live="polite">{{ pendingPresetId === preset.id ? 'Loading mission...' : preset.summary }}</small></span><span v-if="activePresetId === preset.id" class="preset-active-line"></span>
        </button>
      </div>
      <p v-if="presetError" class="preset-error" role="alert">{{ presetError }}</p>
      <div class="sidebar-bottom"><div class="engine-label">PHYSICS ENGINE</div><div class="engine-row"><span>Integrator</span><strong>{{ activePresetId === 'apollo11' ? 'Reconstruction' : isReplay ? 'JPL Horizons' : 'Velocity Verlet' }}</strong></div><div class="engine-row"><span>Gravity</span><strong>{{ isReplay ? 'Ephemeris replay' : 'Newtonian' }}</strong></div><div class="engine-row"><span>Frame</span><strong>{{ activeReplayView ? 'Local projection' : isReplay ? 'J2000 projection' : '2D planar' }}</strong></div><div class="sidebar-footer"><span class="live-pip"></span>Local session</div></div>
    </aside>

    <main class="main-shell">
      <header class="topbar">
        <div class="title-block"><div class="eyebrow"><span class="eyebrow-line"></span>SCENARIO / {{ activePreset.category }}</div><h1>{{ activePreset.name }}</h1><p>{{ activePreset.description }}</p></div>
        <div class="topbar-meta"><div class="meta-item"><span>{{ isReplay ? 'MISSION DATE' : 'SIM TIME' }}</span><strong>{{ activeReplay ? activeReplay.date(simulation.elapsed) : formatYears(simulation.elapsed) }}</strong></div><div class="meta-divider"></div><div class="meta-item"><span>STATUS</span><strong class="status-live"><i></i>{{ statusText }}</strong></div></div>
      </header>

      <TransportControls v-model:is-running="isRunning" v-model:speed="speed" v-model:show-trails="showTrails" v-model:show-guides="showGuides" v-model:show-inspector="showInspector" v-model:show-telemetry="showTelemetry" v-model:focus-mode="focusMode" :is-replay="isReplay" :zoom-level="zoomLevel" @step="stepOnce" @reset="resetSimulation" @zoom="setZoom" />

      <section v-if="activePresetId === 'binary'" class="binary-controls" aria-label="Relative star masses">
        <span class="section-kicker">RELATIVE STAR MASSES</span>
        <label>Aster <input v-model.number="binaryPrimaryMass" type="range" min="0.2" max="2.5" step="0.05" @input="updateBinaryMasses"><strong>{{ binaryPrimaryMass.toFixed(2) }}</strong></label>
        <label>Cinder <input v-model.number="binaryCompanionMass" type="range" min="0.2" max="2.5" step="0.05" @input="updateBinaryMasses"><strong>{{ binaryCompanionMass.toFixed(2) }}</strong></label>
        <small>Changing a mass starts a new circular orbit.</small>
      </section>

      <div class="workspace-grid" :class="{ 'single-column': !showInspector || focusMode }">
        <section class="stage-panel">
          <div class="stage-header"><div><span class="section-kicker">ORBIT MAP</span><span class="stage-coordinate">/ {{ activeReplayView ? activeReplayView.frame : activePreset.focusBody ? 'FOCUS: ' + focusBodyName.toUpperCase() : 'BARYCENTRIC FRAME' }}</span></div><div class="stage-header-right"><button class="secondary-button recenter-button" type="button" :disabled="!isPanned" title="Return to the default center" @click="recenterCamera">Recenter</button><div v-if="activeReplay?.views" class="camera-switch" role="group" aria-label="Mission view"><button v-for="view in activeReplay.views" :key="view.id" type="button" :class="{ selected: view.id === activeReplayView?.id }" :aria-pressed="view.id === activeReplayView?.id" @click="setReplayView(view.id)">{{ view.label }}</button></div><span class="axis-key"><i class="axis-x"></i>X</span><span class="axis-key"><i class="axis-y"></i>Y</span><span class="stage-unit">{{ activeReplayView ? 'km' : 'AU / yr' }}</span></div></div>
          <div :ref="setStageElement" class="canvas-wrap" :class="{ panning: canvasPan }"><canvas :ref="setCanvasElement" @click="handleCanvasClick" @wheel="handleWheel" @contextmenu.prevent @pointerdown="startCanvasPan" @pointermove="moveCanvasPan" @pointerup="endCanvasPan" @pointercancel="endCanvasPan" @lostpointercapture="endCanvasPan"></canvas><div v-if="missionOutsideView" class="offscreen-notice">Spacecraft outside this view <button type="button" @click="setReplayView('system')">Show overview</button></div><div class="canvas-readout top-left"><span class="readout-label">N</span><strong>{{ simulation.bodies.length }}</strong><span class="readout-unit">BODIES</span></div><div class="canvas-readout top-right"><span class="readout-label">DT</span><strong>{{ activeReplayView ? Math.round(activePreset.dt * 365.25 * 86400) : activePreset.dt }}</strong><span class="readout-unit">{{ activeReplayView ? 'SEC / STEP' : 'YR / STEP' }}</span></div><div class="canvas-hint"><div>Right-drag to pan</div><div>Scroll to zoom <span></span> Click a body to inspect</div></div><div class="scale-ruler"><span>0</span><i></i><span>{{ formatRuler() }}</span></div></div>
        <!--  <div class="stage-footer"><div class="footer-legend"><span><i class="legend-orbit"></i>{{ isReplay ? 'Reference orbits / mission route' : 'Calculated orbit' }}</span><span><i class="legend-trail"></i>Position trail</span></div><div class="footer-frame">{{ isPanned ? 'MANUAL PAN' : (activeReplayView ? activeReplayView.frame : isReplay ? 'SUN-CENTERED / J2000' : 'CENTER OF MASS LOCKED') }} <span class="live-pip"></span></div></div>-->
        </section>

        <BodyInspector v-if="showInspector && !focusMode" v-model:selected-id="selectedBodyId" :selected-body="selectedBody" :selected-mission-state="selectedMissionState" :selected-distance="selectedDistance" :replay="activeReplay" :preset="activePreset" :bodies="simulation.bodies" />
      </div>

      <MissionTimeline v-if="activeReplay" :replay="activeReplay" :title="activePreset.name" :elapsed="simulation.elapsed" :dt="activePreset.dt" @seek="seekMission" />

      <section v-if="showTelemetry && !focusMode && !isReplay" class="telemetry-panel"><div class="telemetry-heading"><span class="section-kicker">RUN TELEMETRY</span><span class="telemetry-caption">Fixed timestep / conserved quantities</span></div><div class="telemetry-grid"><div class="telemetry-item"><span>INTEGRATION STEPS</span><strong>{{ simulation.steps.toLocaleString() }}</strong><small>iterations</small></div><div class="telemetry-item"><span>ENERGY DRIFT</span><strong :class="{ warning: Math.abs(energyDrift) > .01 }">{{ energyDrift >= 0 ? '+' : '' }}{{ energyDrift.toFixed(4) }}%</strong><small>relative to start</small></div><div class="telemetry-item"><span>TIME STEP</span><strong>{{ activePreset.dt }} yr</strong><small>{{ (activePreset.dt * 365.25).toFixed(1) }} days</small></div><div class="telemetry-item"><span>MODEL</span><strong>N-BODY</strong><small>pairwise gravity</small></div><div class="telemetry-health"><span class="health-dot"></span><div><strong>Numerically stable</strong><small>Energy remains bounded in this preset</small></div></div></div></section>
      <footer class="main-footer"><span>ORBITAL LAB / LABORATORY PRESET SERIES</span><span>G = 4pi^2 AU^3 M_sun^-1 yr^-2</span><span>v1.0.0</span></footer>
    </main>
    <SystemConfigurator v-if="configOpen" v-model:count="manualPlanetCount" :bodies="editableBodies" :error="configError" @close="closeConfigurator" @apply="applyManualSystem" @restore="restoreManualStarter" @resize="resizeManualPlanets" @edit="updateEditableBody" />
  </div>
</template>

<style src="./assets/laboratory.css"></style>
