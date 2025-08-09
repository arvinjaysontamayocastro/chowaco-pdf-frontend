import { MdPictureAsPdf, MdOutlinePictureAsPdf } from "react-icons/md";

import classes from "./MainHeader.module.css";
import { Link } from "react-router-dom";

function MainHeader() {
  return (
    <header className={classes.header}>
      <h1 className={classes.logo}>
        <MdPictureAsPdf />
        Juicy Extracts
      </h1>
      <p>
        <Link to="/create-post" className={classes.button}>
          {/* <MdPostAdd size={18} /> */}
          Upload New PDF
        </Link>
      </p>
    </header>
  );
}

export default MainHeader;
