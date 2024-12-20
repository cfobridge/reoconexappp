import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

const JDMEditor = () => {
  const [jsonModel, setJsonModel] = useState({
    id: uuidv4(),
    data: {},
  });

  const handleInputChange = (path, value) => {
    const updateModel = { ...jsonModel };
    let target = updateModel;

    path.slice(0, -1).forEach((key) => {
      if (!target[key]) target[key] = {};
      target = target[key];
    });

    target[path[path.length - 1]] = value;
    setJsonModel(updateModel);
  };

  const renderField = (key, value, path = []) => {
    const currentPath = [...path, key];

    if (typeof value === 'object' && value !== null) {
      return (
        <div key={uuidv4()} style={{ paddingLeft: '20px' }}>
          <h4>{key}</h4>
          {Object.keys(value).map((subKey) => renderField(subKey, value[subKey], currentPath))}
          <button onClick={() => addField(currentPath)}>Add Field</button>
        </div>
      );
    }

    return (
      <div key={uuidv4()} style={{ paddingLeft: '20px' }}>
        <label>
          {key}:
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleInputChange(currentPath, e.target.value)}
          />
        </label>
        <button onClick={() => deleteField(currentPath)}>Delete</button>
      </div>
    );
  };

  const addField = (path) => {
    const newFieldKey = prompt("Enter field name:");
    const newFieldValue = prompt("Enter field value:");

    if (newFieldKey && newFieldValue) {
      const updateModel = { ...jsonModel };
      let target = updateModel;

      path.forEach((key) => {
        if (!target[key]) target[key] = {};
        target = target[key];
      });

      target[newFieldKey] = newFieldValue;
      setJsonModel(updateModel);
    }
  };

  const deleteField = (path) => {
    const updateModel = { ...jsonModel };
    let target = updateModel;
    path.slice(0, -1).forEach((key) => {
      target = target[key];
    });

    delete target[path[path.length - 1]];
    setJsonModel(updateModel);
  };

  return (
    <div>
      <h2>JSON Data Model Editor</h2>
      <div>{Object.keys(jsonModel.data).map((key) => renderField(key, jsonModel.data[key]))}</div>
      <button onClick={() => addField([])}>Add Root Field</button>
      <pre>{JSON.stringify(jsonModel, null, 2)}</pre>
    </div>
  );
};

export default JDMEditor;
