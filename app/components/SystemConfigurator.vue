<script setup lang="ts">
import type { EditableBody } from '../physics/types'
defineProps<{ bodies: EditableBody[]; error: string }>()
const count = defineModel<number>('count', { required: true })
const emit = defineEmits<{ close: []; apply: []; restore: []; resize: []; edit: [id: string, patch: Partial<EditableBody>] }>()
function edit(id: string, field: keyof EditableBody, event: Event, numeric = false) {
  const value = (event.target as HTMLInputElement).value
  emit('edit', id, { [field]: numeric ? Number(value) : value })
}

</script>

<template>
<div class="config-overlay" @click.self="emit('close')">
      <section class="config-drawer" aria-label="Configure user system">
        <header class="config-header"><div><span class="section-kicker">USER SYSTEM / PARAMETERS</span><h2>Configure system</h2><p>Set the initial state for every body. Values are displayed at ×10,000; physics uses solar masses, AU, and AU / year.</p></div><button class="drawer-close" type="button" aria-label="Close configurator" title="Close configurator" @click="emit('close')">x</button></header>
        <div class="config-body">
          <div class="config-toolbar"><label class="count-control"><span>PLANETS</span><input v-model.number="count" type="number" min="0" max="12" step="1" @change="emit('resize')"></label><span class="config-count-note">plus 1 editable central star</span><button class="starter-button" type="button" @click="emit('restore')">Reset Defaults</button></div>
          <div class="config-section-heading"><span>INITIAL BODY STATES</span><small>Position and velocity are absolute coordinates</small></div>
          <div class="config-body-list">
            <article v-for="(body, index) in bodies" :key="body.id" class="config-body-row">
              <div class="config-body-heading"><span class="config-body-index">{{ body.role === 'Star' ? 'STAR' : `PLANET ${String(index).padStart(2, '0')}` }}</span><span class="config-body-dot" :style="{ backgroundColor: body.color }"></span><strong>{{ body.name || 'Unnamed body' }}</strong></div>
              <div class="config-fields">
                <label class="config-field name-field"><span>NAME</span><input :value="body.name" @input="edit(body.id, 'name', $event)" type="text" maxlength="18"></label>
                <label class="config-field"><span>MASS <i>M_sun × 10,000</i></span><input :value="body.mass" @input="edit(body.id, 'mass', $event, true)" type="number" min="0.0001" step="0.01"></label>
                <label class="config-field"><span>COLOR</span><input :value="body.color" @input="edit(body.id, 'color', $event)" class="color-input" type="color"></label>
                <label class="config-field"><span>POSITION X <i>AU × 10,000</i></span><input :value="body.x" @input="edit(body.id, 'x', $event, true)" type="number" step="0.01"></label>
                <label class="config-field"><span>POSITION Y <i>AU × 10,000</i></span><input :value="body.y" @input="edit(body.id, 'y', $event, true)" type="number" step="0.01"></label>
                <label class="config-field"><span>VELOCITY X <i>AU / yr × 10,000</i></span><input :value="body.vx" @input="edit(body.id, 'vx', $event, true)" type="number" step="0.01"></label>
                <label class="config-field"><span>VELOCITY Y <i>AU / yr × 10,000</i></span><input :value="body.vy" @input="edit(body.id, 'vy', $event, true)" type="number" step="0.01"></label>
              </div>
            </article>
          </div>
        </div>
        <footer class="config-footer"><p v-if="error" class="config-error">{{ error }}</p><p v-else>Apply creates a new deterministic run and opens the canvas in focus mode.</p><div class="config-actions"><button class="secondary-button" type="button" @click="emit('close')">Cancel</button><button class="run-button" type="button" @click="emit('apply')">Apply system</button></div></footer>
      </section>
    </div>
</template>
