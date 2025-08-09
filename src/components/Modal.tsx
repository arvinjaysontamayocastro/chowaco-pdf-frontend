import { useNavigate } from "react-router-dom";

import classes from "./Charts.module.css";

function Charts({ children }: any) {
  const navigate = useNavigate();
  function closeHandler() {
    navigate("..");
  }
  return (
    <>
      <div className={classes.backdrop} onClick={closeHandler} />
      <dialog open className={classes.modal}>
        {children}
      </dialog>
    </>
  );
}

export default Modal;
