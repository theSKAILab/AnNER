<template>
  <div class="q-mx-auto q-my-xl">
    <div class="column items-center justify-center">
      <h6 class="text-center text-h3 q-mb-none q-mt-lg text-bold">Text Annotation Review and Tagging (TART) Tool</h6>
      <div style="margin-top: 45px;">
        <q-file
          accept=".txt,.json"
          filled
          @update:model-value="this.loadFile"
          label="Open a text or json file to begin"
          :bg-color="$q.dark.isActive ? 'black-1' : 'light-blue-1'"
        >
          <template v-slot:prepend>
            <q-icon name="fas fa-upload" />
          </template>
        </q-file>
        <p :class="['text-subtitle1 q-my-md', $q.dark.isActive ? 'text-grey-4' : 'text-grey-7']">
          Hint: You can also drag and drop files into this window!
        </p>
      </div>
    </div>

    <div class="row" style="position: absolute; bottom: 15px; width: 100%;">
      <div class="col items-start start-footer justify-end">
        This tool was designed and developed in the Spatial Knowledge and Artificial Intelligence (SKAI) lab at University of Maine<br/>
        <div style="height: 45px; padding-top: 5px;" class="row items-center">
          <div class="col col-md-auto" style="margin-right: 15px;">
            <img src="@/assets/umaine-dark.png" alt="UMaine Logo" class="q-mb-sm" height="40px" v-show="$q.dark.isActive"/>
            <img src="@/assets/umaine.png" alt="UMaine Logo" class="q-mb-sm" height="40px" v-show="!$q.dark.isActive"/>
          </div>
          <div class="col col-md-auto">
            <img src="@/assets/skailabicon.png" style="height: 40px;"/>
          </div>
        </div>
      </div>
      <div class="col start-footer justify-end" style="text-align: center;">
        <span style="font-weight: bold;">Cite this tool as:</span><br />
        Author 1, Author 2, Author 3, & Author 4. ({{ new Date().getFullYear() }}). 
        <span style="font-style: italic;">Text Annotation Review and Tagging (TART)</span> [Computer software].
      </div>
      <div class="col items-end start-footer justify-end" style="text-align: right;">
        This research was supported in part by the U.S. Department of Agriculture through a National Institute of Food and Agriculture (NIFA) grant, Award #<a href="https://portal.nifa.usda.gov/web/crisprojectpages/1025810-cellulose-materials-informatics-building-a-knowledge-graph-for-cellulose-materials-discovery-and-research-cellograph.html" target="_blank">2021-67022-34366</a><br/>
        <img src="@/assets/forestserviceicon.png" style="height: 50px;margin-top: 15px;"/>
      </div>
    </div>

  </div>
</template>

<script>
import { mapMutations } from "vuex";
export default {
  name: "StartPage",
  methods: {
    ...mapMutations(["loadFile"]),
  },
};
</script>
