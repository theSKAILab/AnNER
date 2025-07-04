<template>
  <div class="q-mx-auto q-my-xl">
    <div class="column items-center justify-center">
      <h6 class="text-center text-h3 q-mb-none q-mt-lg text-bold">AnNER: Annotation and Named Entity Review Tool</h6>
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
      <div class="start-footer">
        This tool was designed and developed in the Spatial Knowledge and Artificial Intelligence (SKAI) lab at University of Maine. <br/>
        The research was supported in part by the U.S. Department of Agriculture through a National Institute of Food and Agriculture (NIFA) grant<br/>
        Award #<a href="https://portal.nifa.usda.gov/web/crisprojectpages/1025810-cellulose-materials-informatics-building-a-knowledge-graph-for-cellulose-materials-discovery-and-research-cellograph.html" target="_blank">2021-67022-34366</a>
      <div class="image-logos">
        <img src="@/assets/skailabicon.png"/>
        <img src="@/assets/umaine-dark.png" alt="UMaine Logo" v-show="$q.dark.isActive"/>
        <img src="@/assets/umaine.png" alt="UMaine Logo" v-show="!$q.dark.isActive"/>
        <img src="@/assets/forestserviceicon.png"/>
      </div>
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
