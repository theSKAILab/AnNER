<script>
import { mapState } from 'vuex'
import { save } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { documentDir } from "@tauri-apps/api/path";

export default {
  name: 'ExportAnnotations',
  computed: {
    ...mapState(['annotations', 'classes']),
  },
  methods: {
    promptForNameAndExport() {
      this.$q.dialog({
          title: 'Save File',
          message: 'Please enter a name for the exported annotations file',
          prompt: {
            model: '',
            type: 'text', // optional
            isValid: val => val.length > 0,
          },
          cancel: true,
          persistent: true
        }).onOk(data => {
          // console.log('>>>> OK, received', data)
          this.generateJSONExport(data);
        })
    },
    async generateJSONExport(annotator) {
      const output = {
        classes: this.classes.map((c, index) => ({
          id: index + 1,
          name: c.name,
          color: c.color
        })),
        annotations: this.annotations.map(annotation => [
          annotation.text,  // Text directly in the array
          {
            entities: annotation.entities.length? annotation.entities.map(entity => {
              //annotation.start, annotation.end, _class, annotation.ogNLP, annotation.ogNLP, true, annotation.name, annotation.currentState, annotation.annotationHistory, false
              let history = entity.history;  // Ensure history is initialized
              const newHistoryEntry = [
                entity.currentState, // Current status of the entity
                this.formatDate(new Date()),
                annotator,
                entity.labelClass.name, // The class or label from the entity
              ];
              if (entity.reviewed && history[history.length-1][2] != annotator && history[history.length-1][0] == entity.currentState && history[history.length-1][3] == entity.labelClass.name) 
              {
                history.push(
                  [
                    history[history.length-1][0],
                    this.formatDate(new Date()),
                    annotator,
                    history[history.length-1][3]]
                ) //  Current reviewer "concurs" with previous reviewer and is not the same as previous reviewer
              }
              else if ((entity.currentState == "Candidate" || entity.currentState == "Suggested") && history.length == 0) 
              {
                history.push(newHistoryEntry); // New annotation in Annotate or Review mode
              }
              else if (history[history.length-1][0] != entity.currentState || history[history.length-1][3] != entity.labelClass.name) 
              {
                history.push(newHistoryEntry); // Status change from previous entry in history
              }

              return [
                null, // id field required for knowledge graph, initially null
                entity.start, // start position
                entity.end, // end position
                history.map(h => [h[0], h[1], h[2], h[3]]), // history array
              ];
            }): []
          }
        ])
      };

      const content = JSON.stringify(output, null, 2); // Pretty print JSON
      try {
        // file saving logic
        this.$store.lastSavedTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (typeof window.rpc === "undefined") {
          let element = document.createElement("a");
          element.setAttribute(
            "href",
            "data:text/plain;charset=utf-8," + encodeURIComponent(content)
          );
          element.setAttribute("download", `${annotator}-annotations.json`);
          element.style.display = "none";
          document.body.appendChild(element);
          element.click();
          document.body.removeChild(element);
        } else {
          save({
            defaultPath: await documentDir(),
            filters: [
              { extensions: ["json"], name: "JSON Files (*.json)" },
              { name: "All files (*.*)", extensions: ["*"] },
            ],
          })
            .then((path) => {
              if (!path) return;
              if (!path.match(/.*\.json$/)) path += ".json";

              invoke("save_file", { filepath: path, contents: content })
                .then((msg) => alert(msg))
                .catch((e) => alert(e));
            })
            .catch((e) => console.log("Save cancelled.", e));
        }
      } catch (error) {
        console.error("Export failed:", error);
      }
    },
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        return `${year}-${month}-${day}~${hours}:${minutes}:${seconds}`;
      },
    }
}
</script>
