<template>
  <q-header bordered>
      <div class="q-pa-sm q-pl-md row items-center">

        <!-- Menu Options -->
        <span class="col">
            <!-- File -->
          <div class="cursor-pointer non-selectable">
            <span class="q-menu-open-button" ref="fileMenu">
              File
            </span>
            <q-menu transition-show="jump-down" transition-hide="jump-up">
              <q-list dense style="min-width: 100px">
                <q-item clickable v-close-popup @click="$store.state.currentPage != 'start'? pendingOpen = $refs.file: $refs.file.click()">
                  <q-item-section>
                    <span>Open</span> 
                    <span class="keyboard-tip">Ctrl + O</span>
                  </q-item-section>
                </q-item>
                  <q-item clickable v-close-popup @click="promptForNameAndExport()" :class="$store.state.currentPage == 'start'? 'disabled': ''">
                    <q-item-section>
                      <span>Save</span> 
                      <span class="keyboard-tip">Ctrl + S</span>
                    </q-item-section>
                  </q-item>
                <q-item clickable v-close-popup @click="pendingClose = true;" :class="$store.state.currentPage == 'start'? 'disabled': ''">
                  <q-item-section >
                    <span>Close</span> 
                    <span class="keyboard-tip">Ctrl + Q</span>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </div>
          
          <input @change="(e) => {this.loadFile(e.target.files[0])}" type="file" ref="file" accept=".txt,.json" id="fileupload" style="display: none"/>
          
          <!-- Edit -->
          <div class="q-ml-md cursor-pointer non-selectable">
            <span class="q-menu-open-button" ref="editMenu">
              Edit
            </span>
            <q-menu transition-show="jump-down" transition-hide="jump-up">
              <q-list dense style="min-width: 100px">
                <q-item clickable v-close-popup @click="this.emitter.emit('undo')" :class="$store.state.currentPage == 'start'? 'disabled': ''">
                  <q-item-section>
                      <span>Undo</span> 
                      <span class="keyboard-tip">Ctrl + Z</span>
                  </q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="this.emitter.emit('undoAll')" :class="$store.state.currentPage == 'start'? 'disabled': ''">
                  <q-item-section>
                    <span>Undo All</span> 
                    <span class="keyboard-tip">Alt + Z</span>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </div>

          <!-- Annotator -->
          <div class="q-ml-md cursor-pointer non-selectable">
            <span class="q-menu-open-button" ref="annotatorMenu">
              Annotator
            </span>
            <q-menu transition-show="jump-down" transition-hide="jump-up">
              <q-list dense style="min-width: 100px">
                <q-item clickable v-close-popup @click="() => {$store.state.currentPage == 'annotate'? this.setCurrentPage('review'): this.setCurrentPage('annotate')}" :class="$store.state.currentPage == 'start'? 'disabled': ''">
                  <q-item-section>
                    <span>Change Mode</span> 
                    <span class="keyboard-tip">Ctrl + M</span>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </div>

          <!-- Help -->
          <div class="q-ml-md cursor-pointer non-selectable" ref="helpMenu">
            <span class="q-menu-open-button">Help</span>
            <q-menu transition-show="jump-down" transition-hide="jump-up">
              <q-list dense style="min-width: 100px">
                <q-item clickable v-close-popup href="https://github.com/theSKAILab/AnNER/issues" target="_blank">
                  Report Issue
                </q-item>
                <q-item clickable v-close-popup @click="showAbout = true">
                  <q-item-section>About</q-item-section>
                </q-item>
              </q-list>
            </q-menu>

            <about-dialog :show="showAbout" @hide="showAbout = false" />
          </div>
        </span>

        <!-- Program / Mode -->
        <span class="col" style="text-align: center;" v-if="this.$store.state.currentPage != 'start'">
          <span>{{ titleBar }} </span>
          <span style="font-weight: bold;">{{ this.$store.state.currentPage.charAt(0).toUpperCase() + this.$store.state.currentPage.slice(1) }} Mode</span>
        </span>

        <!-- Rightmost Buttons -->
        <span class="col" style="text-align: right;">
          <div class="q-ml-md q-mr-lg cursor-pointer non-selectable" v-if="installablePWA">
            <span class="q-menu-open-button" @click="deferredPrompt.prompt()">
                  Install Application
            </span>
          </div>

          <!-- Theme Mode Switch -->
          <q-icon style="margin-top: 5px" color="white" :name="$q.dark.isActive ? 'fas fa-sun' : 'fas fa-moon'" class="cursor-pointer" @click="toggleDarkMode" />
        </span>
      
      </div>
  </q-header>

  <open-dialog :show="pendingOpen != null" @hide="pendingOpen = null" @confirm="pendingOpen.click()" />
  <exit-dialog :show="pendingClose != null" @hide="pendingClose = null" @confirm="() => {this.reloadWindow()}" />
</template>

<script>
import ExportAnnotations from "../etc/ExportAnnotations.vue";
import { mapState, mapMutations } from "vuex";
import AboutDialog from "../dialogs/AboutDialog.vue";
import ExitDialog from "../dialogs/ExitDialog.vue";
import OpenDialog from "../dialogs/OpenDialog.vue";

export default {
  components: { AboutDialog, ExitDialog, OpenDialog },
  name: "MenuBar",
  data: function () {
    return {
      showAbout: false,
      pendingClose: null,
      pendingOpen: null,
      installablePWA: false,
      deferredPrompt: null, 
    };
  },
  created() {
    document.addEventListener('keydown', this.menuKeyBind);
    window.addEventListener("beforeinstallprompt", (e) => {
      this.installablePWA = true;
      // Stash the event so it can be triggered later.
      this.deferredPrompt = e;
    });
    window.addEventListener("appinstalled", () => {
      this.installablePWA = false;
      this.deferredPrompt = null;
    })
  },
  computed: {
    ...mapState(["annotations", "classes","fileName","currentPage"]),
    titleBar() {
      return this.$store.state.fileName ? this.$store.state.fileName + " - " : "";
    }
  },
  mixins: [ExportAnnotations],
  methods: {
    ...mapMutations(["setCurrentPage","loadFile"]),
    toggleDarkMode: function () {
      this.$q.dark.toggle();
    },
    menuKeyBind(e) {
      var isValid = this.$store.state.currentPage != 'start'
      if (e.ctrlKey) e.preventDefault();
      // Menu Open Binds
      if (e.key == "f" && e.ctrlKey) {this.$refs.fileMenu.click()};
      if (e.key == "e" && e.ctrlKey) {this.$refs.editMenu.click()};
      if (e.key == "a" && e.ctrlKey) {this.$refs.annotatorMenu.click()};
      if (e.key == "h" && e.ctrlKey) {this.$refs.helpMenu.click()};
      
      // File Menu Binds
      if (e.key == "o" && e.ctrlKey) {this.$refs.file.click()};
      if (e.key == "s" && e.ctrlKey && isValid) {this.promptForNameAndExport()};
      if (e.key == "q" && e.ctrlKey && isValid) {this.pendingClose = true;};
      
      // Edit Menu Binds
      if (e.key == "z" && e.ctrlKey && isValid) {this.emitter.emit('undo')};
      if (e.key == "z" && e.altKey && isValid) {console.log("Fire");this.emitter.emit('undoAll')};

      // Annotator Menu Binds
      if (e.key == "m" && e.ctrlKey && isValid) {this.$store.state.currentPage == 'annotate'? this.setCurrentPage('review'): this.setCurrentPage('annotate')}
    },
    reloadWindow() {
      window.onbeforeunload = null; // Disable the beforeunload event
      window.location.reload();
    }
  },
};
</script>
