<!--defines a Vue.js component responsible for managing and displaying
   the list of classes (or tags)-->
<template>
  <div class="q-pa-md" style="height: 90px; border-bottom: 1px solid #ccc">
    <div class="row">
      <div class="tags">
        <q-chip
          v-for="label in this.allLabels"
          :key="label.id"
          outline
          square
          style="height: 2rem"
          :color="label.color.replace('11', '12')"
          clickable
          @click="labelManager.setCurrentLabel(label.name)"
          :removable="showDeleteButtons"
          @remove="promptDelete(label.name)"
        >
          <q-avatar
            v-if="label.id === labelManager.currentLabel.id"
            :color="label.color.replace('11', '12')"
            style="height: 2rem"
            text-color="white"
            :icon="'fa fa-check'"
          ></q-avatar>
          <q-avatar
            v-if="label.id !== labelManager.currentLabel.id"
            :color="label.color.replace('11', '12')"
            style="height: 2rem"
            text-color="white"
            font-size="16px"
          ></q-avatar>
          <p :class="['q-mb-none', $q.dark.isActive ? 'text-grey-3' : 'text-grey-9']">
            {{ label.name }}
          </p>
        </q-chip>
      </div>
      <q-space></q-space>
      <div class="q-mx-md">
        <q-input
          bottom-slots
          v-model="newClassName"
          v-if="showNewClassInput || this.allLabels.length == 0"
          hint="Enter a NER Tag and click [+] to add it"
          dense
          autofocus
        >
          <template v-slot:append>
            <q-btn round dense flat color="primary" icon="fa fa-plus" @click="saveLabel" />
            <q-btn
              round
              color="negative"
              dense
              flat
              icon="fa fa-times"
              @click="showNewClassInput = false"
            />
          </template>
        </q-input>
      </div>
      <div class="buttons">
        <q-btn
          v-if="$store.state.currentPage !== 'review'"
          outline
          @click="showNewClassInput = !showNewClassInput"
          :label="showNewClassInput ? 'Cancel' : 'Add Tag'"
          class="q-mr-sm"
          :color="$q.dark.isActive ? 'grey-3' : 'grey-9'"
        />
        <q-btn
          v-if="$store.state.currentPage !== 'review'"
          outline
          @click="showDeleteButtons = !showDeleteButtons"
          :label="showDeleteButtons ? 'Lock Tags' : 'Edit Tags'"
          :color="$q.dark.isActive ? 'grey-3' : 'grey-9'"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { mapState } from 'vuex'
export default {
  name: 'LabelsBlock',
  data() {
    return {
      newClassName: '',
      showDeleteButtons: false,
      showNewClassInput: false,
    }
  },
  computed: {
    ...mapState(['labelManager']),
    allLabels() {
      return this.labelManager.allLabels
    },
  },
  watch: {
    allLabels() {},
  },
  methods: {
    promptDelete(className: string) {
      this.$q
        .dialog({
          title: 'Tag Removal Confirmation',
          message: 'Are you sure you want to remove the tag \"' + className + '\"?',
          cancel: true,
          persistent: true,
        })
        .onOk(() => {
          this.labelManager.deleteLabel(className)
        })
    },
    saveLabel() {
      if (!this.newClassName) return

      this.newClassName = this.newClassName.toUpperCase().trim()

      if (!this.labelManager.doesAlreadyExist(this.newClassName)) {
        this.labelManager.addLabel(this.newClassName)
        this.newClassName = '' // Clear the input field after saving
      } else {
        this.$q.notify({
          type: 'negative',
          message: 'Label already exists!',
          position: 'top',
        })
        this.newClassName = '' // Clear the input field after saving
      }
    },
  },
}
// TODO: CSS BELOW SHOULD BE MOVED TO A GLOBAL STYLE SHEET
</script>
<style lang="css" scoped>
.color-box {
  width: 1rem;
  height: 1rem;
  margin-right: 1rem;
}
</style>
