<template>
  <q-dialog :model-value="show" @hide="$emit('hide')">
    <q-card style="min-width: 50%;" flat bordered>
      <q-card-section horizontal>
        <q-card-section style="min-width: 50%;">
          <div class="text-h6" style="margin-bottom: 10px;">Annotation and Named Entity Review Tool (AnNER)</div>
          <p><strong>Version: </strong>{{ version }}</p>
          <p>
            <strong>Source: </strong>
            Adapted from <a href="https://github.com/tecoholic/ner-annotator" target="_blank">NER Annotator</a> into <a href="https://github.com/theSKAILab/AnNER" target="_blank">AnNER</a>
          </p>
          <p>
            <strong>Author:</strong><br/>
            Original Author @tecoholic (<a href="https://github.com/tecoholic" target="_blank">Github</a>, <a href="https://github.com/tecoholic" target="_blank">Twitter</a>)<br/>
            Adapted by @theSKAILab Team (<a href="https://github.com/theSKAILab" target="_blank">Github</a>)<br/>
            <span style="padding-left: 25px;">Nicholas Pease (<a href="https://github.com/npease18" target="_blank">Github</a>, <a href="https://nicholaspease.com" target="_blank">Website</a>)</span><br/>
            <span style="padding-left: 25px;">Umayer Reza (<a href="https://github.com/umayerr" target="_blank">Github</a>)</span>
          </p>
        </q-card-section>

        <q-card-section>
          This research was supported in part by the
          U.S. Department of Agriculture through a National Institute of Food and Agriculture (NIFA) grant, Award #<a href="https://portal.nifa.usda.gov/web/crisprojectpages/1025810-cellulose-materials-informatics-building-a-knowledge-graph-for-cellulose-materials-discovery-and-research-cellograph.html" target="_blank">2021-67022-34366</a><br/>
          <br/>This tool was designed and developed in the Spatial Knowledge and Artificial Intelligence (SKAI) lab at University of Maine<br/><br/>
          <span style="font-weight: bold;">Cite this tool as:</span><br />
          Author 1, Author 2, Author 3, & Author 4. ({{ new Date().getFullYear() }}). 
          <span style="font-style: italic;">Annotation and Named Entity Review Tool (AnNER)</span> [Computer software].
        </q-card-section>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="OK" color="primary" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
export default {
  name: "AboutDialog",
  emits: ["hide"],
  props: {
    show: {
      type: Boolean,
      default: false,
    },
  },
  data: function() {
    return {
      // eslint-disable-next-line no-undef
      version: APPLICATION_VERSION,
    };
  },
};
</script>

<style></style>
