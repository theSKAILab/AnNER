<template>
  <q-dialog :model-value="show" @hide="$emit('hide')">
    <q-card style="max-width: 400px; padding: 10px; border-radius: 10px">
      <q-card-section>
        <div class="text-h5">Are you sure you want to open a new file?</div>
      </q-card-section>

      <q-card-section class="text-body1">
        <p>All changes made to this file will be lost.</p>
        If you haven't exported the annotations, please do so before closing the file.
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" v-close-popup @click="$emit('hide')" />
        <q-btn flat label="OK" v-close-popup @click="$emit('confirm')" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
export default {
  name: 'OpenDialog',
  emits: ['hide', 'confirm'],
  props: {
    show: {
      type: Boolean,
      default: false,
    },
  },
}
</script>
