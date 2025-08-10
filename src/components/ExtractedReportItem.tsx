import { Link } from 'react-router-dom';
import classes from './ExtractedReportItem.module.css';
// import { ExtractedReport } from '../types/types';

function ExtractedReportItem(props: any) {
  const { id, name } = props.extractedReport;
  return (
    <li className={classes.post}>
      <Link to={id}>
        <p className={classes.name}>{name}</p>
      </Link>
    </li>
  );
}

export default ExtractedReportItem;
