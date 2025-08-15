import classes from './FileUploadComponent.module.css';

import React, { useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';

// function FileUploadComponent() {
//   const { getRootProps, getInputProps } = useDropzone({
//     onDrop: (acceptedFiles) => {
//       if (acceptedFiles.length > 2) {
//         alert("You can only upload a maximum of 2 resumes at a time.");
//         return;
//       } else {
//         // Add logic to upload files
//         console.log(acceptedFiles);
//       }
//     },
//   });

//   return (
//     <div {...getRootProps()} className={classes.file_input}>
//       <input {...getInputProps()} />
//       <p>
//         You can either click to browse and select firles, or simply drag and
//         drop them into this area.
//       </p>
//     </div>
//   );
// }

// export default FileUploadComponent;

function FileUploadComponent(props: FileUploadProps) {
  const { required, name } = props;

  const hiddenInputRef = useRef(null);

  const { getRootProps, getInputProps, open, acceptedFiles } = useDropzone({
    onDrop: (incomingFiles) => {
      if (hiddenInputRef.current) {
        // Note the specific way we need to munge the file into the hidden input
        // https://stackoverflow.com/a/68182158/1068446
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
