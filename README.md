## AnNER: Annotation and Named Entity Review Tool
[![Deployment](https://github.com/theSKAILab/AnNER/actions/workflows/deployment.yml/badge.svg)](https://github.com/theSKAILab/AnNER/actions/workflows/deployment.yml)

AnNER is a web-based tool for annotating text with named entities that, beyond basic annotation functionalities, offers a review mode that allows multiple users to review existing annotations and propose corrections or additions. The tool keeps track of the annotation history and exports a semantic representation of the annotation provenance to increase their trustworthiness, which is critical for large-scale knowledge graph construction and other
downstream tasks.

This tool was designed and developed in the Spatial Knowledge and Artificial Intelligence (SKAI) lab at University of Maine. This research was supported in part by the U.S. Department of Agriculture through a National Institute of Food and Agriculture (NIFA) grant, Award #2021-67022-34366

Cite this tool as:
> Umayer Reza, Nicholas Pease, Torsten Hahmann, and Jinwu Wang. (2025). Annotation and Named Entity Review Tool (AnNER) [Computer software].

## Local Development
To get started with local development, clone the repository and install all required dependencies with
```bash
pnpm install
```

Once installed, a local development build can be started with
```bash
pnpm dev
```

Other notable build commands include:
> pnpm build - Build project for production use<br/>
> pnpm lint - Lint the project using Eslint<br/>
> pnpm format - Format the project files with project specifications
