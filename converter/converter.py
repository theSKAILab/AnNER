
import json
from datetime import datetime

def get_current_rv(data):
    '''
    Determine the current review number (Rv) for the given annotation data to
    assign IDs to suggested entities. The function scans all entity IDs and checks
    for review suffixes (e.g., '_Rv1', '_Rv2').

    Logic:
    - If the first paragraph ID, data['annotations'][0][0], is non-null:
        - Iterate through all entity IDs.
            - If at least one null entity ID is found, set flag = 1.
            - If an entity ID ends with "_Rv#", extract the review number and store it.
        - If flag = 1:
            - If review_numbers is not empty (file was reviewed before):
                - Return max(review_numbers) + 1 (current review number).
            - If review_numbers is empty (first review):
                - Return 1.
    - If the first paragraph ID is null, return 0.

    Parameters:
        dict: Annotation data converted from JSON.

    Returns:
        int: Current review number to assign, or 0 if no review is needed.
    '''
        
    if data['annotations'][0][0] is not None:
        review_numbers = []
        null_flag = 0

        for annotation in data['annotations']: 
            for entity in annotation[2]['entities']:
                ent_id = entity[0]
                
                # check null id; if a null id found, set null_flag = 1
                if ent_id is None and null_flag == 0:
                    null_flag = 1

                if ent_id is not None:
                    ent_id_parts = ent_id.split('_')

                    if ent_id_parts[-1][0:2] == 'Rv':
                        review_numbers.append(int(ent_id_parts[-1][2:]))

        if null_flag == 1:
            if review_numbers:
                return max(review_numbers) + 1
            else:
                return 1
    
    return 0
    

def id_resolver(anner_json):
    '''
    Resolve and assign IDs for the document, paragraphs, and entities in the
    given annotation JSON file. Ensures that missing IDs are generated based on
    the source of the JSON and review status.

    Logic:
    - If the first paragraph ID is null:
        - JSON is generated from AnNER's annotation mode.
        - All paragraph IDs and entity IDs are null.
        - ACTION: Assign IDs to all paragraphs and entities.

    - If the first paragraph ID starts with 'AnNER':
        - JSON is generated from AnNER's annotation mode.
        - All paragraphs already have IDs.
        - Most entities have IDs, but some suggested ones may not.
        - ACTION: Assign IDs only to missing entities (check review number first).

    - If the first paragraph ID starts with something else:
        - JSON is generated from CelloGraph's RDF-to-JSON converter.
        - All paragraphs already have IDs.
        - Entities may or may not have IDs (candidates or suggested).
        - ACTION: Assign IDs only to missing entities (check review number first).

    Parameters:
        str: Path to the annotation JSON file.

    Returns:
        tuple:
            str: Resolved document ID.
            dict: Updated annotation data with IDs assigned.
    '''
        
    # reading annotations in json format
    with open(f'{anner_json}', 'r', encoding='utf-8') as file:
        data = json.load(file)
        
    # create document id
    first_para_id = data['annotations'][0][0]
    
    if first_para_id is None:
        current_time = datetime.now().strftime("%y%m%d%H%M%S")
        document_id = f'AnNER-RDF_{current_time}'
    else:
        # ensure we can safely slice
        if not isinstance(first_para_id, str):
            raise ValueError(f'❌ Document ID is not valid. Got: {first_para_id}')

        if first_para_id.startswith('AnNER'):
            document_id = first_para_id[:22]
        else:
            document_id = first_para_id[:-2]

    # get latest review number
    current_rv = get_current_rv(data)

    # initialize paragraph id
    paragraph_id = 1

    for annotation in data['annotations']:
        para_id, para_text, entities = annotation

        # assign paragraph id if doesn't have any
        if para_id is None:
            para_id = f'{document_id}_p{paragraph_id}'
            annotation[0] = para_id

        paragraph_id += 1

        # initialize entity id
        entity_id = 1

        for entity in entities['entities']:
            ent_id, start, end, status_list = entity

            # assign entity id if doesn't have any
            if ent_id is None:
                if current_rv == 0:
                    ent_id = f'{para_id}_e{entity_id}'
                    entity[0] = ent_id
                else:
                    ent_id = f'{para_id}_e{entity_id}_Rv{current_rv}'
                    entity[0] = ent_id

            entity_id += 1
            
    return document_id, data

def prefixes():

    PREFIX_ONNER = "@prefix onner: <http://purl.org/spatialai/onner/onner-full#> .\n"
    PREFIX_DATA = "@prefix data: <http://purl.org/spatialai/onner/onner-full/data#> .\n"
    PREFIX_RDF = "@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .\n"
    PREFIX_RDFS = "@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .\n"
    PREFIX_XSD = "@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .\n"
    PREFIX_OWL = "@prefix owl: <http://www.w3.org/2002/07/owl#> .\n\n"
    
    return PREFIX_ONNER + PREFIX_DATA + PREFIX_RDF + PREFIX_RDFS + PREFIX_XSD + PREFIX_OWL

# RDF WRITER FOR NAMED ENTITIES
def entity_repr_cellograph(ann_data):
    rdf = prefixes()
    labels_in_doc = []
    labeling_schema = ['CHEMICAL',
                       'MATERIAL', 
                       'STRUCTURE',
                       'PROPERTY',
                       'APPLICATION',
                       'PROCESS',
                       'EQUIPMENT',
                       'MEASUREMENT',
                       'ABBREVIATION']

    for ann in ann_data['annotations']:
        paragraph_id, paragraph_text, entities = ann
        
        if entities['entities']:
            entity_ids = [f'data:{entity[0]}' for entity in entities['entities']]
            entity_ids_joined = ', '.join(entity_ids)

            rdf += f"data:{paragraph_id} onner:directlyContainsLabeledTerm {entity_ids_joined} .\n\n"

            for entity in entities['entities']:
                entity_id, start, end, status_list = entity
                entity_span = paragraph_text[start:end]
                length = end - start

                status = [f'data:{record[1]}_{entity_id}' for record in status_list]
                status_joined = ', '.join(status)

                rdf += f"data:{entity_id} rdf:type onner:LabeledTerm ;\n"    # deal with atomic and compound terms
                rdf += f"onner:labeledTermText '{entity_span}'^^xsd:string ;\n"
                rdf += f"onner:offset '{start}'^^xsd:nonNegativeInteger ;\n"
                rdf += f"onner:length '{length}'^^xsd:nonNegativeInteger ;\n"
                rdf += f"onner:labeledTermDirectlyContainedBy data:{paragraph_id} ;\n"
                rdf += f"onner:hasLabeledTermStatus {status_joined} .\n\n"

                for record in status_list:
                    label, status, datetime_, annotator = record
                    label_number_in_schema = labeling_schema.index(label) + 1

                    rdf += f"data:Candidate_{entity_id} rdf:type onner:CandidateStatus ;\n"
                    rdf += f"onner:statusAssignmentDate '{datetime_}'^^xsd:dateTime ;\n"
                    rdf += f"onner:statusAssignedBy '{annotator}'^^xsd:string ;\n"
                    rdf += f"onner:hasLabeledTermLabel data:Label_{label_number_in_schema} .\n\n"

                    # adding lebels and their positions in the schema
                    if [label_number_in_schema, label] not in labels_in_doc:
                        labels_in_doc.append([label_number_in_schema, label])
                    
        else:
            rdf += f"data:{paragraph_id} onner:directlyContainsLabeledTerm data:NoLabeledTerm .\n\n"    
    
    if labels_in_doc:
        for item in labels_in_doc:
            rdf += f"data:Label_{item[0]} rdf:type onner:Label ;\n"
            rdf += f"onner:fromLabelingSchema data:Labeling_Schema ;\n"
            rdf += f"onner:labelText '{item[1]}'^^xsd:string .\n\n"     
    else:
        print('List of labels found in document is empty!\n')

    rdf += f"data:Labeling_Schema rdf:type onner:LabelingSchema ;\n"
    rdf += f"onner:schemaName 'CelloGraph'^^xsd:string .\n\n"

    rdf += f"data:Cellulosic_NER_Model rdf:type onner:NER_System ;\n"    # if/else required to identify system and human
    rdf += f"onner:systemVersion '1.0'^^xsd:string .\n\n"
    
    return rdf

# RDF WRITER FOR NAMED ENTITIES
def entity_repr_anner(doc_id, ann_data):
    rdf = prefixes()
    labels_in_doc = []
    labeling_schema = ['CHEMICAL',
                       'MATERIAL', 
                       'STRUCTURE',
                       'PROPERTY',
                       'APPLICATION',
                       'PROCESS',
                       'EQUIPMENT',
                       'MEASUREMENT',
                       'ABBREVIATION']

    paragraph_ids = []
    
    for ann in ann_data['annotations']:
        paragraph_ids.append(f'data:{ann[0]}')
    
    directly_contained_paragraphs = ', '.join(paragraph_ids)
        
    rdf += f"data:Publication_{doc_id} rdf:type onner:ScholarlyPublication ;\n"
    rdf += f"onner:publicationTitle 'any title??'^^xsd:string ;\n"
    rdf += f"onner:publicationDate 'current date??'^^xsd:date ;\n"
    rdf += f"onner:doi 'No DOI??'^^xsd:string ;\n"
    rdf += f"onner:directlyContainsDocumentPart {directly_contained_paragraphs} .\n\n"
    
    
    for ann in ann_data['annotations']:
        paragraph_id, paragraph_text, entities = ann
        paragraph_number = paragraph_id.split('_')[-1][1:]
        
        rdf += f"data:{paragraph_id} rdf:type onner:Paragraph ;\n"
        rdf += f"onner:positionInParentDocumentPart '{paragraph_number}'^^xsd:nonNegativeInteger ;\n"

        if int(paragraph_number) < len(paragraph_ids):
            rdf += f"onner:nextDocumentPart {paragraph_ids[int(paragraph_number)]} ;\n"
        else:
            rdf += f"onner:nextDocumentPart data:{doc_id}_EndOfDocument ;\n"

        rdf += f"onner:paragraphText '{paragraph_text}'^^xsd:string ;\n"
        
        if entities['entities']:
            entity_ids = [f'data:{entity[0]}' for entity in entities['entities']]
            entity_ids_joined = ', '.join(entity_ids)

            rdf += f"onner:directlyContainsLabeledTerm {entity_ids_joined} .\n\n"

            for entity in entities['entities']:
                entity_id, start, end, status_list = entity
                entity_span = paragraph_text[start:end]
                length = end - start

                status = [f'data:{record[1]}_{entity_id}' for record in status_list]
                status_joined = ', '.join(status)

                rdf += f"data:{entity_id} rdf:type onner:LabeledTerm ;\n"    # deal with atomic and compound terms
                rdf += f"onner:labeledTermText '{entity_span}'^^xsd:string ;\n"
                rdf += f"onner:offset '{start}'^^xsd:nonNegativeInteger ;\n"
                rdf += f"onner:length '{length}'^^xsd:nonNegativeInteger ;\n"
                rdf += f"onner:labeledTermDirectlyContainedBy data:{paragraph_id} ;\n"
                rdf += f"onner:hasLabeledTermStatus {status_joined} .\n\n"

                for record in status_list:
                    label, status, datetime_, annotator = record
                    label_number_in_schema = labeling_schema.index(label) + 1
                    
                    rdf += f"data:Candidate_{entity_id} rdf:type onner:CandidateStatus ;\n"
                    rdf += f"onner:statusAssignmentDate '{datetime_}'^^xsd:dateTime ;\n"
                    rdf += f"onner:statusAssignedBy '{annotator}'^^xsd:string ;\n"
                    rdf += f"onner:hasLabeledTermLabel data:Label_{label_number_in_schema} .\n\n"

                    # adding lebels and their positions in the schema
                    if [label_number_in_schema, label] not in labels_in_doc:
                        labels_in_doc.append([label_number_in_schema, label])
                    
        else:
            rdf += f"onner:directlyContainsLabeledTerm data:NoLabeledTerm .\n\n"    
    
    rdf += f"data:{doc_id}_EndOfDocument rdf:type onner:EndOfDocument .\n"
    
    if labels_in_doc:
        for item in labels_in_doc:
            rdf += f"data:Label_{item[0]} rdf:type onner:Label ;\n"
            rdf += f"onner:fromLabelingSchema data:Labeling_Schema ;\n"
            rdf += f"onner:labelText '{item[1]}'^^xsd:string .\n\n"     
    else:
        print('List of labels found in document is empty!\n')

    rdf += f"data:Labeling_Schema rdf:type onner:LabelingSchema ;\n"
    rdf += f"onner:schemaName 'CelloGraph'^^xsd:string .\n\n"

    rdf += f"data:Cellulosic_NER_Model rdf:type onner:NER_System ;\n"    # if/else required to identify system and human
    rdf += f"onner:systemVersion '1.0'^^xsd:string .\n\n"
    
    return rdf

doc_id, ann_data = id_resolver('./test.json')

if doc_id.startswith('AnNER'):
    rdf = entity_repr_anner(doc_id, ann_data)
else:
    rdf = entity_repr_cellograph(ann_data)

print(rdf)