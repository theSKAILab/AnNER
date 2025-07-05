<template>
  <div>
    <classes-block />
    <div class="q-pa-lg" style="height: calc(100vh - 190px); overflow-y:scroll;">
      <component 
        v-for="t in eligibleTokens" 
        :key="`${t.type}-${t.start}`"
        :is="t.type === 'token' ? 'Token' : 'TokenBlock'" 
        :token="t"
        :class="[t.reviewed ? 'user-active' : 'user-inactive']"
        :history="t.history" 
        @remove-block="onRemoveBlock" 
        v-model:currentState="t.currentState"
        v-model:labelClass="t.labelClass"
        v-model:reviewed="t.reviewed"
      />
    </div>
    <info-bar />
  </div>
</template>
<script>
import { mapState, mapMutations } from "vuex";
import Token from "../objects/Token";
import TokenBlock from "../objects/TokenBlock";
import ClassesBlock from "../objects/ClassesBlock.vue";
import TokenManager from "../etc/token-manager";
import Tokenizer from "../etc/tokenizer";
import InfoBar from "../toolbars/InfoBar.vue";
import SharedEditorFunctions from "./shared.vue";

export default {
  name: "ReviewPage",
  data: function () {
    return {
      tm: new TokenManager([]),
      currentSentence: {},
      tokenizer: new Tokenizer(),
    };
  },
  components: {
    Token,
    TokenBlock,
    ClassesBlock,
    InfoBar
  },
  computed: {
    ...mapState([
      "annotations",
      "annotationHistory",
      "classes",
      "currentClass",
      "currentIndex",
      "inputSentences",
      "annotationPrecision",
      "undoStack"
    ]),
    // TODO: THIS SHOULD BE REWRITTEN BETTER
    eligibleTokens() {
      var renderedList = [];
      for (let i = 0; i < this.tm.tokens.length; i++) {
        let t = this.tm.tokens[i];
        let tokenOverlapping = this.tm.isOverlapping(t.start, t.end);
        if (!tokenOverlapping) {
          renderedList.push(t);
        } else if (t.currentState == 'Rejected' && tokenOverlapping != null && t == tokenOverlapping[0]) {
          renderedList.push(t);
        } else if (t.currentState != 'Rejected' && tokenOverlapping != null) {
          renderedList.push(t);
        }
      }
      return renderedList;
    }
  },
  watch: {
    inputSentences() {
      this.resetIndex();
      this.tokenizeCurrentSentence();
    },
    annotations() {
      if (this.currentAnnotation != this.annotations[this.currentIndex]) {
        this.tokenizeCurrentSentence();
      }
    },
    classes() {
      this.tokenizeCurrentSentence();
    },
    annotationPrecision() {
      this.tokenizeCurrentSentence();
    }
  },
  created() {
    // Add blocks for all paragraphs
    if (this.inputSentences.length) {
      this.tokenizeCurrentSentence()
    }
    document.addEventListener("mouseup", this.selectTokens);
    window.onbeforeunload = this.beforeLeave;

    // Emits
    this.emitter.on('undo', this.undo);
    this.emitter.on('undoAll',  this.undoAll);
    this.emitter.on('tokenizeCurrentSentence', this.tokenizeCurrentSentence);
  },
  beforeUnmount() {
    document.removeEventListener("mouseup", this.selectTokens);

    // Remove emits
    this.emitter.off('undo', this.undo);
    this.emitter.off('undoAll',  this.undoAll);
    this.emitter.off('tokenizeCurrentSentence', this.tokenizeCurrentSentence);
  },
  mixins: [SharedEditorFunctions],
  methods: {
    ...mapMutations(["resetIndex"]),
  },
};
</script>
