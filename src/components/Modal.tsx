import React, { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import classes from './Charts.module.css';

interface ModalProps {
  children?: ReactNode;
}

function Modal({ children }: ModalProps) {
  const navigate = useNavigate();

  function closeHandler() {
    navigate('..');
  }

  return (
    <>
      <div
        className={classes.backdrop}
        onClick={closeHandler}
        role="button"
        aria-label="Close modal"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') closeHandler();
          if (e.key === 'Escape') closeHandler();
        }}
      />
      <dialog open className={classes.modal} aria-modal="true">
        {children}
      </dialog>
    </>
  );
}

export default Modal;
