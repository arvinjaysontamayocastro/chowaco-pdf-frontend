import classes from './FileUploadComponent.module.css';

import React, { useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';

function FileUploadComponent(props: FileUploadProps) {
  const { required, name } = props;

  const hiddenInputRef = useRef(null);

  const { getRootProps, getInputProps, open, acceptedFiles } = useDropzone({
    onDrop: (incomingFiles) => {
      if (hiddenInputRef.current) {
        const dataTransfer = new DataTransfer();
        incomingFiles.forEach((v) => {
          dataTransfer.items.add(v);
        });
        hiddenInputRef.current.files = dataTransfer.files;
      }
    },
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
  });

  const files = acceptedFiles.map((file) => (
    <li key={file.path}>
      {file.path} - {file.size} bytes
    </li>
  ));

  const fileCount = acceptedFiles.length;

  return (
    <div className={classes.container}>
      <div {...getRootProps({ className: 'dropzone' })}>
        {/*
          Add a hidden file input 
          Best to use opacity 0, so that the required validation message will appear on form submission
        */}
        <input
          type="file"
          name={name}
          required={required}
          style={{ opacity: 0 }}
          ref={hiddenInputRef}
        />
        <input {...getInputProps()} />
        <p>Drag 'n' drop your PDF file here</p>
        <button type="button" onClick={open}>
          Open File Dialog
        </button>
      </div>
      <aside>
        <h4>{fileCount ? 'File' : 'No file yet'}</h4>
        <ul>{files}</ul>
      </aside>
    </div>
  );
}
export default FileUploadComponent;
