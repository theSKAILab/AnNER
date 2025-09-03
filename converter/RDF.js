import * as fs from 'fs';

// Type definitions
interface StatusRecord {
  0: string; // label
  1: string; // status
  2: string; // datetime
  3: string; // annotator
}

interface Entity {
  0: string | null; // entity_id
  1: number; // start
  2: number; // end
  3: StatusRecord[]; // status_list
}

interface EntitiesContainer {
  entities: Entity[];
}

interface Annotation {
  0: string | null; // paragraph_id
  1: string; // paragraph_text
  2: EntitiesContainer; // entities
}

interface AnnotationData {
  annotations: Annotation[];
}

/**
 * Determine the current review number (Rv) for the given annotation data to
 * assign IDs to suggested entities. The function scans all entity IDs and checks
 * for review suffixes (e.g., '_Rv1', '_Rv2').
 *
 * Logic:
 * - If the first paragraph ID, data['annotations'][0][0], is non-null:
 *     - Iterate through all entity IDs.
 *         - If at least one null entity ID is found, set flag = 1.
 *         - If an entity ID ends with "_Rv#", extract the review number and store it.
 *     - If flag = 1:
 *         - If review_numbers is not empty (file was reviewed before):
 *             - Return max(review_numbers) + 1 (current review number).
 *         - If review_numbers is empty (first review):
 *             - Return 1.
 * - If the first paragraph ID is null, return 0.
 *
 * Parameters:
 *     data: Annotation data converted from JSON.
 *
 * Returns:
 *     Current review number to assign, or 0 if no review is needed.
 */
function getCurrentRv(data: AnnotationData): number {
  if (data.annotations[0][0] !== null) {
    const reviewNumbers: number[] = [];
    let nullFlag = 0;

    for (const annotation of data.annotations) {
      for (const entity of annotation[2].entities) {
        const entId = entity[0];
        
        // check null id; if a null id found, set nullFlag = 1
        if (entId === null && nullFlag === 0) {
          nullFlag = 1;
        }

        if (entId !== null) {
          const entIdParts = entId.split('_');
          
          if (entIdParts[entIdParts.length - 1].substring(0, 2) === 'Rv') {
            reviewNumbers.push(parseInt(entIdParts[entIdParts.length - 1].substring(2)));
          }
        }
      }
    }

    if (nullFlag === 1) {
      if (reviewNumbers.length > 0) {
        return Math.max(...reviewNumbers) + 1;
      } else {
        return 1;
      }
    }
  }
  
  return 0;
}

/**
 * Resolve and assign IDs for the document, paragraphs, and entities in the
 * given annotation JSON file. Ensures that missing IDs are generated based on
 * the source of the JSON and review status.
 *
 * Logic:
 * - If the first paragraph ID is null:
 *     - JSON is generated from AnNER's annotation mode.
 *     - All paragraph IDs and entity IDs are null.
 *     - ACTION: Assign IDs to all paragraphs and entities.
 *
 * - If the first paragraph ID starts with 'AnNER':
 *     - JSON is generated from AnNER's annotation mode.
 *     - All paragraphs already have IDs.
 *     - Most entities have IDs, but some suggested ones may not.
 *     - ACTION: Assign IDs only to missing entities (check review number first).
 *
 * - If the first paragraph ID starts with something else:
 *     - JSON is generated from CelloGraph's RDF-to-JSON converter.
 *     - All paragraphs already have IDs.
 *     - Entities may or may not have IDs (candidates or suggested).
 *     - ACTION: Assign IDs only to missing entities (check review number first).
 *
 * Parameters:
 *     annerJson: Path to the annotation JSON file.
 *
 * Returns:
 *     Tuple containing resolved document ID and updated annotation data with IDs assigned.
 */
function idResolver(annerJson: string): [string, AnnotationData] {
  // reading annotations in json format
  const fileContent = fs.readFileSync(annerJson, 'utf-8');
  const data: AnnotationData = JSON.parse(fileContent);
  
  // create document id
  const firstParaId = data.annotations[0][0];
  let documentId: string;
  
  if (firstParaId === null) {
    const currentTime = new Date().toISOString().replace(/[-:T.]/g, '').substring(2, 14);
    documentId = `AnNER-RDF_${currentTime}`;
  } else {
    // ensure we can safely slice
    if (typeof firstParaId !== 'string') {
      throw new Error(`❌ Document ID is not valid. Got: ${firstParaId}`);
    }

    if (firstParaId.startsWith('AnNER')) {
      documentId = firstParaId.substring(0, 22);
    } else {
      documentId = firstParaId.substring(0, firstParaId.length - 2);
    }
  }

  // get latest review number
  const currentRv = getCurrentRv(data);

  // initialize paragraph id
  let paragraphId = 1;

  for (const annotation of data.annotations) {
    let paraId = annotation[0];
    const paraText = annotation[1];
    const entities = annotation[2];

    // assign paragraph id if doesn't have any
    if (paraId === null) {
      paraId = `${documentId}_p${paragraphId}`;
      annotation[0] = paraId;
    }

    paragraphId++;

    // initialize entity id
    let entityId = 1;

    for (const entity of entities.entities) {
      let entId = entity[0];
      const start = entity[1];
      const end = entity[2];
      const statusList = entity[3];

      // assign entity id if doesn't have any
      if (entId === null) {
        if (currentRv === 0) {
          entId = `${paraId}_e${entityId}`;
          entity[0] = entId;
        } else {
          entId = `${paraId}_e${entityId}_Rv${currentRv}`;
          entity[0] = entId;
        }
      }

      entityId++;
    }
  }
  
  return [documentId, data];
}

function prefixes(): string {
  const PREFIX_ONNER = "@prefix onner: <http://purl.org/spatialai/onner/onner-full#> .\n";
  const PREFIX_DATA = "@prefix data: <http://purl.org/spatialai/onner/onner-full/data#> .\n";
  const PREFIX_RDF = "@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .\n";
  const PREFIX_RDFS = "@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .\n";
  const PREFIX_XSD = "@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .\n";
  const PREFIX_OWL = "@prefix owl: <http://www.w3.org/2002/07/owl#> .\n\n";
  
  return PREFIX_ONNER + PREFIX_DATA + PREFIX_RDF + PREFIX_RDFS + PREFIX_XSD + PREFIX_OWL;
}

// RDF WRITER FOR NAMED ENTITIES
function entityReprCellograph(annData: AnnotationData): string {
  let rdf = prefixes();
  const labelsInDoc: [number, string][] = [];
  const labelingSchema = [
    'CHEMICAL',
    'MATERIAL', 
    'STRUCTURE',
    'PROPERTY',
    'APPLICATION',
    'PROCESS',
    'EQUIPMENT',
    'MEASUREMENT',
    'ABBREVIATION'
  ];

  for (const ann of annData.annotations) {
    const paragraphId = ann[0];
    const paragraphText = ann[1];
    const entities = ann[2];
    
    if (entities.entities.length > 0) {
      const entityIds = entities.entities.map(entity => `data:${entity[0]}`);
      const entityIdsJoined = entityIds.join(', ');

      rdf += `data:${paragraphId} onner:directlyContainsLabeledTerm ${entityIdsJoined} .\n\n`;

      for (const entity of entities.entities) {
        const entityId = entity[0];
        const start = entity[1];
        const end = entity[2];
        const statusList = entity[3];
        const entitySpan = paragraphText.substring(start, end);
        const length = end - start;

        const status = statusList.map(record => `data:${record[1]}_${entityId}`);
        const statusJoined = status.join(', ');

        rdf += `data:${entityId} rdf:type onner:LabeledTerm ;\n`;    // deal with atomic and compound terms
        rdf += `onner:labeledTermText '${entitySpan}'^^xsd:string ;\n`;
        rdf += `onner:offset '${start}'^^xsd:nonNegativeInteger ;\n`;
        rdf += `onner:length '${length}'^^xsd:nonNegativeInteger ;\n`;
        rdf += `onner:labeledTermDirectlyContainedBy data:${paragraphId} ;\n`;
        rdf += `onner:hasLabeledTermStatus ${statusJoined} .\n\n`;

        for (const record of statusList) {
          const label = record[0];
          const status = record[1];
          const datetime = record[2];
          const annotator = record[3];
          const labelNumberInSchema = labelingSchema.indexOf(label) + 1;

          rdf += `data:Candidate_${entityId} rdf:type onner:CandidateStatus ;\n`;
          rdf += `onner:statusAssignmentDate '${datetime}'^^xsd:dateTime ;\n`;
          rdf += `onner:statusAssignedBy '${annotator}'^^xsd:string ;\n`;
          rdf += `onner:hasLabeledTermLabel data:Label_${labelNumberInSchema} .\n\n`;

          // adding labels and their positions in the schema
          const labelEntry: [number, string] = [labelNumberInSchema, label];
          if (!labelsInDoc.some(item => item[0] === labelNumberInSchema && item[1] === label)) {
            labelsInDoc.push(labelEntry);
          }
        }
      }
    } else {
      rdf += `data:${paragraphId} onner:directlyContainsLabeledTerm data:NoLabeledTerm .\n\n`;    
    }
  }
  
  if (labelsInDoc.length > 0) {
    for (const item of labelsInDoc) {
      rdf += `data:Label_${item[0]} rdf:type onner:Label ;\n`;
      rdf += `onner:fromLabelingSchema data:Labeling_Schema ;\n`;
      rdf += `onner:labelText '${item[1]}'^^xsd:string .\n\n`;     
    }
  } else {
    console.log('List of labels found in document is empty!\n');
  }

  rdf += `data:Labeling_Schema rdf:type onner:LabelingSchema ;\n`;
  rdf += `onner:schemaName 'CelloGraph'^^xsd:string .\n\n`;

  rdf += `data:Cellulosic_NER_Model rdf:type onner:NER_System ;\n`;    // if/else required to identify system and human
  rdf += `onner:systemVersion '1.0'^^xsd:string .\n\n`;
  
  return rdf;
}

// RDF WRITER FOR NAMED ENTITIES
function entityReprAnner(docId: string, annData: AnnotationData): string {
  let rdf = prefixes();
  const labelsInDoc: [number, string][] = [];
  const labelingSchema = [
    'CHEMICAL',
    'MATERIAL', 
    'STRUCTURE',
    'PROPERTY',
    'APPLICATION',
    'PROCESS',
    'EQUIPMENT',
    'MEASUREMENT',
    'ABBREVIATION'
  ];

  const paragraphIds: string[] = [];
  
  for (const ann of annData.annotations) {
    paragraphIds.push(`data:${ann[0]}`);
  }
  
  const directlyContainedParagraphs = paragraphIds.join(', ');
      
  rdf += `data:Publication_${docId} rdf:type onner:ScholarlyPublication ;\n`;
  rdf += `onner:publicationTitle 'any title??'^^xsd:string ;\n`;
  rdf += `onner:publicationDate 'current date??'^^xsd:date ;\n`;
  rdf += `onner:doi 'No DOI??'^^xsd:string ;\n`;
  rdf += `onner:directlyContainsDocumentPart ${directlyContainedParagraphs} .\n\n`;
  
  for (const ann of annData.annotations) {
    const paragraphId = ann[0];
    const paragraphText = ann[1];
    const entities = ann[2];
    const paragraphNumber = paragraphId!.split('_').pop()!.substring(1);
    
    rdf += `data:${paragraphId} rdf:type onner:Paragraph ;\n`;
    rdf += `onner:positionInParentDocumentPart '${paragraphNumber}'^^xsd:nonNegativeInteger ;\n`;

    if (parseInt(paragraphNumber) < paragraphIds.length) {
      rdf += `onner:nextDocumentPart ${paragraphIds[parseInt(paragraphNumber)]} ;\n`;
    } else {
      rdf += `onner:nextDocumentPart data:${docId}_EndOfDocument ;\n`;
    }

    rdf += `onner:paragraphText '${paragraphText}'^^xsd:string ;\n`;
    
    if (entities.entities.length > 0) {
      const entityIds = entities.entities.map(entity => `data:${entity[0]}`);
      const entityIdsJoined = entityIds.join(', ');

      rdf += `onner:directlyContainsLabeledTerm ${entityIdsJoined} .\n\n`;

      for (const entity of entities.entities) {
        const entityId = entity[0];
        const start = entity[1];
        const end = entity[2];
        const statusList = entity[3];
        const entitySpan = paragraphText.substring(start, end);
        const length = end - start;

        const status = statusList.map(record => `data:${record[1]}_${entityId}`);
        const statusJoined = status.join(', ');

        rdf += `data:${entityId} rdf:type onner:LabeledTerm ;\n`;    // deal with atomic and compound terms
        rdf += `onner:labeledTermText '${entitySpan}'^^xsd:string ;\n`;
        rdf += `onner:offset '${start}'^^xsd:nonNegativeInteger ;\n`;
        rdf += `onner:length '${length}'^^xsd:nonNegativeInteger ;\n`;
        rdf += `onner:labeledTermDirectlyContainedBy data:${paragraphId} ;\n`;
        rdf += `onner:hasLabeledTermStatus ${statusJoined} .\n\n`;

        for (const record of statusList) {
          const label = record[0];
          const status = record[1];
          const datetime = record[2];
          const annotator = record[3];
          const labelNumberInSchema = labelingSchema.indexOf(label) + 1;
          
          rdf += `data:Candidate_${entityId} rdf:type onner:CandidateStatus ;\n`;
          rdf += `onner:statusAssignmentDate '${datetime}'^^xsd:dateTime ;\n`;
          rdf += `onner:statusAssignedBy '${annotator}'^^xsd:string ;\n`;
          rdf += `onner:hasLabeledTermLabel data:Label_${labelNumberInSchema} .\n\n`;

          // adding labels and their positions in the schema
          const labelEntry: [number, string] = [labelNumberInSchema, label];
          if (!labelsInDoc.some(item => item[0] === labelNumberInSchema && item[1] === label)) {
            labelsInDoc.push(labelEntry);
          }
        }
      }
    } else {
      rdf += `onner:directlyContainsLabeledTerm data:NoLabeledTerm .\n\n`;    
    }
  }
  
  rdf += `data:${docId}_EndOfDocument rdf:type onner:EndOfDocument .\n`;
  
  if (labelsInDoc.length > 0) {
    for (const item of labelsInDoc) {
      rdf += `data:Label_${item[0]} rdf:type onner:Label ;\n`;
      rdf += `onner:fromLabelingSchema data:Labeling_Schema ;\n`;
      rdf += `onner:labelText '${item[1]}'^^xsd:string .\n\n`;     
    }
  } else {
    console.log('List of labels found in document is empty!\n');
  }

  rdf += `data:Labeling_Schema rdf:type onner:LabelingSchema ;\n`;
  rdf += `onner:schemaName 'CelloGraph'^^xsd:string .\n\n`;

  rdf += `data:Cellulosic_NER_Model rdf:type onner:NER_System ;\n`;    // if/else required to identify system and human
  rdf += `onner:systemVersion '1.0'^^xsd:string .\n\n`;
  
  return rdf;
}

// Main execution
const [docId, annData] = idResolver('./test.json');

let rdf: string;
if (docId.startsWith('AnNER')) {
  rdf = entityReprAnner(docId, annData);
} else {
  rdf = entityReprCellograph(annData);
}

console.log(rdf);