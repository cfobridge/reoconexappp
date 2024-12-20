// FileUploadPopup.js
import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  Label,
  Input,
  Row,
  Col,
} from 'reactstrap';
import Papa from 'papaparse';
import { useAuth } from '../auth/AuthContext';
import './style.css';

const FileUploadPopup = () => {
  const { user, token, setFileSchema, fileSchemaData } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [templateSelector, setTemplateSelector] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // formData holds the file name, saveTemplate as boolean, and fileSchema
  const [formData, setFormData] = useState({
    fileName: '',
    saveTemplate: false, // true = save as template, false = do not save
    fileSchema: [],
  });

  // Ensure clientFileSchemas is an array and saveTemplate is boolean
  const clientFileSchemas = Array.isArray(fileSchemaData.clientFileSchemas)
    ? fileSchemaData.clientFileSchemas
        .filter(
          (schema) =>
            schema.saveTemplate === true || schema.saveTemplate === 'true'
        )
        .map((schema) => ({
          ...schema,
          saveTemplate:
            schema.saveTemplate === true || schema.saveTemplate === 'true',
        }))
    : [];

  // Fetch file schemas when user and token are available
  useEffect(() => {
    if (user && token) {
      fetchFileSchema(user.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token]);

  // Debugging: Log fetched file schemas
  useEffect(() => {
    console.log('clientFileSchemas:', clientFileSchemas);
  }, [clientFileSchemas]);

  // Handle template selection changes
  useEffect(() => {
    if (templateSelector) {
      const selectedTemplate = clientFileSchemas.find(
        (s) => s.fileSchemaId && s.fileSchemaId.toString() === templateSelector
      );

      if (selectedTemplate && selectedTemplate.fileSchema) {
        // Populate fileSchema with default dataType as 'STRING' if missing
        const populatedSchema = selectedTemplate.fileSchema.map((col) => ({
          columnName: col.columnName || '',
          dataType: col.dataType || 'STRING', // Default to 'STRING' if dataType is missing
          datetimeFormat: col.datetimeFormat || '',
        }));

        setFormData((prevState) => ({
          ...prevState,
          fileSchema: populatedSchema,
        }));
        // **Do not clear the CSV file when a template is selected**
        console.log('Selected Template:', selectedTemplate);
        console.log('File Schema Set from Template:', populatedSchema);
      }
    } else {
      // Clear schema if no template is selected and no CSV is uploaded
      if (!csvFile) {
        setFormData((prevState) => ({
          ...prevState,
          fileSchema: [],
        }));
        console.log('No template selected and no CSV uploaded. Cleared fileSchema.');
      }
    }
  }, [templateSelector, clientFileSchemas, csvFile]);

  // Handle CSV file drop
  const onDrop = (acceptedFiles) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile && selectedFile.type !== 'text/csv') {
      alert('Please upload a valid CSV file.');
      return;
    }

    setCsvFile(selectedFile);
    console.log('CSV File Uploaded:', selectedFile.name);

    if (templateSelector) {
      // If a template is selected, populate schema from the template
      const selectedTemplate = clientFileSchemas.find(
        (s) => s.fileSchemaId && s.fileSchemaId.toString() === templateSelector
      );

      if (selectedTemplate && selectedTemplate.fileSchema) {
        const populatedSchema = selectedTemplate.fileSchema.map((col) => ({
          columnName: col.columnName || '',
          dataType: col.dataType || 'STRING', // Default to 'STRING' if dataType is missing
          datetimeFormat: col.datetimeFormat || '',
        }));

        setFormData((prevState) => ({
          ...prevState,
          fileSchema: populatedSchema,
        }));
        console.log('Schema set from selected template.');
      } else {
        console.warn('Selected template does not have a fileSchema.');
      }
    } else {
      // If no template is selected, parse CSV headers to define schema
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.data && results.data.length > 0) {
            const headers = Object.keys(results.data[0]);
            const schema = headers.map((header) => ({
              columnName: header || '',
              dataType: 'STRING', // Default to 'STRING'
              datetimeFormat: '', // Initialize as empty string
            }));

            setFormData((prevState) => ({
              ...prevState,
              fileSchema: schema,
            }));
            console.log('Schema set from CSV headers:', schema);
          }
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
          alert('Failed to parse CSV file. Please try again.');
        },
      });
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: '.csv',
    disabled: isLoading,
    // CSV upload is always enabled, but disabled if loading
  });

  // Handle input changes for file name and other fields
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
    console.log(`Form input changed: ${name} = ${value}`);
  };

  // Handle changes to the "Save Template" checkbox
  const handleSaveTemplateChange = (e) => {
    const checked = e.target.checked;
    setFormData((prevState) => ({
      ...prevState,
      saveTemplate: checked,
    }));
    console.log(`Save Template Checkbox changed: ${checked}`);

    // If "Do Not Save" is selected and no CSV is uploaded, clear the schema
    if (!checked && !csvFile) {
      setFormData((prev) => ({
        ...prev,
        fileSchema: [],
      }));
      console.log('Save Template unchecked and no CSV uploaded. Cleared fileSchema.');
    }
  };

  // Handle changes to the schema fields
  const handleSchemaChange = (index, field, value) => {
    const updatedSchema = [...formData.fileSchema];
    updatedSchema[index][field] = value;
    setFormData((prevState) => ({
      ...prevState,
      fileSchema: updatedSchema,
    }));
    console.log(`Schema changed at index ${index}: ${field} = ${value}`);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    console.log('Form submission started.');

    if (!csvFile) {
      alert('Please upload a CSV file to continue.');
      setIsLoading(false);
      console.log('Form submission aborted: No CSV file uploaded.');
      return;
    }

    // Map the frontend formData to the backend expected property names
    const finalSchema = {
      fileName: formData.fileName,
      userId: user?.id || '6',
      saveTemplate: formData.saveTemplate,
      fileSchema: formData.fileSchema.map((col) => ({
        columnName: col.columnName,
        dataType: col.dataType,
        datetimeFormat: col.datetimeFormat,
      })),
    };

    if (templateSelector) {
      const selectedTemplate = clientFileSchemas.find(
        (s) => s.fileSchemaId && s.fileSchemaId.toString() === templateSelector
      );

      if (selectedTemplate) {
        finalSchema.fileSchemaId = selectedTemplate.fileSchemaId;
      }
    }

    const formDataToSend = new FormData();
    // Append file always if csvFile is present
    formDataToSend.append('file', csvFile);
    console.log('CSV file appended to form data:', csvFile.name);

    // Append the schema as a JSON string
    formDataToSend.append('schema', JSON.stringify(finalSchema));
    console.log('Form data appended:', finalSchema);

    // Replace with environment variable if needed
    const uploadUrl = 'http://34.70.96.246:8080/api/reconciliation/upload';

    try {
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          // Note: Do not set 'Content-Type' header when sending FormData
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Network response was not ok');
      }

      const result = await response.json();
      console.log('Upload result:', result);
      alert('Files uploaded successfully!');

      await fetchFileSchema(user.id);
      console.log('File schemas refreshed.');

      setIsOpen(false);
      console.log('Modal closed.');
    } catch (error) {
      console.error('Error uploading files:', error);
      alert(
        error.message ||
          'An error occurred while uploading the files. Please try again.'
      );
    } finally {
      setIsLoading(false);
      console.log('Form submission ended.');
    }
  };

  // Fetch file schemas from the API with saveTemplate=true
  const fetchFileSchema = async (userId) => {
    setIsLoading(true);
    console.log('Fetching file schemas from API.');

    // Assuming the API supports filtering by saveTemplate via query parameters
    const schemaUrl = `http://34.70.96.246:8080/api/reconciliation/file_schemas?user_id=${userId}&save_template=true`;

    try {
      const response = await fetch(schemaUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to fetch file schema');
      }

      const schemaData = await response.json();
      setFileSchema(schemaData);
      console.log('Fetched file schema:', schemaData);
    } catch (error) {
      console.error('Error fetching file schema:', error);
      alert(
        error.message ||
          'An error occurred while fetching the file schemas. Please try again.'
      );
    } finally {
      setIsLoading(false);
      console.log('Fetching file schemas completed.');
    }
  };

  // Clear form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCsvFile(null);
      setFormData({
        fileName: '',
        saveTemplate: false,
        fileSchema: [],
      });
      setTemplateSelector('');
      console.log('Form reset upon modal close.');
    }
  }, [isOpen]);

  const isUsingTemplate = templateSelector !== '';
  const canSubmit = csvFile !== null && formData.fileSchema.length > 0;

  console.log(`isUsingTemplate: ${isUsingTemplate}, canSubmit: ${canSubmit}`);

  return (
    <div>
      <Button color="primary" onClick={() => setIsOpen(true)}>
        Upload File
      </Button>
      <Modal isOpen={isOpen} toggle={() => setIsOpen(false)} centered size="lg">
        <ModalHeader toggle={() => setIsOpen(false)}>Upload CSV File</ModalHeader>
        <ModalBody>
          <Form onSubmit={handleSubmit}>

            

            {/* CSV Upload */}
            <FormGroup>
              <Label for="csvFile">CSV File:</Label>
              <div
                {...getRootProps({ className: 'dropzone' })}
                style={{
                  border: '2px dashed #cccccc',
                  padding: '20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                }}
              >
                <input {...getInputProps()} />
                {csvFile ? (
                  <p>{csvFile.name}</p>
                ) : (
                  <p>Drag & drop a CSV file here, or click to select one</p>
                )}
              </div>
            </FormGroup>
            {/* File Name Input */}
            <FormGroup>
              <Label for="fileName">File Name:</Label>
              <Input
                type="text"
                name="fileName"
                id="fileName"
                value={formData.fileName}
                onChange={handleInputChange}
                required
              />
            </FormGroup>

            

{/* Template Selector */}
<FormGroup>
              <Label for="SelectedTemplate">Select Template:</Label>
              <Input
                type="select"
                id="SelectedTemplate"
                name="SelectedTemplate"
                value={templateSelector}
                onChange={(e) => {
                  setTemplateSelector(e.target.value);
                }}
                disabled={isLoading}
              >
                <option value="">-- Select Template --</option>
                {clientFileSchemas.map((schema) => (
                  <option
                    key={schema.fileSchemaId || schema.fileName}
                    value={schema.fileSchemaId || schema.fileName}
                  >
                    {schema.fileName}
                  </option>
                ))}
              </Input>
            </FormGroup>

            {/* Save Template Checkbox - only show if no template is selected */}
            {!isUsingTemplate && (
              <FormGroup check>
                <Label check>
                  <Input
                    type="checkbox"
                    name="saveTemplate"
                    id="saveTemplate"
                    checked={formData.saveTemplate}
                    onChange={handleSaveTemplateChange}
                  />
                  Save as Template
                </Label>
              </FormGroup>
            )}
            {/* Define Column Data Types */}
            {formData.fileSchema.length > 0 && (
              <FormGroup>
                <Label>Define Column Data Types:</Label>
                <div
                  style={{
                    maxHeight: '300px',
                    overflowY: 'auto',
                    border: '1px solid #e9ecef',
                    padding: '10px',
                    borderRadius: '4px',
                  }}
                >
                  {formData.fileSchema.map((schema, index) => (
                    <Row key={index} form className="align-items-center mb-2">
                      <Col md={4}>
                        <Label>{schema.columnName}</Label>
                      </Col>
                      <Col md={4}>
                        <Input
                          type="select"
                          name={`dataType-${index}`}
                          value={schema.dataType}
                          onChange={(e) =>
                            handleSchemaChange(index, 'dataType', e.target.value)
                          }
                          required
                        >
                          <option value="">-- Select Data Type --</option>
                          <option value="STRING">STRING</option>
                          <option value="NUMBER">NUMBER</option>
                          <option value="DATETIME">DATETIME</option>
                          <option value="DATE">DATE</option>
                        </Input>
                      </Col>
                      {(schema.dataType === 'DATETIME' ||
                        schema.dataType === 'DATE') && (
                        <Col md={4}>
                          <Input
                            type="select"
                            name={`datetimeFormat-${index}`}
                            value={schema.datetimeFormat}
                            onChange={(e) =>
                              handleSchemaChange(
                                index,
                                'datetimeFormat',
                                e.target.value
                              )
                            }
                            required
                          >
                            <option value="">-- Select Date Format --</option>
                            <option value="dd/MM/yyyy">dd/MM/yyyy</option>
                            <option value="MM/dd/yyyy">MM/dd/yyyy</option>
                            <option value="M/dd/yyyy">M/dd/yyyy</option>
                            <option value="M/d/yyyy">M/d/yyyy</option>
                            <option value="yyyy-MM-dd'T'HH:mm:ss">
                              yyyy-MM-dd'T'HH:mm:ss
                            </option>
                            <option value="yyyy-MM-dd">yyyy-MM-dd</option>
                          </Input>
                        </Col>
                      )}
                    </Row>
                  ))}
                </div>
              </FormGroup>
            )}

            {/* Modal Footer with Submit and Cancel Buttons */}
            <ModalFooter>
              <Button
                type="submit"
                color="primary"
                disabled={isLoading || !canSubmit}
              >
                {isLoading ? 'Uploading...' : 'Submit'}
              </Button>
              <Button color="secondary" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
            </ModalFooter>
          </Form>
        </ModalBody>
      </Modal>
    </div>
  );
};

export default FileUploadPopup;
