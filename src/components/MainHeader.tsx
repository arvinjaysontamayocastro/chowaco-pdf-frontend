import { MdPictureAsPdf } from 'react-icons/md';

import classes from './MainHeader.module.css';
import { Link } from 'react-router-dom';
import BackendStatusCard from './BackendStatusCard';

function MainHeader() {
  return (
    <header className={classes.header}>
      <Link to="/" className={classes.headerlogo}>
        <h1 className={classes.logo}>
          <MdPictureAsPdf />
          Juicy Extracts
        </h1>
      </Link>

      <BackendStatusCard />
      <p>
        <Link to="/readme" className={`${classes.button} ${classes.muted}`}>
          READ ME
        </Link>
        <Link to="/" className={classes.button}>
          {/* <MdPostAdd size={18} /> */}
          Process New PDF
        </Link>
      </p>
    </header>
  );
}

export default MainHeader;
