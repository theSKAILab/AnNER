## AnNER: Annotation and Named Entity Review Tool
![](https://img.shields.io/github/package-json/version/theSKAILab/AnNER?style=for-the-badge&logo=vuedotjs) [![Docs](https://img.shields.io/badge/Documentation-gray?style=for-the-badge)](https://theskailab.github.io/AnNER/docs/) ![](https://img.shields.io/github/deployments/theSKAILab/AnNER/github-pages?style=for-the-badge&logo=htmx&label=Deployment)

AnNER is a web-based tool for annotating text with named entities that, beyond basic annotation functionalities, offers a review mode that allows multiple users to review existing annotations and propose corrections or additions. The tool keeps track of the annotation history and exports a semantic representation of the annotation provenance to increase their trustworthiness, which is critical for large-scale knowledge graph construction and other
downstream tasks.

This tool was designed and developed in the Spatial Knowledge and Artificial Intelligence (SKAI) lab at University of Maine. This research was supported in part by the U.S. Department of Agriculture through a National Institute of Food and Agriculture (NIFA) grant, Award #2021-67022-34366

Cite this tool as:
> Umayer Reza, Nicholas Pease, Jinwu Wang, and Torsten Hahmann. 2025. AnNER: Supporting Efficient Entity Annotation and Review Workflows for Knowledge Graph Construction. In Proceedings of the 13th Knowledge Capture Conference 2025 (K-CAP '25). Association for Computing Machinery, New York, NY, USA, 52–55. https://doi.org/10.1145/3731443.3771347

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
